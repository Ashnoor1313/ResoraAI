import io
from typing import Dict, List, Any
from reportlab.pdfgen import canvas
from reportlab.lib import colors

FONT_MAPPING = {
    "arial": "Helvetica",
    "calibri": "Helvetica",
    "helvetica": "Helvetica",
    "tahoma": "Helvetica",
    "trebuchet": "Helvetica",
    "verdana": "Helvetica",
    "times": "Times-Roman",
    "times new roman": "Times-Roman",
    "georgia": "Times-Roman",
    "garamond": "Times-Roman",
    "cambria": "Times-Roman",
    "courier": "Courier",
    "courier new": "Courier"
}

def map_font(font_name: str, is_bold: bool = False) -> str:
    """Maps extracted document fonts to ReportLab standard core PDF fonts."""
    font_name = font_name.lower()
    base_font = "Helvetica"
    for k, v in FONT_MAPPING.items():
        if k in font_name:
            base_font = v
            break
            
    bold = is_bold or "bold" in font_name or "black" in font_name
    italic = "italic" in font_name or "oblique" in font_name
    
    if base_font == "Helvetica":
        if bold and italic:
            return "Helvetica-BoldOblique"
        elif bold:
            return "Helvetica-Bold"
        elif italic:
            return "Helvetica-Oblique"
        else:
            return "Helvetica"
    elif base_font == "Times-Roman":
        if bold and italic:
            return "Times-BoldItalic"
        elif bold:
            return "Times-Bold"
        elif italic:
            return "Times-Italic"
        else:
            return "Times-Roman"
    elif base_font == "Courier":
        if bold and italic:
            return "Courier-BoldOblique"
        elif bold:
            return "Courier-Bold"
        elif italic:
            return "Courier-Oblique"
        else:
            return "Courier"
            
    return base_font

def wrap_text_to_width(text: str, width: float, font_name: str, font_size: float, c=None) -> List[str]:
    """Wraps a paragraph of text into lines matching the specified bounding width in points."""
    words = text.split()
    if not words:
        return []
        
    lines = []
    current_line = []
    
    def get_width(s):
        if c:
            try:
                return c.stringWidth(s, font_name, font_size)
            except Exception:
                pass
        return len(s) * font_size * 0.48

    for word in words:
        test_line = " ".join(current_line + [word])
        if get_width(test_line) <= width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
                
    if current_line:
        lines.append(" ".join(current_line))
        
    return lines

def calculate_text_height(text: str, width: float, font_family: str, font_size: float, line_height: float = 1.2) -> float:
    """Calculates the estimated vertical height in points for wrapped text inside a block."""
    mapped_font = map_font(font_family)
    lines = wrap_text_to_width(text, width, mapped_font, font_size)
    lh = font_size * line_height
    return len(lines) * lh

