import re
import fitz  # PyMuPDF
import docx
import io
import json
from typing import Dict, List, Any, Optional
from app.services import gemini_service

SECTION_HEADERS = {
    "education": [r"\beducation\b", r"\bacademic\b", r"\bqualifications\b"],
    "experience": [r"\bexperience\b", r"\bemployment\b", r"\bwork history\b", r"\bprofessional history\b"],
    "projects": [r"\bprojects\b", r"\bacademic projects\b", r"\bpersonal projects\b"],
    "skills": [r"\bskills\b", r"\btechnical skills\b", r"\btechnologies\b", r"\bcompetencies\b"],
    "certifications": [r"\bcertifications\b", r"\bcertificates\b", r"\blicenses\b", r"\bawards\b"]
}

def parse_pdf_to_rdom(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parses a PDF into the Resume Document Model (RDOM).
    Extracts pages, blocks, lines, spans, fonts, weights, colors, and coordinates.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    
    current_section = "summary" # Heuristic: start with summary/intro section
    
    for page_num, page in enumerate(doc):
        width, height = page.rect.width, page.rect.height
        text_dict = page.get_text("dict")
        blocks = []
        
        for b_idx, block in enumerate(text_dict.get("blocks", [])):
            # Skip non-text blocks (type 0 is text, 1 is image)
            if block.get("type") != 0:
                continue
                
            bbox = block.get("bbox")  # [x0, y0, x1, y1]
            lines = block.get("lines", [])
            
            block_text_parts = []
            block_lines_rdom = []
            
            # Aggregate fonts, colors, and sizes to find dominant style in this block
            fonts = {}
            sizes = {}
            colors = {}
            
            for line in lines:
                line_bbox = line.get("bbox")
                line_text_parts = []
                
                for span in line.get("spans", []):
                    span_text = span.get("text", "")
                    if not span_text.strip():
                        continue
                        
                    font = span.get("font", "Helvetica")
                    size = span.get("size", 10.0)
                    color = span.get("color", 0)
                    
                    fonts[font] = fonts.get(font, 0) + len(span_text)
                    sizes[size] = sizes.get(size, 0) + len(span_text)
                    colors[color] = colors.get(color, 0) + len(span_text)
                    
                    line_text_parts.append(span_text)
                
                line_text = " ".join(line_text_parts)
                if line_text.strip():
                    block_text_parts.append(line_text)
                    block_lines_rdom.append({
                        "text": line_text,
                        "bbox": line_bbox,
                        "origin": line.get("spans", [{}])[0].get("origin", [0, 0]) if line.get("spans") else [0, 0]
                    })
            
            block_text = "\n".join(block_text_parts)
            if not block_text.strip():
                continue
                
            dominant_font = max(fonts, key=fonts.get) if fonts else "Helvetica"
            dominant_size = max(sizes, key=sizes.get) if sizes else 10.0
            dominant_color_int = max(colors, key=colors.get) if colors else 0
            
            # Convert color integer to hex string
            r = (dominant_color_int >> 16) & 255
            g = (dominant_color_int >> 8) & 255
            b = dominant_color_int & 255
            dominant_color_hex = f"#{r:02x}{g:02x}{b:02x}"
            
            # Map weights and section types
            font_weight = "bold" if "bold" in dominant_font.lower() or "black" in dominant_font.lower() else "normal"
            
            # Check if this block is a section header (usually short, matches section keyword)
            is_header = False
            if len(block_text.split()) < 4:
                for sec_name, patterns in SECTION_HEADERS.items():
                    if any(re.search(pat, block_text.lower()) for pat in patterns):
                        current_section = sec_name
                        is_header = True
                        break
            
            block_id = f"p{page_num}_b{b_idx}"
            
            blocks.append({
                "id": block_id,
                "page_num": page_num,
                "bbox": bbox,
                "text": block_text,
                "font_family": dominant_font,
                "font_size": dominant_size,
                "font_weight": font_weight,
                "font_color": dominant_color_hex,
                "alignment": "left",
                "line_height": 1.2,
                "section_type": current_section if not is_header else f"header_{current_section}",
                "confidence_score": 1.0,
                "lines": block_lines_rdom
            })
            
        pages.append({
            "page_num": page_num,
            "width": width,
            "height": height,
            "blocks": blocks
        })
        
    doc.close()
    return {"pages": pages, "metadata": {"format": "pdf"}}

def parse_docx_to_rdom(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parses a DOCX file into the Resume Document Model (RDOM).
    Since DOCX lacks absolute page coordinates, we assign virtual coordinates 
    simulating a standard 1-inch (72pt) margin, 612x792 (Letter) layout flow.
    """
    doc = docx.Document(io.BytesIO(file_bytes))
    blocks = []
    
    current_section = "summary"
    
    # Page setup variables (Letter format: 612 x 792 pt)
    page_width = 612.0
    page_height = 792.0
    margin_x = 72.0
    margin_y = 72.0
    usable_width = page_width - (margin_x * 2)
    
    current_y = margin_y
    page_num = 0
    pages = []
    page_blocks = []
    
    b_idx = 0
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
            
        # Get font styles from first run if available
        font_family = "Helvetica"
        font_size = 11.0
        font_color = "#333333"
        font_weight = "normal"
        
        if p.runs:
            run = p.runs[0]
            if run.font.name:
                font_family = run.font.name
            if run.font.size:
                font_size = run.font.size.pt
            if run.bold:
                font_weight = "bold"
            if run.font.color and run.font.color.rgb:
                font_color = f"#{run.font.color.rgb}"
                
        # Estimate height based on character wrapping
        char_limit_per_line = int(usable_width / (font_size * 0.45))
        num_lines = max(1, len(text) // char_limit_per_line)
        lh = font_size * 1.3
        block_h = num_lines * lh + 8.0 # text height + paragraph spacing
        
        # Check for virtual page overflow (Letter bottom margin = 72)
        if current_y + block_h > page_height - margin_y:
            pages.append({
                "page_num": page_num,
                "width": page_width,
                "height": page_height,
                "blocks": page_blocks
            })
            page_num += 1
            page_blocks = []
            current_y = margin_y
            
        # Determine section headers
        is_header = False
        if len(text.split()) < 4:
            for sec_name, patterns in SECTION_HEADERS.items():
                if any(re.search(pat, text.lower()) for pat in patterns):
                    current_section = sec_name
                    is_header = True
                    font_weight = "bold"
                    font_size = 14.0
                    break
                    
        block_id = f"p{page_num}_b{b_idx}"
        bbox = [margin_x, current_y, margin_x + usable_width, current_y + block_h]
        
        # Build lines structure
        words = text.split()
        lines_list = []
        line_chars = char_limit_per_line
        for i in range(0, len(words), 8):
            line_txt = " ".join(words[i:i+8])
            lines_list.append({
                "text": line_txt,
                "bbox": [margin_x, current_y, margin_x + usable_width, current_y + lh],
                "origin": [margin_x, current_y + font_size]
            })
            
        page_blocks.append({
            "id": block_id,
            "page_num": page_num,
            "bbox": bbox,
            "text": text,
            "font_family": font_family,
            "font_size": font_size,
            "font_weight": font_weight,
            "font_color": font_color,
            "alignment": "left",
            "line_height": 1.3,
            "section_type": current_section if not is_header else f"header_{current_section}",
            "confidence_score": 1.0,
            "lines": lines_list
        })
        
        current_y += block_h
        b_idx += 1
        
    if page_blocks:
        pages.append({
            "page_num": page_num,
            "width": page_width,
            "height": page_height,
            "blocks": page_blocks
        })
        
    return {"pages": pages, "metadata": {"format": "docx"}}

def parse_to_rdom(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Orchestrates layout parsing for PDF and DOCX documents."""
    if filename.lower().endswith(".pdf"):
        return parse_pdf_to_rdom(file_bytes)
    elif filename.lower().endswith(".docx"):
        return parse_docx_to_rdom(file_bytes)
    else:
        # Generate raw fallback structure for text uploads
        raw_text = ""
        try:
            raw_text = file_bytes.decode("utf-8")
        except Exception:
            raw_text = str(file_bytes)
        return parse_docx_to_rdom(raw_text.encode("utf-8"))

def generate_reconstruction_suggestions(rdom: Dict[str, Any], target_role: str, jd_text: str = "") -> List[Dict[str, Any]]:
    """
    Analyzes RDOM blocks using Gemini AI to identify weak sentences/bullet points
    and suggests improved professional, ATS-friendly rewrites linked back to block IDs.
    """
    from app.services.analysis import is_metadata_line
    candidates = []
    for page in rdom.get("pages", []):
        for block in page.get("blocks", []):
            sec_type = block.get("section_type", "").lower()
            text = block.get("text", "").strip()
            
            if "header" in sec_type or sec_type == "skills" or len(text.split()) < 5:
                continue
                
            if is_metadata_line(text):
                continue
                
            if sec_type in ["experience", "projects", "summary", "unknown"]:
                candidates.append({
                    "block_id": block.get("id"),
                    "section": sec_type,
                    "text": text
                })
                
    candidates = candidates[:8]
    
    if not candidates:
        return []
        
    client = gemini_service.get_gemini_client()
    if not client:
        return get_sandbox_suggestions(candidates, target_role)
        
    prompt = f"""
    You are an expert resume writer specializing in FAANG and tech recruiting.
    Analyze the following resume blocks (text statements) and provide professional, high-impact improvements (rewrites).
    
    IMPORTANT RULES:
    1. Only rewrite a block if it can be improved to be more professional, grammatically correct, and ATS-friendly.
    2. If the original block is already strong, concise, professional, and ATS-friendly, do not generate any suggestion for it (leave the "suggested" field empty or equal to the original).
    3. You MUST NOT invent any new metrics, percentages, numbers, accuracy values, user counts, revenue, or performance improvements.
    4. You MUST NOT invent any new technologies, responsibilities, achievements, or business outcomes.
    5. Preserve all factual information, technologies, frameworks, companies, roles, and ATS keywords from the original block.
    6. Focus on measurable impact ONLY when verified metrics/numbers already exist in the original block. Do not invent any numbers.
    7. Use this preferred bullet structure:
       "Strong Action Verb + Contribution/Task + Technology or Method + Verified Outcome or Purpose"
    
    Target Role: {target_role}
    Job Description context: {jd_text}
    
    Resume Blocks (JSON format):
    {json.dumps(candidates, indent=2)}
    
    Return a valid JSON array of suggestions matching this schema:
    [
      {{
        "block_id": "string (the exact block_id provided)",
        "original": "string (the original text block content)",
        "suggested": "string (the fully rewritten optimized text block, or original if no improvement needed)",
        "type": "string (set to 'Improvement' if suggestions was generated, or 'Original' if no improvement needed)",
        "explanation": "string (internal explanation)"
      }}
    ]
    
    Do not output markdown code fences. Return raw JSON array only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=None
        )
        suggestions = json.loads(response.text)
        valid_suggestions = []
        for s in suggestions:
            if s.get("block_id") and s.get("suggested"):
                valid_suggestions.append(s)
        return valid_suggestions
    except Exception as e:
        print(f"Gemini API Error in suggestion generator: {e}. Falling back to sandbox.")
        return get_sandbox_suggestions(candidates, target_role)

def get_sandbox_suggestions(candidates: List[Dict[str, Any]], target_role: str) -> List[Dict[str, Any]]:
    """Simulates realistic suggestions for developer sandbox mode or fallback without inventing metrics."""
    suggestions = []
    
    for cand in candidates:
        block_id = cand["block_id"]
        original_text = cand["text"]
        
        rewrite = gemini_service.get_sandbox_bullet_rewrite(original_text)
        suggested = rewrite["rewritten"]
        
        if original_text.strip().startswith(("•", "-", "*")):
            bullet_char = original_text.strip()[0]
            if suggested and not suggested.strip().startswith(("•", "-", "*")):
                suggested = f"{bullet_char} {suggested}"
                
        suggestions.append({
            "block_id": block_id,
            "original": original_text,
            "suggested": suggested,
            "type": "Improvement",
            "explanation": "Optimized bullet using strong verbs."
        })
        
    return suggestions
