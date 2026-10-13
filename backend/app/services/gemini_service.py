import os
import certifi

# Self-healing SSL_CERT_FILE path repair for Windows environments
if "SSL_CERT_FILE" in os.environ and not os.path.exists(os.environ["SSL_CERT_FILE"]):
    os.environ["SSL_CERT_FILE"] = certifi.where()

import json
import re
from typing import Dict, Any, List, Optional, Union, Tuple
from google import genai
from google.genai import types
from app.core.config import settings

def get_gemini_client():
    """Initializes and returns the GenAI client if API key is provided, else None."""
    if settings.GEMINI_API_KEY:
        try:
            return genai.Client(
                api_key=settings.GEMINI_API_KEY,
                http_options={"timeout": 5.0}  # Enforce 5-second timeout for fast fallback
            )
        except Exception as e:
            print(f"Failed to initialize Gemini Client: {e}")
    return None

def get_condensed_resume_context(resume_text: str) -> str:
    """Condenses the full raw resume text to minimize Gemini token usage."""
    lines = resume_text.split('\n')
    lines_clean = [l.strip() for l in lines if len(l.strip()) > 3]
    return "\n".join(lines_clean[:120])

def get_sandbox_recruiter_feedback(name: str, skills: List[str], target_role: str) -> Dict[str, Any]:
    """Generates hyper-realistic simulated recruiter feedback grounded in actual FAANG hiring guidelines."""
    skills_str = ", ".join(skills[:4]) if skills else "relevant industry skills"
    
    google_critique = (
        f"Candidate '{name}' exhibits solid skills in {skills_str}. From a Google screening perspective: "
        "Only 40% of the experience bullets conform to the Google XYZ Formula ('Accomplished X as measured by Y, by doing Z'). "
        "Several bullets list responsibilities instead of technical impact. Google gHire parsers search for signals showing "
        "algorithmic scaling, distributed latency optimizations, and high complexity. Excellent core technical keywords, "
        "but system scale metrics need expansion."
    )
    
    amazon_critique = (
        "Strong indicator of 'Bias for Action' and 'Ownership' principles in your projects. However, Amazon resume screens "
        "require strict STAR (Situation, Task, Action, Result) formatting. We look for high-level data metrics to verify the "
        "result. For instance, 'Worked on backend' should be reframed to prove how you 'Deliver Results'—for example, "
        "'optimizing transaction latency by 15% and saving $4K in monthly AWS infrastructure cost'."
    )
    
    startup_critique = (
        "Great self-starter profile! You've built functional solutions. In a fast-paced startup, we value high execution speed "
        "and product versatility. The technical breadth is clear, but ensure you highlight direct product-market contributions: "
        "for example, user sign-ups driven, wireframing contributions, or full-stack ownership of features."
    )

    return {
        "google": {
            "strengths": [
                f"Excellent core technical alignment with {skills_str}",
                "Good project division showing structured logic",
                "Includes strong action verbs ('Developed', 'Engineered') at sentence starts"
            ],
            "weaknesses": [
                "Lacks explicit compliance with Google's XYZ impact structure in 60% of experience bullets",
                "Does not quantify computing scale (e.g. requests/sec, database sizing, cluster complexity)"
            ],
            "likelihood": "Medium",
            "feedback": google_critique,
            "suggestions": [
                "Structure bullet points explicitly to showcase Accomplishment (X) as measured by Metric (Y) by doing Method (Z).",
                "Add details about systems engineering limits, algorithmic complexity, or performance metrics."
            ]
        },
        "amazon": {
            "strengths": [
                "Demonstrates the 'Customer Obsession' and 'Ownership' leadership principles",
                "Active project delivery history shows self-starting capability"
            ],
            "weaknesses": [
                "Missing business outcomes and cost-saving metrics on core backend updates",
                "Several bullet points focus too much on tasks rather than ownership results"
            ],
            "likelihood": "Medium",
            "feedback": amazon_critique,
            "suggestions": [
                "Format experience bullets strictly using the STAR format (Situation, Task, Action, Result).",
                "Quantify achievements: use numbers, percentages, and currencies to demonstrate LP results."
            ]
        },
        "startup": {
            "strengths": [
                "Broad technical stack indicates high adaptability and fast execution speed",
                "Practical building experience is highly favorable for early stage teams"
            ],
            "weaknesses": [
                "Lacks details on customer impact, user feedback, or direct product thinking",
                "Formatting could be condensed to increase signal density"
            ],
            "likelihood": "High",
            "feedback": startup_critique,
            "suggestions": [
                "Highlight product ownership: explain why you built a feature and how it solved user problems.",
                "Detail full-stack versatility: highlight where you bridged frontend, backend, or design."
            ]
        },
        "lacking_areas": [
            "XYZ Compliance is below 50% in experience descriptions.",
            f"Missing target industry skill signals for a {target_role} track.",
            "Formatting has minor layout risks (potential columns or spacing issues)."
        ],
        "improvement_points": [
            "Structure bullet points explicitly to showcase Accomplishment (X) as measured by Metric (Y) by doing Method (Z).",
            "Add specific metrics: use numbers, percentages, and currencies to demonstrate concrete business outcomes.",
            "Format the document in a standard single-column layout with consistent date styling."
        ]
    }

def get_sandbox_faang_readiness(score_overall: float, target_role: str) -> Dict[str, Any]:
    base_score = int(score_overall)
    
    google_score = max(40, min(95, base_score - 4))
    amazon_score = max(40, min(95, base_score - 2))
    meta_score = max(40, min(95, base_score - 6))
    microsoft_score = max(40, min(95, base_score + 1))
    
    return {
        "google": google_score,
        "amazon": amazon_score,
        "meta": meta_score,
        "microsoft": microsoft_score,
        "breakdown": {
            "google_criteria": {
                "impact": max(40, min(98, base_score - 5)),
                "scale": max(30, min(95, base_score - 8)),
                "complexity": max(40, min(96, base_score - 4))
            },
            "amazon_criteria": {
                "ownership": max(45, min(98, base_score + 3)),
                "metrics": max(30, min(94, base_score - 10)),
                "results": max(40, min(95, base_score - 2))
            },
            "meta_criteria": {
                "product_thinking": max(40, min(95, base_score - 4)),
                "execution": max(45, min(97, base_score + 1))
            },
            "microsoft_criteria": {
                "collaboration": max(50, min(98, base_score + 4)),
                "engineering_depth": max(40, min(95, base_score - 1))
            }
        }
    }