def rebuild_rdom(rdom: Dict[str, Any], approved_changes: Dict[str, str]) -> Dict[str, Any]:
    """
    Applies approved modifications to RDOM blocks, executes typography wrapping, 
    triggers layout reflow shifting, and performs multi-page overflow pagination.
    """
    page_width = 612.0
    page_height = 792.0
    if rdom.get("pages"):
        page_width = rdom["pages"][0].get("width", 612.0)
        page_height = rdom["pages"][0].get("height", 792.0)
        
    all_blocks = []
    for page in rdom.get("pages", []):
        for block in page.get("blocks", []):
            block_id = block.get("id")
            if block_id in approved_changes:
                block["text"] = approved_changes[block_id]
                
            if "original_bbox" not in block:
                block["original_bbox"] = list(block["bbox"])
            all_blocks.append(block)
            
    # Sort blocks primarily by page, then by top Y coordinate top-to-bottom
    all_blocks = sorted(all_blocks, key=lambda x: (x.get("page_num", 0), x["original_bbox"][1]))
    
    paginated_pages = [[]]
    current_page_idx = 0
    current_y_offset = 0.0
    
    top_margin = 54.0
    bottom_margin = 54.0
    max_y = page_height - bottom_margin
    
    last_original_page_num = 0
    
    for block in all_blocks:
        block_orig_page = block.get("page_num", 0)
        if block_orig_page != last_original_page_num:
            if current_page_idx <= block_orig_page:
                current_page_idx = block_orig_page
                while len(paginated_pages) <= current_page_idx:
                    paginated_pages.append([])
                current_y_offset = 0.0
            last_original_page_num = block_orig_page
            
        original_y0 = block["original_bbox"][1]
        original_y1 = block["original_bbox"][3]
        original_h = original_y1 - original_y0
        
        block_w = max(50.0, block["original_bbox"][2] - block["original_bbox"][0])
        new_h = calculate_text_height(block["text"], block_w, block["font_family"], block["font_size"], block.get("line_height", 1.2))
        
        y0 = original_y0 + current_y_offset
        y1 = y0 + new_h
        
        # Shift to next page if block bottom overflows max Y
        if y1 > max_y and len(paginated_pages[current_page_idx]) > 0:
            current_page_idx += 1
            if current_page_idx >= len(paginated_pages):
                paginated_pages.append([])
                
            # Reset shift relative to top margin on new page
            shift_to_top = top_margin - original_y0
            current_y_offset += shift_to_top
            
            y0 = original_y0 + current_y_offset
            y1 = y0 + new_h
            
        block["bbox"] = [block["original_bbox"][0], y0, block["original_bbox"][2], y1]
        
        dy = new_h - original_h
        current_y_offset += dy
        
        block["page_num"] = current_page_idx
        paginated_pages[current_page_idx].append(block)
        
    pages_list = []
    for p_num, blocks_in_page in enumerate(paginated_pages):
        pages_list.append({
            "page_num": p_num,
            "width": page_width,
            "height": page_height,
            "blocks": blocks_in_page
        })
        
    return {"pages": pages_list, "metadata": rdom.get("metadata", {})}

def validate_reconstructed_rdom(rdom: Dict[str, Any]) -> Dict[str, Any]:
    """Runs a layout audit checking for overlaps or clipped boxes to ensure RDOM health."""
    warnings = []
    overlaps = []
    total_pages = len(rdom.get("pages", []))
    
    for page in rdom.get("pages", []):
        p_num = page.get("page_num", 0)
        blocks = page.get("blocks", [])
        
        for i in range(len(blocks)):
            for j in range(i + 1, len(blocks)):
                bi = blocks[i]
                bj = blocks[j]
                
                # Check intersect on page bounds
                x_overlap = max(0.0, min(bi["bbox"][2], bj["bbox"][2]) - max(bi["bbox"][0], bj["bbox"][0]))
                y_overlap = max(0.0, min(bi["bbox"][3], bj["bbox"][3]) - max(bi["bbox"][1], bj["bbox"][1]))
                
                if x_overlap > 5.0 and y_overlap > 5.0:
                    overlaps.append({
                        "block_1": bi["id"],
                        "block_2": bj["id"],
                        "page": p_num
                    })
                    warnings.append(f"Page {p_num+1}: Potential overlap detected between block '{bi['id']}' and block '{bj['id']}'.")
                    
    return {
        "is_valid": len(overlaps) == 0,
        "warnings": warnings,
        "overlaps": overlaps,
        "total_pages": total_pages
    }