def get_sandbox_bullet_rewrite(bullet: str, style: str = "xyz") -> Dict[str, str]:
    """Generates a realistic simulated high-impact bullet rewrite incorporating candidate's keywords without inventing metrics."""
    clean = bullet.strip()
    clean_lower = clean.lower()
    
    # Check if it's metadata (e.g. very short or matches metadata checks)
    from app.services.analysis import is_metadata_line
    if is_metadata_line(clean):
        return {
            "original": clean,
            "rewritten": "",
            "explanation": "Metadata block excluded from suggestion."
        }
        
    rewritten = clean
    
    # Example 1: Worked on backend APIs using FastAPI.
    if "api" in clean_lower and "fastapi" in clean_lower:
        rewritten = "Developed REST APIs using FastAPI to support reliable backend service integration."
    # Example 2: Created a CNN model with 95% accuracy.
    elif "cnn" in clean_lower and "accuracy" in clean_lower:
        import re
        acc_match = re.search(r'\d+%', clean)
        acc_str = acc_match.group(0) if acc_match else "95%"
        rewritten = f"Developed a TensorFlow-based CNN model that achieved {acc_str} classification accuracy."
    else:
        import re
        # Replace weak verbs at the beginning with strong action verbs
        weak_to_strong = [
            (r'^worked\s+on\b', 'Developed'),
            (r'^helped\s+build\b', 'Collaborated to build'),
            (r'^helped\s+with\b', 'Supported the execution of'),
            (r'^assisted\s+with\b', 'Supported the execution of'),
            (r'^handled\b', 'Managed'),
            (r'^responsible\s+for\b', 'Spearheaded'),
            (r'^involved\s+in\b', 'Engineered'),
        ]
        
        has_replaced = False
        for weak_pat, strong in weak_to_strong:
            replaced_text, count = re.subn(weak_pat, strong, clean, flags=re.IGNORECASE)
            if count > 0:
                rewritten = replaced_text
                has_replaced = True
                break
                
        if not has_replaced:
            words = clean.split()
            if words:
                first_word = words[0].lower()
                from app.services.analysis import STRONG_ACTION_VERBS
                if first_word not in STRONG_ACTION_VERBS:
                    rewritten = "Optimized and " + clean[0].lower() + clean[1:]
                    
    return {
        "original": clean,
        "rewritten": rewritten,
        "explanation": "Optimized bullet using strong verbs and structured formatting."
    }

def analyze_recruiter_feedback(resume_text: str, target_role: str, jd_text: str = "") -> Dict[str, Any]:
    """Retrieves recruiter perspective review using Gemini API based on real FAANG criteria, falling back to mock sandbox."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    
    # Simple details scrape for mock fallback
    name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)', resume_text[:150])
    name = name_match.group(1) if name_match else "Candidate"
    
    detected_skills = []
    for skill in ["React", "Python", "NodeJS", "TypeScript", "AWS", "SQL", "Git"]:
        if skill.lower() in resume_text.lower():
            detected_skills.append(skill)
            
    if not client:
        return get_sandbox_recruiter_feedback(name, detected_skills, target_role)
        
    # Real FAANG-type RAG prompts based on researched guidelines
    prompt = f"""
    You are an elite technical recruiter assessing a candidate's resume for a {target_role} position.
    {"The candidate is applying to this target Job Description: " + jd_text if jd_text else ""}
    
    Resume Text:
    {condensed_resume}
    
    Evaluate the resume strictly using the official guidelines of Google, Amazon, and Startup.
    
    Return a valid JSON object matching this schema:
    {{
      "google": {{
        "strengths": ["string (exactly 2 concise items)"],
        "weaknesses": ["string (exactly 2 concise items)"],
        "likelihood": "Low" | "Medium" | "High",
        "feedback": "string (exactly 1 short sentence, focus on scale)",
        "suggestions": ["string (exactly 2 concise items)"]
      }},
      "amazon": {{
        "strengths": ["string (exactly 2 concise items)"],
        "weaknesses": ["string (exactly 2 concise items)"],
        "likelihood": "Low" | "Medium" | "High",
        "feedback": "string (exactly 1 short sentence, focus on LPs)",
        "suggestions": ["string (exactly 2 concise items)"]
      }},
      "startup": {{
        "strengths": ["string (exactly 2 concise items)"],
        "weaknesses": ["string (exactly 2 concise items)"],
        "likelihood": "Low" | "Medium" | "High",
        "feedback": "string (exactly 1 short sentence, focus on speed)",
        "suggestions": ["string (exactly 2 concise items)"]
      }},
      "lacking_areas": ["string (exactly 2 concise items)"],
      "improvement_points": ["string (exactly 2 concise items)"]
    }}
    Do not output markdown code fences. Return raw JSON text only.
    CRITICAL: Keep all text and suggestion fields extremely short and concise to minimize token generation time.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in recruiter feedback: {e}. Falling back to sandbox.")
        return get_sandbox_recruiter_feedback(name, detected_skills, target_role)

def analyze_faang_readiness(resume_text: str, score_overall: float, target_role: str) -> Dict[str, Any]:
    """Retrieves FAANG readiness ratings from Gemini API based on real company rubrics, falling back to sandbox."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_faang_readiness(score_overall, target_role)
        
    prompt = f"""
    Analyze the resume text and score its readiness for Google, Amazon, Meta, and Microsoft on a scale from 0 to 100.
    The candidate has a computed overall score of {score_overall} and is targeting a {target_role} track.
    
    Resume Text:
    {condensed_resume}
    
    Evaluate each company strictly according to these researched parameters:
    - Google: XYZ compliance, computing scale (QPS, database size), and algorithmic/technical complexity.
    - Amazon: Leadership principles alignment (ownership/bias for action), quantified metrics, and results delivery.
    - Meta: Product-minded engineering, execution/shipping speed, and user growth impact.
    - Microsoft: Systems engineering depth, software craftsmanship/code quality, and cross-team collaboration.
    
    Return a valid JSON object matching this schema:
    {{
      "google": integer_score,
      "amazon": integer_score,
      "meta": integer_score,
      "microsoft": integer_score,
      "breakdown": {{
        "google_criteria": {{ "impact": integer, "scale": integer, "complexity": integer }},
        "amazon_criteria": {{ "ownership": integer, "metrics": integer, "results": integer }},
        "meta_criteria": {{ "product_thinking": integer, "execution": integer }},
        "microsoft_criteria": {{ "collaboration": integer, "engineering_depth": integer }}
      }}
    }}
    Do not output markdown code fences. Return raw JSON only.
    CRITICAL: Avoid any extra comments or text. Generate only the numbers to speed up response.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in FAANG analysis: {e}. Falling back to sandbox.")
        return get_sandbox_faang_readiness(score_overall, target_role)

def rewrite_bullet_point(bullet: str, style: str = "xyz") -> Dict[str, str]:
    """Rewrites a weak bullet point into a high-impact statement using Gemini based on selected style/formula, falling back to sandbox."""
    client = get_gemini_client()
    if not client:
        return get_sandbox_bullet_rewrite(bullet, style)
        
    style_guideline = ""
    if style == "xyz":
        style_guideline = 'You MUST format the rewrite using the Google XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".'
    elif style == "star":
        style_guideline = 'You MUST structure the rewrite using the STAR Method, clearly showing the context, actions, and concrete results.'
    elif style == "action":
        style_guideline = 'You MUST start the statement with a strong, high-impact action verb (e.g. "Spearheaded", "Architected", "Orchestrated") and emphasize your individual contribution.'
    elif style == "quantified":
        style_guideline = 'You MUST focus on maximizing numbers, percentages, dollar amounts, scale metrics, or time savings in the statement.'
        
    prompt = f"""
    You are an expert resume writer specializing in FAANG applications. 
    Rewrite the following bullet point into a professional, concise, and ATS-friendly statement.
    
    Style/Formula Requirement:
    {style_guideline}
    
    CRITICAL RULES:
    1. Do NOT invent any metrics, percentages, accuracy values, user counts, revenue, performance improvements, technologies, responsibilities, achievements, or business outcomes.
    2. Focus on measurable impact ONLY when verified metrics or numbers already exist in the original bullet point. If no metrics exist, do not add any numbers or metrics.
    3. Use this preferred bullet structure: "Strong Action Verb + Contribution/Task + Technology or Method + Verified Outcome or Purpose"
    4. If the original bullet point is already strong, concise, professional, and ATS-friendly, do not change it; return the original text as the rewrite.
    5. Preserve all factual information, technologies, frameworks, roles, and organizations from the original bullet point. Do not remove relevant keywords or rename anything.
    
    Bullet Point to Optimize:
    "{bullet}"
    
    Return a valid JSON object matching this schema:
    {{
      "original": "string",
      "rewritten": "string",
      "explanation": "string"
    }}
    Do not output markdown code fences. Return raw JSON only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in bullet rewriter: {e}. Falling back to sandbox.")
        return get_sandbox_bullet_rewrite(bullet, style)

def get_sandbox_qualitative_grades(resume_text: str, target_role: str) -> Dict[str, float]:
    """Generates realistic simulated grades offline based on simple heuristics in the resume text."""
    metric_count = len(re.findall(r'\d+|%|\$|million|billion|K\b|M\b|\+', resume_text))
    if metric_count >= 8:
        xyz_star = 82.0
    elif metric_count >= 5:
        xyz_star = 75.0
    elif metric_count >= 3:
        xyz_star = 64.0
    elif metric_count >= 1:
        xyz_star = 50.0
    else:
        xyz_star = 35.0

    word_count = len(resume_text.split())
    if 400 <= word_count <= 850:
        formatting = 85.0
    elif word_count < 250 or word_count > 1300:
        formatting = 55.0
    else:
        formatting = 72.0

    role_mentions = len(re.findall(target_role.lower(), resume_text.lower()))
    if role_mentions >= 4:
        alignment = 85.0
    elif role_mentions >= 2:
        alignment = 72.0
    elif role_mentions >= 1:
        alignment = 60.0
    else:
        alignment = 45.0

    if 450 <= word_count <= 750:
        readability = 82.0
    else:
        readability = 68.0

    return {
        "xyz_star_compliance": xyz_star,
        "formatting_parsability": formatting,
        "role_alignment": alignment,
        "content_readability": readability
    }

def grade_resume_qualitative(resume_text: str, target_role: str, jd_text: str = "") -> Dict[str, float]:
    """
    Grades qualitative aspects of the resume using Gemini 2.5 Pro:
    - xyz_star_compliance
    - formatting_parsability
    - role_alignment
    - content_readability
    
    Rubric is calibrated strictly to yield realistic (non-exaggerated) scores.
    """
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_qualitative_grades(resume_text, target_role)

    prompt = f"""
    You are an extremely strict corporate recruiter and Applicant Tracking System (ATS) compliance auditor.
    Your job is to run a brutal qualitative check on a candidate's resume for a {target_role} position.
    {"The target job description details are: " + jd_text if jd_text else ""}

    Resume Text:
    {condensed_resume}

    Grade the following four parameters on a scale of 0 to 100:
    1. xyz_star_compliance: Grade how well experience/project bullets adhere to STAR or Google XYZ formulas.
       - A typical resume describing responsibilities only (e.g. "Responsible for frontend", "Wrote code", "Maintained servers") gets 30-50.
       - Resumes with occasional metrics and active verbs get 55-70.
       - Excellent resumes with quantified metrics showing scale, latency, or business impact in almost every bullet get 75-90.
       - Extremely rare, world-class resumes with massive systems engineering scale or multi-million dollar business outcomes get 90+.
    2. formatting_parsability: Grade the structural cleanliness and parsing layout compatibility.
       - Single-column layouts with clear hierarchy get 80-95.
       - Overly compressed layouts, date format inconsistencies, or mixed column formats get 45-65.
    3. role_alignment: Grade the technical/functional depth of skills and projects for a {target_role} position.
       - A surface-level beginner stack (e.g. just SDE listing basic HTML/CSS/JS) gets 45-60.
       - Deep systems design, architecture, or industry-aligned libraries/concepts get 75-90.
    4. content_readability: Grade the phrasing impact and readability index.
       - Deduct points for generic corporate buzzwords/fluff (e.g. "results-driven team player", "passionate engineer", "highly motivated").
       - Direct, clear, active language gets high scores.

    CRITICAL INSTRUCTION:
    Do NOT exaggerate or inflate the grades. Be brutally honest. Most candidate resumes get around 50-60 overall.
    
    Return a valid JSON object matching this schema:
    {{
      "xyz_star_compliance": float,
      "formatting_parsability": float,
      "role_alignment": float,
      "content_readability": float
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        grades = json.loads(response.text)
        return {
            "xyz_star_compliance": float(grades.get("xyz_star_compliance", 60.0)),
            "formatting_parsability": float(grades.get("formatting_parsability", 60.0)),
            "role_alignment": float(grades.get("role_alignment", 60.0)),
            "content_readability": float(grades.get("content_readability", 60.0))
        }
    except Exception as e:
        print(f"Gemini API Error in qualitative grading: {e}. Falling back to sandbox.")
        return get_sandbox_qualitative_grades(resume_text, target_role)

def get_sandbox_company_fit(company_name: str, category: str, target_role: str) -> Dict[str, Any]:
    """Generates realistic sandbox mock company evaluation guidelines offline based on category."""
    cat_lower = category.lower()
    comp_clean = company_name.strip() or "Target Company"
    
    if "faang" in cat_lower:
        feedback = (
            f"Reviewing for {comp_clean}: Highly rigorous engineering expectations. The resume has clear technical structure, "
            f"but needs stronger indicators of system scale (e.g. queries per second, data size, containerization orchestration). "
            f"FAANG screening requires strict XYZ metric mapping. Several bullets focus on standard responsibilities rather than "
            f"quantifiable scaling achievements."
        )
        strengths = [
            f"Strong technical alignment for {target_role} requirements",
            "Clear section segmentation matching automated ATS structures",
            "Includes active verbs at the start of work descriptions"
        ]
        weaknesses = [
            "Lacks explicit system performance metrics (scale, throughput, database load)",
            "No details on microservice deployment limits or SLA metrics"
        ]
        likelihood = "Medium"
        suggestions = [
            "Restructure achievements using Google's XYZ formula: Accomplished X, as measured by Y, by doing Z.",
            "Quantify scale: Add metrics detailing infrastructure sizes, QPS, or cloud savings."
        ]
    elif "big" in cat_lower:
        feedback = (
            f"Reviewing for {comp_clean}: Enterprise and consulting screening guidelines prioritize structural governance "
            f"and delivery execution. The resume highlights good technical competencies, but should emphasize client-facing "
            f"contributions, project management standards (Agile, Scrum, PMP), and corporate SLA achievements."
        )
        strengths = [
            "Good functional coverage of software engineering lifecycles",
            "Clear timeline details with consistent formatting guidelines",
            "Broad technology skills set"
        ]
        weaknesses = [
            "Needs to emphasize direct client delivery, stakeholder communication, or team leadership structures",
            "Lacks mentions of quality assurance protocols or regulatory compliance standards"
        ]
        likelihood = "High"
        suggestions = [
            "Incorporate client-facing vocabulary: discuss deliverables, timelines, and customer satisfaction metrics.",
            "Highlight project lifecycle governance (e.g., Agile Scrum master duties, cross-team collaboration)."
        ]
    elif "product" in cat_lower:
        feedback = (
            f"Reviewing for {comp_clean}: High-growth product teams look for shipping speed, product ownership, and customer "
            f"empathy. The projects show versatility, but you must prove business outcomes: user growth metrics, feature adoption, "
            f"or specific full-stack ownership. Focus less on listing tech stacks and more on *why* features were built."
        )
        strengths = [
            "Self-starter indicators with core practical projects",
            "Breadth of framework usage shows fast adaptability",
            "High density of actionable programming words"
        ]
        weaknesses = [
            "Lacks metrics showing direct business impact or user experience improvements",
            "Formatting could be more compact to increase the signal-to-noise ratio"
        ]
        likelihood = "Medium"
        suggestions = [
            "Emphasize features shipped from scratch and their direct impact on active users or revenue.",
            "Show user obsession: explain how customer feedback or user testing shaped your frontend design."
        ]
    else: # Service-Based / Default
        feedback = (
            f"Reviewing for {comp_clean}: Global service integrators screen for language proficiency, execution discipline, "
            f"and migration/transition capabilities. Highlight certifications, core language expertise (Java, SQL, Python), "
            f"and compliance with project delivery frameworks."
        )
        strengths = [
            "Strong foundation in core programming paradigms",
            "Good history of collaborative team contributions",
            "Diverse library and toolkit coverage"
        ]
        weaknesses = [
            "Does not clearly highlight software migration, transition, or upgrade achievements",
            "Lacks specific cloud or developer certifications list"
        ]
        likelihood = "High"
        suggestions = [
            "List professional certifications prominently (e.g., AWS Developer, Oracle Java, Scrum Master).",
            "Describe code migrations, legacy system upgrades, or technology migrations you executed."
        ]
        
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "likelihood": likelihood,
        "feedback": feedback,
        "suggestions": suggestions
    }

def evaluate_company_fit(resume_text: str, company_name: str, category: str, target_role: str) -> Dict[str, Any]:
    """Evaluates the candidate's resume fit for a specific target company name and category using Gemini."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_company_fit(company_name, category, target_role)
        
    prompt = f"""
    You are an elite recruiter conducting a candidate resume screen for {company_name}.
    This company belongs to the category: {category} (FAANG, Big 4, Product-Based, or Service-Based).
    The candidate is applying for the position of: {target_role}.
    
    Resume Text:
    {condensed_resume}
    
    Conduct a rigorous, honest fit analysis for {company_name}. Tailor your feedback to match the hiring standards of {company_name} and its category:
    - FAANG (e.g., Google, Meta, Netflix): Demands extreme scale metrics (QPS, database sizes), algorithmic complexity, systems architecture, and strict impact-quantification metrics.
    - Big 4 (e.g., Deloitte, EY, KPMG): Focuses on corporate consulting, enterprise frameworks, compliance, client delivery SLA indicators, stakeholder communication, and structured methodologies.
    - Product-Based (e.g., Stripe, Uber, Canva): Prioritizes velocity, self-directed product ownership, customer empathy, frontend/backend engineering breadth, and business/user outcomes.
    - Service-Based (e.g., TCS, Infosys, Accenture): Prioritizes languages proficiency, project execution discipline, technology migrations, certifications, and compliance with delivery timelines.
    
    Return a valid JSON object matching this schema:
    {{
      "strengths": ["string"],
      "weaknesses": ["string"],
      "likelihood": "Low" | "Medium" | "High",
      "feedback": "A highly detailed, 3-4 sentence recruiter analysis specifically tailored to the culture, hiring standards, and technology stack of {company_name}.",
      "suggestions": ["string"]
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in company fit evaluation: {e}. Falling back to sandbox.")
        return get_sandbox_company_fit(company_name, category, target_role)


def get_sandbox_linkedin_audit(profile_text: str, target_role: str, target_industry: str) -> Dict[str, Any]:
    """Generates a realistic offline simulated LinkedIn audit report."""
    text_len = len(profile_text.strip())
    score = 65
    if text_len > 300:
        score += 15
    if target_role.lower() in profile_text.lower():
        score += 10
    score = min(98, score)

    headline_suggestions = [
        f"{target_role} | Scaling Distributed Systems & Cloud Infrastructure (AWS/Kubernetes) | Product-Minded Engineer",
        f"Software Engineer ({target_role}) @ Tech Startup | Building High-Performance Web Applications with React & Node.js",
        f"Result-Oriented {target_role} | Specialist in Database Query Optimization & API Microservices"
    ]
    
    summary_suggestion = (
        f"Product-focused {target_role} with a proven track record of designing high-throughput backends and responsive frontend dashboards. "
        "Experienced in working across cross-functional teams to ship clean, reusable, and maintainable software. "
        f"Passionate about solving complex algorithmic challenges and optimizing infrastructure scalability in the {target_industry} space."
    )

    return {
        "score_overall": score,
        "completeness_score": min(100, score + 5),
        "keyword_richness": min(100, score - 8),
        "headline_impact": min(100, score - 3),
        "headline_suggestions": headline_suggestions,
        "summary_suggestion": summary_suggestion,
        "strengths": [
            "Good representation of target job role titles",
            "Detailed summary outline highlighting core frameworks"
        ],
        "weaknesses": [
            "Summary is missing structured quantitative achievements (e.g. percentages, scale numbers)",
            "Headline could be more descriptive to show specific system capabilities"
        ],
        "recommendations": [
            "Rewrite your headline to focus on target technologies rather than just a generic job title.",
            "Add measurable results to your experience descriptions to attract recruiters using search queries.",
            "Add at least 15 technical skills to your LinkedIn skills list to improve algorithmic discoverability."
        ]
    }


def audit_linkedin_profile(profile_text: str, target_role: str, target_industry: str) -> Dict[str, Any]:
    """Audits copy-pasted LinkedIn profile segments and details suggestions using Gemini, falling back to mock sandbox."""
    client = get_gemini_client()
    if not client:
        return get_sandbox_linkedin_audit(profile_text, target_role, target_industry)
        
    prompt = f"""
    You are an expert LinkedIn Optimizer. Analyze the candidate's copy-pasted LinkedIn profile text below
    and evaluate it for a {target_role} position in the {target_industry} industry.
    
    LinkedIn Profile Text:
    {profile_text}
    
    Evaluate the profile structure, keyword density, headline strength, and professional summary impact.
    Return a valid JSON object matching this schema:
    {{
      "score_overall": integer_score_0_to_100,
      "completeness_score": integer_score_0_to_100,
      "keyword_richness": integer_score_0_to_100,
      "headline_impact": integer_score_0_to_100,
      "headline_suggestions": ["string (3 diverse, high-impact headline options incorporating keywords and value propositions)"],
      "summary_suggestion": "string (a complete, professionally rewritten LinkedIn 'About' section)",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "recommendations": ["string (highly actionable, concrete steps to improve search index visibility)"]
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in LinkedIn audit: {e}. Falling back to sandbox.")
        return get_sandbox_linkedin_audit(profile_text, target_role, target_industry)


def get_sandbox_cover_letter(resume_text: str, job_description: str, target_role: str, tone: str) -> Dict[str, Any]:
    """Generates a realistic offline simulated cover letter."""
    name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)', resume_text[:150])
    name = name_match.group(1) if name_match else "Candidate Name"
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', resume_text[:200])
    email = email_match.group(0) if email_match else "candidate@resumeiq.ai"
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text[:200])
    phone = phone_match.group(0) if phone_match else "123-456-7890"

    salutation = "Dear Hiring Manager,"
    if "professional" in tone.lower():
        body_start = f"I am writing to express my enthusiastic interest in the {target_role} position at your company. With a solid background in software development and practical experience optimizing systems, I am confident in my ability to contribute value from day one."
        body_mid = "In my previous roles, I have focused on engineering scalable, performant systems and collaborating with cross-functional teams to ship key features. I take pride in implementing clean architecture and solving complex backend bottlenecks."
        body_end = "Thank you for your time and consideration. I welcome the opportunity to discuss how my technical skills and professional goals align with your team's objectives."
    elif "technical" in tone.lower():
        body_start = f"I am applying for the {target_role} role. My technical core aligns directly with the architectural challenges described in your job posting. I specialize in designing microservices and managing cloud infrastructure."
        body_mid = "My developer background includes designing high-performance RESTful APIs, optimizing database transaction throughput, and configuring CI/CD delivery pipelines. I look forward to bringing this engineering focus to your systems."
        body_end = "I look forward to discussing the technical challenges of this role and demonstrating how my background fits your infrastructure needs."
    else: # Conversational
        body_start = f"I was thrilled to see the opening for a {target_role} on your team! I've been following your product's journey and would love to bring my building experience to help drive features forward."
        body_mid = "I love solving user problems and bridging the gap between clean code and great user experiences. Whether it is debugging a complex state machine or collaborating on frontend design, I enjoy the startup agility."
        body_end = "I'd love to chat about how my background as a developer aligns with your product goals. Thanks for taking the time to review my application!"

    letter = f"""{name}
{email} | {phone}

[Date]

Hiring Team
Target Company

{salutation}

{body_start}

{body_mid}

{body_end}

Sincerely,
{name}"""

    return {
        "cover_letter": letter,
        "alignment_strategy": "Highlighted core technical skills (FastAPI, React) and aligned them to the candidate's professional achievements. Tailored the structural tone to the candidate's target preferences."
    }


def generate_cover_letter(resume_text: str, job_description: str, target_role: str, tone: str) -> Dict[str, Any]:
    """Generates a tailored cover letter using Gemini, falling back to mock sandbox."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_cover_letter(resume_text, job_description, target_role, tone)
        
    prompt = f"""
    You are a premium resume writer and career coach. Write a customized cover letter for a candidate applying to a {target_role} position.
    Tailor the letter using the candidate's resume achievements and align them directly with the requirements in the Job Description.
    
    Candidate's Resume:
    {condensed_resume}
    
    Target Job Description:
    {job_description}
    
    Ensure the writing style matches the requested tone: {tone} (Professional, Conversational, or Technical).
    Keep the cover letter to a single page (around 250-350 words). Make sure to extract contact info from the resume for headers.
    
    Return a valid JSON object matching this schema:
    {{
      "cover_letter": "string (the fully formatted cover letter with line breaks)",
      "alignment_strategy": "string (a brief 1-2 sentence description explaining the strategic choices made to optimize the letter)"
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in cover letter tailoring: {e}. Falling back to sandbox.")
        return get_sandbox_cover_letter(resume_text, job_description, target_role, tone)


def get_sandbox_networking_outreach(
    resume_text: str, 
    company_name: str, 
    target_role: str, 
    recipient_type: str, 
    tone: str,
    job_context: Optional[str] = None,
    recipient_name: Optional[str] = None
) -> Dict[str, Any]:
    """Generates a realistic offline simulated outreach template suite with InMail and Follow-ups."""
    name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)', resume_text[:150])
    name = name_match.group(1) if name_match else "Candidate"
    recip = recipient_name.strip() if recipient_name and recipient_name.strip() else f"[{recipient_type}]"
    
    email_subject = f"Inquiry: {target_role} roles at {company_name} - {name}"
    
    if "recruiter" in recipient_type.lower():
        email_body = f"""Hi {recip},

I hope this email finds you well.

My name is {name}, and I am a software engineer specializing in building scalable distributed systems and resilient web applications. I’ve been following {company_name}'s technical momentum and am very interested in current or upcoming {target_role} opportunities on your team.

In my recent projects, I focused on high-throughput API architecture and database query optimization, reducing latency benchmarks by over 30%. I’ve attached my resume for your review and would love the chance to connect for a quick 5-minute chat to see if my background matches your current hiring priorities.

Thank you for your time,
{name}"""
        
        linkedin_message = f"Hi {recip}, hope you're having a great week! I'm a developer focusing on scalable web platforms and very interested in {target_role} roles at {company_name}. I'd love to connect and keep in touch regarding future engineering openings. Best, {name}!"
        
        linkedin_inmail = f"""Hi {recip},

I noticed you manage technical talent acquisition for engineering teams at {company_name}. I'm reaching out because my technical background aligns directly with your {target_role} requirements.

Key highlights from my recent engineering work:
• Architected scalable microservices handling high concurrency with PostgreSQL & Redis caching.
• Automated CI/CD deployment pipelines using Docker and Kubernetes, reducing build cycles significantly.

I'd welcome the chance to share my portfolio and explore whether my skill set could add immediate value to your current engineering initiatives.

Best regards,
{name}"""

        follow_up = f"""Hi {recip},

Following up on my previous message regarding the {target_role} role at {company_name}. I know your inbox is busy, but I wanted to reiterate my strong enthusiasm for your engineering culture.

Please feel free to take a look at my attached resume when you have a moment. Happy to chat whenever convenient!

Best,
{name}"""

        psychology = "Focuses on recruiter utility: summarizes core capabilities, highlights quantifiable impact, and offers low-friction calls-to-action (reviewing resume / connecting)."
        
    elif "manager" in recipient_type.lower():
        email_body = f"""Hi {recip},

I hope your week is off to a great start.

I’m {name}, an engineer with practical experience designing distributed APIs and performant user interfaces. I saw that your engineering group at {company_name} is actively scaling core infrastructure, and I wanted to reach out directly.

I recently architected a microservices pipeline using Python, PostgreSQL, and Redis that significantly optimized latency under load. Given your team's technical focus, I’d love to share insights from that build and learn how your engineers tackle current scaling challenges.

If you have 10 minutes next week, I’d be honored to connect!

Best regards,
{name}"""
        
        linkedin_message = f"Hi {recip}, I saw your engineering team at {company_name} is scaling distributed services. I specialize in backend API architecture and high-throughput databases. Would love to connect and follow your team's updates. Best, {name}!"
        
        linkedin_inmail = f"""Hi {recip},

I've been following your team's technical updates at {company_name}. As an engineer who works deeply with modern web architectures, distributed caching, and containerized cloud services, I wanted to reach out directly.

I recently resolved a major bottleneck in a distributed API cluster, boosting throughput by 38%. I'm eager to bring that same problem-solving discipline to the {target_role} position at {company_name}.

If you have a quick moment, I'd value the chance to discuss your architectural roadmap and see if my experience could be of service.

Best regards,
{name}"""

        follow_up = f"""Hi {recip},

Just wanted to float this back to the top of your inbox. I'd love to chat briefly about how your team approaches system scalability at {company_name}.

Hope you're having a productive week!

Best,
{name}"""

        psychology = "Focuses on peer-level technical respect: references concrete system challenges and architectural problem-solving that directly interest engineering managers."
        
    else: # Peer / Alumni
        email_subject = f"Connecting with a fellow developer - {name}"
        email_body = f"""Hi {recip},

I hope you're having a wonderful week!

My name is {name}, and I'm an engineer passionate about distributed web development. I came across your profile and noticed you're working as an engineer at {company_name}.

I’m currently exploring {target_role} opportunities at {company_name} and would love to hear your first-hand perspective on the developer culture and technical stack. If you have 10 minutes for a virtual coffee chat, I'd deeply appreciate your insights!

Warmly,
{name}"""
        
        linkedin_message = f"Hi {recip}, saw your engineering work at {company_name}! I share a passion for modern software architectures and would love to connect with fellow builders in the community. Best, {name}!"
        
        linkedin_inmail = f"""Hi {recip},

Hope you're having a great week! I noticed your career progression at {company_name} and admire how your engineering team approaches scalable software design.

I'm currently preparing for {target_role} positions and would love to get your honest perspective on what makes engineers thrive at {company_name}. If you have a few minutes for a quick chat, I'd love to connect!

Warm regards,
{name}"""

        follow_up = f"""Hi {recip},

Hope all is well with you! Just checking in to see if you might have a few minutes next week for a brief conversation about {company_name}'s engineering environment. No worries if you're swamped!

Cheers,
{name}"""

        psychology = "Focuses on relationship building: avoids asking for instant referrals and instead seeks advice and shared passion, fostering authentic networking rapport."

    # Ensure strictly <= 300 chars for linkedin_message
    if len(linkedin_message) > 300:
        linkedin_message = linkedin_message[:295].rsplit(" ", 1)[0] + "..."

    return {
        "email_subject": email_subject,
        "email_body": email_body,
        "linkedin_message": linkedin_message,
        "linkedin_inmail": linkedin_inmail,
        "follow_up_message": follow_up,
        "psychology_tip": psychology,
        "hook_highlight": f"High-impact systems experience aligned with {company_name}'s {target_role} requirements",
        "char_count": {
            "linkedin_note": len(linkedin_message),
            "inmail": len(linkedin_inmail)
        },
        "connection_note_300": linkedin_message,
        "inmail": {"subject": f"InMail: {target_role} at {company_name}", "body": linkedin_inmail},
        "cold_email": {"subject": email_subject, "body": email_body},
        "day_5_followup": follow_up
    }


def generate_networking_outreach(
    resume_text: str, 
    company_name: str, 
    target_role: str, 
    recipient_type: str, 
    tone: str,
    job_context: Optional[str] = None,
    recipient_name: Optional[str] = None
) -> Dict[str, Any]:
    """Generates complete networking outreach suite (Email, Connection Note, InMail, Follow-up) using Gemini."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_networking_outreach(resume_text, company_name, target_role, recipient_type, tone, job_context, recipient_name)
        
    recip = recipient_name.strip() if recipient_name and recipient_name.strip() else f"[{recipient_type}]"
    context_str = f"\nSpecific Job Context/Skills:\n{job_context}" if job_context else ""

    prompt = f"""
    You are an elite networking and executive career outreach strategist. 
    Write a complete cold outreach communication package on behalf of a candidate targeting {company_name} for the position of {target_role}.
    The recipient is: {recipient_type} ({recip}).
    The tone must be: {tone}.{context_str}
    
    Candidate's Resume Highlights:
    {condensed_resume}
    
    Generate all 4 tailored communication formats:
    1. Cold Email: Highly compelling Subject Line and clean, personalized Body.
    2. LinkedIn Connection Note: MUST be strictly under 300 characters total (including spaces and punctuation).
    3. LinkedIn InMail Pitch: A high-converting 600-800 character message highlighting 2 key quantified accomplishments from the candidate's resume that match {company_name}.
    4. Follow-up Message: A polite, high-EQ follow-up note to send 5 days after no response.
    5. Psychology Tip: A strategic explanation of why this messaging structure resonates with a {recipient_type}.
    
    Return a valid JSON object matching this exact schema:
    {{
      "email_subject": "string",
      "email_body": "string",
      "linkedin_message": "string (MUST be <= 300 chars)",
      "linkedin_inmail": "string",
      "follow_up_message": "string",
      "psychology_tip": "string",
      "hook_highlight": "string"
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        data = json.loads(response.text)
        # Verify length constraint
        msg = data.get("linkedin_message", "")
        if len(msg) > 300:
            data["linkedin_message"] = msg[:295].rsplit(" ", 1)[0] + "..."
        data["char_count"] = {
            "linkedin_note": len(data.get("linkedin_message", "")),
            "inmail": len(data.get("linkedin_inmail", ""))
        }
        data["connection_note_300"] = data.get("linkedin_message", "")
        data["inmail"] = {"subject": f"InMail: {target_role} at {company_name}", "body": data.get("linkedin_inmail", "")}
        data["cold_email"] = {"subject": data.get("email_subject", ""), "body": data.get("email_body", "")}
        data["day_5_followup"] = data.get("follow_up_message", "")
        return data
    except Exception as e:
        print(f"Gemini API Error in outreach generation: {e}. Falling back to sandbox.")
        return get_sandbox_networking_outreach(resume_text, company_name, target_role, recipient_type, tone, job_context, recipient_name)



def get_sandbox_interview_prep(resume_text: str, target_role: str, company_name: str) -> Dict[str, Any]:
    """Generates realistic offline simulated interview prep questions and answers linked to resume bullets."""
    company_clean = company_name.strip() or "Target Company"
    
    q1 = f"Tell me about a time when you engineered a scalable software system at {company_clean}."
    q2 = "Describe a challenging bug or database performance issue you resolved, and how you measured the outcome."
    q3 = "How do you align design architecture with direct product/user feedback?"
    
    bullet1 = "Developed an AI-powered chatbot backend and system components."
    bullet2 = "Optimized PostgreSQL indexes and query latencies."
    bullet3 = "Coordinated user onboarding flows with engineering teams."

    # Search for actual candidates bullets if available
    lines = resume_text.split('\n')
    bullets = [line.strip() for line in lines if len(line.strip()) > 30 and (line.strip().startswith('-') or line.strip().startswith('*') or line.strip()[0].isdigit())]
    if len(bullets) >= 3:
        bullet1 = bullets[0]
        bullet2 = bullets[1]
        bullet3 = bullets[2]

    return {
        "questions": [
            {
                "question": q1,
                "bullet_ref": bullet1,
                "star_framework": {
                    "situation": "You were tasked with creating or maintaining a key product feature or service module under production constraints.",
                    "task": "Develop an interface or backend component that could handle user flows and process data accurately.",
                    "action": "Implemented code architectures (e.g. FastAPI, cloud infrastructure, indexes) to improve latency and data processing.",
                    "result": "Created a performant implementation that reduced manual engineer overhead and boosted speed."
                },
                "draft_answer": f"In my previous work, I spearheaded the engineering of a core feature: '{bullet1}'. The system was struggling with high manual overhead and latencies. To solve this, I designed a reusable API framework. As a result, we cut manual support times and achieved stable throughput during load times.",
                "pro_tips": f"For {company_clean}, highlight your system boundary choices. Focus on code reusability, testing protocols, and how you quantified stability."
            },
            {
                "question": q2,
                "bullet_ref": bullet2,
                "star_framework": {
                    "situation": "A backend database query or service node was experiencing performance degradation, impacting API roundtrip times.",
                    "task": "Investigate database queries, check execution plans, and apply schema index corrections.",
                    "action": "Analyzed performance logs, optimized key relationships, and deployed connection pools.",
                    "result": "Successfully resolved the performance issue, restoring transaction throughput under heavy traffic loads."
                },
                "draft_answer": f"I was tasked with resolving performance bottlenecks, specifically: '{bullet2}'. By checking database execution plans, I identified slow index structures. I introduced caching layers and optimized tables. This resulted in an immediate throughput increase under peak user loads.",
                "pro_tips": f"{company_clean} values deep analytical investigation. Discuss how you profiled the queries, isolated the root cause, and verified the outcome."
            },
            {
                "question": q3,
                "bullet_ref": bullet3,
                "star_framework": {
                    "situation": "Integrating new feature flows while ensuring high customer satisfaction and minimal regression risks.",
                    "task": "Deliver custom feature enhancements that met specific business and product requirements.",
                    "action": "Collaborated with product designers and front-end teams, conducting user testing and automated integration checks.",
                    "result": "Boosted active onboarding conversion and shipped clean modules ahead of schedule."
                },
                "draft_answer": f"When building key modules like '{bullet3}', I prioritized understanding the user behavior. I worked closely with design and stakeholders, integrating responsive layouts and robust state machines. This directly led to an increase in user activation rates.",
                "pro_tips": f"Emphasize user empathy and speed. Show how you iterated quickly based on feedback and balanced technical debt with product delivery."
            }
        ]
    }


def generate_interview_prep(resume_text: str, target_role: str, company_name: str) -> Dict[str, Any]:
    """Generates personalized interview STAR Q&As linked to candidate resume bullets using Gemini, falling back to mock sandbox."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_interview_prep(resume_text, target_role, company_name)
        
    prompt = f"""
    You are an elite interview coach. Analyze the candidate's resume below and prepare them for a {target_role} interview at {company_name}.
    
    Candidate's Resume:
    {condensed_resume}
    
    Identify 3 key accomplishments or bullet points from the resume that have high impact.
    For each bullet point, generate a company-specific behavioral question that a recruiter at {company_name} would ask.
    Then, structure a highly tailored answer using the STAR method (Situation, Task, Action, Result) based on the candidate's actual bullet.
    Also, draft a complete, professional verbal answer they can use in the interview, and add a "pro_tip" specifically for {company_name}'s culture (e.g. Amazon LP, Google XYZ/scale, Startup velocity).
    
    Return a valid JSON object matching this schema:
    {{
      "questions": [
        {{
          "question": "string (the behavioral interview question)",
          "bullet_ref": "string (the exact or summarized bullet point from their resume this prepares them for)",
          "star_framework": {{
            "situation": "string",
            "task": "string",
            "action": "string",
            "result": "string"
          }},
          "draft_answer": "string (a fully drafted response they can read or speak)",
          "pro_tips": "string"
        }}
      ]
    }}
    Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in interview prep: {e}. Falling back to sandbox.")
        return get_sandbox_interview_prep(resume_text, target_role, company_name)


def get_sandbox_chat_response(message: str, target_role: str) -> Dict[str, Any]:
    msg = message.lower()
    if "skill" in msg:
        reply = (
            f"Based on your resume, you have a solid foundation, but for a {target_role} role, "
            "make sure to list both core languages (like Python, TypeScript) and tools (like Docker, AWS). "
            "I recommend adding missing high-priority ATS keywords to your Skills section."
        )
    elif "project" in msg:
        reply = (
            f"For a {target_role} position, your projects should highlight scale and business impact. "
            "Instead of just listing technologies, describe the problem, your action, and the result. "
            "For example: 'Optimized query latency by 35% using Redis caching and PostgreSQL indexing.'"
        )
    elif "optimize" in msg or "xyz" in msg or "bullet" in msg or "rewrite" in msg:
        reply = (
            "To optimize your resume achievements, use the Google XYZ Formula: "
            "'Accomplished [X] as measured by [Y], by doing [Z]'. Start each bullet point with a "
            "strong active verb (e.g., Spearheaded, Architected, Consolidated) and quantify the business result."
        )
    elif "ats" in msg or "score" in msg or "scan" in msg:
        reply = (
            f"Your ATS score is calculated based on structure, formatting safety, and keyword alignment. "
            f"For {target_role} roles, standard applicant tracking systems scan for specific section headers "
            "like 'Experience' and 'Education'. Keep your layout single-column and avoid graphic tables or progress bars."
        )
    else:
        reply = (
            f"I've reviewed your resume highlights for the {target_role} role. "
            "Feel free to ask me to analyze your skills gaps, rewrite weak bullet points, or structure STAR scenario answers!"
        )
    return {"response": reply}


def chat_with_copilot(resume_text: str, message: str, target_role: str) -> Dict[str, Any]:
    """Generates conversational AI responses using Gemini, incorporating resume context, with sandbox fallback."""
    client = get_gemini_client()
    condensed_resume = get_condensed_resume_context(resume_text)
    if not client:
        return get_sandbox_chat_response(message, target_role)
        
    prompt = f"""
    You are an elite career copilot and resume consultant. Answer the candidate's message about their resume in a helpful, concise, and professional tone.
    The candidate is targeting a {target_role} position.
    
    Candidate's Resume Highlights:
    {condensed_resume}
    
    Candidate's Message:
    {message}
    
    Instructions:
    - Ground your response in the candidate's actual resume context.
    - Provide concrete, actionable suggestions (e.g., formatting improvements, specific keywords to add, bullet point rewrites).
    - Keep the reply conversational but highly focused on career and resume optimization.
    - Respond in raw JSON format matching this schema: {{"response": "your detailed message here"}}
    - Do not output markdown code fences. Return raw JSON text only.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error in chat copilot: {e}. Falling back to sandbox.")
        return get_sandbox_chat_response(message, target_role)


def analyze_filler_words(text: str) -> List[Dict[str, Any]]:
    """Identifies common verbal crutches and filler phrases in the response."""
    lower_text = text.lower()
    detected = []
    fillers = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of", "i mean", "right"]
    for fw in fillers:
        pattern = r'\b' + re.escape(fw) + r'\b'
        matches = len(re.findall(pattern, lower_text))
        if matches > 0:
            detected.append({"word": fw, "count": matches})
    return detected


def evaluate_interview_answer(
    question: str,
    user_answer: str,
    target_role: str,
    company_name: str,
    resume_bullet: Optional[str] = None
) -> Dict[str, Any]:
    """Evaluates an interview response against the STAR method and company culture expectations."""
    filler_words = analyze_filler_words(user_answer)
    word_count = len(user_answer.split())
    
    client = get_gemini_client()
    if not client:
        return get_sandbox_interview_evaluation(question, user_answer, target_role, company_name, filler_words)
        
    prompt = f"""
    You are a Principal Technical Recruiter and Hiring Manager evaluating a candidate's verbal response to an interview question.
    
    Target Role: {target_role}
    Company: {company_name}
    Interview Question: "{question}"
    Candidate's Resume Reference (Context): "{resume_bullet or 'N/A'}"
    Candidate's Practice Answer:
    "{user_answer}"
    
    Evaluate the response thoroughly using the STAR method (Situation, Task, Action, Result).
    
    Provide:
    1. An overall score (0 - 100).
    2. STAR Dimension breakdown scores (0 - 100) and specific 1-2 sentence feedback for each:
       - Situation: How well was the context/problem set up?
       - Task: Was the candidate's exact responsibility clear?
       - Action: Did they emphasize personal ownership with strong verbs ("I built", "I spearheaded" vs passive "we did")?
       - Result: Did they quantify the business outcome with metrics, latency, revenue, or team impact?
    3. 2-3 specific Strengths.
    4. 2-3 specific Actionable Improvements.
    5. A Refined Exemplar Answer: A polished, high-impact version of what the candidate said that sounds natural, confident, and persuasive.
    
    Return a valid JSON object matching this schema:
    {{
      "overall_score": integer (0 to 100),
      "verdict": "string ('Strong Hire', 'Hire', 'Borderline', 'Needs Improvement')",
      "star_ratings": {{
        "situation": {{"score": integer, "feedback": "string"}},
        "task": {{"score": integer, "feedback": "string"}},
        "action": {{"score": integer, "feedback": "string"}},
        "result": {{"score": integer, "feedback": "string"}}
      }},
      "strengths": ["string", "string"],
      "improvements": ["string", "string"],
      "refined_answer": "string",
      "pacing_feedback": "string"
    }}
    
    Do not output markdown code fences. Return raw JSON text only.
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        res_data = json.loads(response.text)
        res_data["filler_words"] = filler_words
        res_data["word_count"] = word_count
        return res_data
    except Exception as e:
        print(f"Gemini API Error in answer evaluation: {e}. Falling back to sandbox.")
        return get_sandbox_interview_evaluation(question, user_answer, target_role, company_name, filler_words)


def get_sandbox_interview_evaluation(
    question: str,
    user_answer: str,
    target_role: str,
    company_name: str,
    filler_words: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates realistic STAR scoring heuristics for offline sandbox testing."""
    words = user_answer.split()
    word_count = len(words)
    
    has_metrics = bool(re.search(r'\d+|%|\$|saved|reduced|increased|optimized', user_answer, re.I))
    has_first_person = bool(re.search(r'\b(i|my|me)\b', user_answer, re.I))
    
    sit_score = 88 if word_count > 30 else 72
    task_score = 85 if "goal" in user_answer.lower() or "responsible" in user_answer.lower() or word_count > 40 else 74
    act_score = 92 if has_first_person and word_count > 50 else 78
    res_score = 90 if has_metrics else 70
    
    overall = int((sit_score * 0.2) + (task_score * 0.2) + (act_score * 0.3) + (res_score * 0.3))
    verdict = "Strong Hire" if overall >= 85 else "Hire" if overall >= 75 else "Borderline" if overall >= 65 else "Needs Improvement"
    
    strengths = [
        f"Directly addressed the core scenario required for {company_name}.",
        "Demonstrated technical context and proactive engineering judgment."
    ]
    if has_metrics:
        strengths.append("Included quantifiable outcomes which hiring managers look for.")
        
    improvements = [
        "Frame the initial Situation concisely in 1-2 sentences to maximize time for your Action steps.",
        "Highlight personal contributions using active ownership verbs like 'Architected' or 'Spearheaded'."
    ]
    if not has_metrics:
        improvements.append("Quantify the end result (e.g. latency reduced by X%, users impacted, or team hours saved).")
        
    refined = (
        f"At my previous role, our team faced a critical scalability challenge with our microservices. "
        f"As the primary engineer for our {target_role} scope, I spearheaded the refactoring of our data pipeline "
        f"and implemented asynchronous caching with Redis. This eliminated our bottleneck, boosted query throughput by 42%, "
        f"and ensured zero downtime during peak traffic."
    )
    
    return {
        "overall_score": overall,
        "verdict": verdict,
        "star_ratings": {
            "situation": {"score": sit_score, "feedback": "Good context setup without over-explaining background details."},
            "task": {"score": task_score, "feedback": "Identified the primary challenge and business expectations."},
            "action": {"score": act_score, "feedback": "Strong personal ownership verbs emphasizing direct technical contributions."},
            "result": {"score": res_score, "feedback": "Outcome is stated clearly; adding verified percentage metrics will maximize impact."}
        },
        "strengths": strengths,
        "improvements": improvements,
        "refined_answer": refined,
        "pacing_feedback": f"Response length is {word_count} words (~{max(1, word_count // 130)} min speaking time). Optimal range is 120-220 words.",
        "filler_words": filler_words,
        "word_count": word_count
    }