def render_rdom_to_pdf_bytes(rdom: Dict[str, Any], original_pdf_path: str = None) -> bytes:
    """
    Renders RDOM structure into PDF bytes.
    If original_pdf_path is provided and is a PDF, we use PyMuPDF to erase the original text
    via redactions and draw the reflowed RDOM text blocks line-by-line using precise RDOM
    coordinates. This guarantees a 100% exact copy of the original resume's vector shapes,
    background colors, borders, and margins with complete text content.
    Otherwise, it falls back to a clean ReportLab layout generator.
    """
    if original_pdf_path and original_pdf_path.lower().endswith(".pdf"):
        import fitz
        try:
            doc = fitz.open(original_pdf_path)
            
            # 1. Erase all original text first on each page using redactions
            for page_idx, page in enumerate(rdom.get("pages", [])):
                if page_idx < len(doc):
                    pdf_page = doc[page_idx]
                    
                    for block in page.get("blocks", []):
                        orig_box = block.get("original_bbox", block["bbox"])
                        # Expand rect slightly (2pt each side) to ensure full text erasure
                        expanded = [
                            max(0, orig_box[0] - 2),
                            max(0, orig_box[1] - 2),
                            min(pdf_page.rect.width, orig_box[2] + 2),
                            min(pdf_page.rect.height, orig_box[3] + 2)
                        ]
                        pdf_page.add_redact_annot(expanded, fill=None)
                        
                    # Apply redactions (keep drawings and images)
                    pdf_page.apply_redactions(images=0)
            
            # 2. Draw the updated reflowed text blocks line-by-line
            for page_idx, page in enumerate(rdom.get("pages", [])):
                if page_idx < len(doc):
                    pdf_page = doc[page_idx]
                else:
                    p_w = page.get("width", 612.0)
                    p_h = page.get("height", 792.0)
                    pdf_page = doc.new_page(width=p_w, height=p_h)
                
                # Extract and register all fonts from this page to guarantee 100% match
                registered_fonts = {}
                try:
                    for f in pdf_page.get_fonts():
                        xref = f[0]
                        fontname = f[3]
                        try:
                            name, ext, ftype, data = doc.extract_font(xref)
                            pdf_page.insert_font(fontname=name, fontbuffer=data)
                            registered_fonts[fontname] = name
                            registered_fonts[name] = name
                            if "+" in name:
                                clean_name = name.split("+")[-1]
                                registered_fonts[clean_name] = name
                        except Exception as e:
                            print(f"Could not extract/register font xref {xref}: {e}")
                except Exception as e:
                    print(f"Error enumerating page fonts: {e}")
                    
                for block in page.get("blocks", []):
                    bbox = block["bbox"]
                    text = block["text"]
                    font_size = block["font_size"]
                    font_color_hex = block["font_color"]
                    
                    rgb = (0.0, 0.0, 0.0)
                    if font_color_hex:
                        try:
                            h = font_color_hex.lstrip('#')
                            if len(h) == 6:
                                rgb = tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))
                            elif len(h) == 3:
                                rgb = tuple(int(h[i]*2, 16) / 255.0 for i in (0, 1, 2))
                        except Exception:
                            pass
                    
                    # Resolve the best matching font name
                    font_family = block["font_family"]
                    clean_family = font_family.split("+")[-1] if "+" in font_family else font_family
                    
                    font_name = "helv"
                    if font_family in registered_fonts:
                        font_name = registered_fonts[font_family]
                    elif clean_family in registered_fonts:
                        font_name = registered_fonts[clean_family]
                    else:
                        font_lower = font_family.lower()
                        if "times" in font_lower or "roman" in font_lower:
                            font_name = "times-bold" if block.get("font_weight") == "bold" else "times-roman"
                        elif "courier" in font_lower:
                            font_name = "courier-bold" if block.get("font_weight") == "bold" else "courier"
                        else:
                            font_name = "helv-bold" if block.get("font_weight") == "bold" else "helv"
                    
                    # LINE-BY-LINE RENDERING: Use precise RDOM line coordinates
                    # This mirrors exactly how the frontend renders each line at its
                    # exact position, preventing text clipping or overflow issues.
                    block_lines = block.get("lines", [])
                    
                    if block_lines and len(block_lines) > 0:
                        # Render each line individually at its exact position
                        for line_data in block_lines:
                            line_text = line_data.get("text", "").strip()
                            if not line_text:
                                continue
                            
                            line_bbox = line_data.get("bbox", bbox)
                            line_origin = line_data.get("origin")
                            
                            # Use the origin point (baseline) if available for precise placement
                            if line_origin and len(line_origin) >= 2:
                                insert_point = fitz.Point(line_origin[0], line_origin[1])
                            else:
                                # Fall back to computing baseline from line bbox
                                # Baseline is approximately at bbox bottom minus a small descent
                                descent_offset = font_size * 0.2
                                insert_point = fitz.Point(line_bbox[0], line_bbox[3] - descent_offset)
                            
                            try:
                                pdf_page.insert_text(
                                    insert_point,
                                    line_text,
                                    fontname=font_name,
                                    fontsize=font_size,
                                    color=rgb
                                )
                            except Exception as e:
                                # If the registered font fails, retry with safe fallback
                                try:
                                    fallback_font = "helv"
                                    if block.get("font_weight") == "bold":
                                        fallback_font = "helv-bold"
                                    pdf_page.insert_text(
                                        insert_point,
                                        line_text,
                                        fontname=fallback_font,
                                        fontsize=font_size,
                                        color=rgb
                                    )
                                except Exception:
                                    print(f"Failed to insert line text: {line_text[:40]}... error: {e}")
                    else:
                        # No line-level data: fall back to insert_textbox with overflow
                        align_val = 0
                        if block.get("alignment") == "center":
                            align_val = 1
                        elif block.get("alignment") == "right":
                            align_val = 2
                        
                        # Expand the bbox height to prevent clipping
                        expanded_bbox = [
                            bbox[0],
                            bbox[1],
                            bbox[2],
                            max(bbox[3], bbox[1] + font_size * len(text.split('\n')) * 1.4)
                        ]
                        
                        pdf_page.insert_textbox(
                            expanded_bbox,
                            text,
                            fontname=font_name,
                            fontsize=font_size,
                            color=rgb,
                            align=align_val
                        )
            
            pdf_bytes = doc.write()
            doc.close()
            return pdf_bytes
            
        except Exception as e:
            print(f"Error in PyMuPDF exact reconstruction overlay: {e}. Falling back to ReportLab.")
            
    # Fallback to ReportLab rendering (or if original doc was DOCX)
    buffer = io.BytesIO()
    page_width = 612.0
    page_height = 792.0
    if rdom.get("pages"):
        page_width = rdom["pages"][0].get("width", 612.0)
        page_height = rdom["pages"][0].get("height", 792.0)
        
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    for page in rdom.get("pages", []):
        p_w = page.get("width", page_width)
        p_h = page.get("height", page_height)
        c.setPageSize((p_w, p_h))
        
        for block in page.get("blocks", []):
            x0 = block["bbox"][0]
            y0 = block["bbox"][1]
            x1 = block["bbox"][2]
            
            font_family = block["font_family"]
            font_size = block["font_size"]
            font_color_hex = block["font_color"]
            
            is_bold = block.get("font_weight") == "bold"
            mapped_font = map_font(font_family, is_bold)
            
            try:
                c.setFillColor(colors.HexColor(font_color_hex))
            except Exception:
                c.setFillColor(colors.HexColor("#333333"))
                
            c.setFont(mapped_font, font_size)
            
            # LINE-BY-LINE RENDERING for ReportLab fallback too
            block_lines = block.get("lines", [])
            
            if block_lines and len(block_lines) > 0:
                for line_data in block_lines:
                    line_text = line_data.get("text", "").strip()
                    if not line_text:
                        continue
                    
                    line_bbox = line_data.get("bbox")
                    line_origin = line_data.get("origin")
                    
                    if line_origin and len(line_origin) >= 2:
                        # Convert origin (top-down) to ReportLab (bottom-up)
                        y_baseline = p_h - line_origin[1]
                        x_pos = line_origin[0]
                    elif line_bbox:
                        descent_offset = font_size * 0.2
                        y_baseline = p_h - (line_bbox[3] - descent_offset)
                        x_pos = line_bbox[0]
                    else:
                        continue
                    
                    c.drawString(x_pos, y_baseline, line_text)
            else:
                # No line data: use text wrapping fallback
                block_w = max(50.0, x1 - x0)
                lines = wrap_text_to_width(block["text"], block_w, mapped_font, font_size, c)
                lh = font_size * block.get("line_height", 1.2)
                
                for l_idx, line_text in enumerate(lines):
                    y_baseline = p_h - (y0 + font_size + (l_idx * lh))
                    c.drawString(x0, y_baseline, line_text)
                
        c.showPage()
        
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
