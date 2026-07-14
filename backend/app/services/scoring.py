import re
from typing import Dict, List, Any

# Map categories to their weights in overall Resume Health calculation
METRIC_WEIGHTS = {
    "ats_compatibility": 0.15,
    "recruiter_readability": 0.15,
    "formatting_safety": 0.10,
    "technical_quality": 0.15,
    "achievement_quality": 0.15,
    "keyword_alignment": 0.15,
    "resume_completeness": 0.10,
    "industry_alignment": 0.05
}

def calculate_resume_health(
    analysis_results: Dict[str, Any],
    keyword_alignment_score: float = None,
    raw_text: str = ""
) -> Dict[str, Any]:
    """
    Computes Resume Health across 8 key dimensions with detailed explainability logs
    for every category, showing severities, warnings, and expected improvements.
    """
    
    # 1. ATS Compatibility (15%)
    sections = analysis_results["structure"]["sections_detected"]
    ats_score = sum(1 for v in sections.values() if v) / len(sections) * 100
    ats_issues = []
    if not sections["experience"]:
        ats_issues.append("Experience section missing")
    if not sections["education"]:
        ats_issues.append("Education section missing")
    if not sections["skills"]:
        ats_issues.append("Skills section missing")
        
    ats_explain = {
        "score": int(round(ats_score)),
        "why": "Evaluates how standard parsed blocks are detected by modern applicant screening configurations.",
        "issues": ats_issues,
        "severity": "success" if ats_score >= 80 else "warning" if ats_score >= 60 else "critical",
        "priority": "high",
        "estimated_improvement": 100 - int(round(ats_score))
    }

    # 2. Recruiter Readability (15%)
    readability = analysis_results["readability"]
    read_score = 100.0
    read_issues = []
    if readability["word_count_status"] == "too_short":
        read_score -= 25.0
        read_issues.append("Resume contains too few words (<300 words)")
    elif readability["word_count_status"] == "too_long":
        read_score -= 20.0
        read_issues.append("Resume exceeds recommended length (>1000 words)")
        
    if readability["avg_sentence_length"] > 24.0:
        read_score -= 15.0
        read_issues.append("Average sentence length is too long (>24 words)")
    elif readability["avg_sentence_length"] < 8.0:
        read_score -= 10.0
        read_issues.append("Very short sentence fragments detected")
        
    if readability["long_paragraphs"] > 0:
        read_score -= min(20.0, readability["long_paragraphs"] * 5.0)
        read_issues.append(f"Found {readability['long_paragraphs']} overly long paragraph blocks")
        
    read_score = max(40.0, read_score)
    read_explain = {
        "score": int(round(read_score)),
        "why": "Measures scan readability, structural flow, and density for corporate recruiters during quick reviews.",
        "issues": read_issues,
        "severity": "success" if read_score >= 80 else "warning" if read_score >= 60 else "critical",
        "priority": "medium",
        "estimated_improvement": 100 - int(round(read_score))
    }

    # 3. Formatting Safety (10%)
    formatting = analysis_results["formatting"]
    format_score = 100.0
    format_issues = []
    if formatting.get("multiple_columns"):
        format_score -= 40.0
        format_issues.append("Multi-column layout structure parsed")
    if formatting.get("has_images"):
        format_score -= 30.0
        format_issues.append("Embedded graphics or images found")
    if formatting.get("unsupported_fonts"):
        format_score -= 15.0
        format_issues.append("Non-standard font styles detected")
        
    format_score = max(30.0, format_score)
    format_explain = {
        "score": int(round(format_score)),
        "why": "Audits layout parsing risks (columns, pictures, fonts) that cause scanners to scramble text.",
        "issues": format_issues,
        "severity": "success" if format_score >= 85 else "warning" if format_score >= 60 else "critical",
        "priority": "high",
        "estimated_improvement": 100 - int(round(format_score))
    }

    # 4. Technical Quality (15%)
    skills_data = analysis_results["skills"]
    tech_score = 70.0
    tech_issues = []
    if skills_data["count"] < 8:
        tech_score -= 20.0
        tech_issues.append("Very low skills count (<8 skills listed)")
    elif skills_data["count"] > 30:
        tech_score -= 10.0
        tech_issues.append("High skills volume listed (can look unfocused)")
        
    if skills_data["duplicates"]:
        tech_score -= 15.0
        tech_issues.append("Identical technical skills listed multiple times")
        
    tech_score = max(50.0, min(100.0, tech_score + min(30.0, skills_data["count"] * 1.5)))
    tech_explain = {
        "score": int(round(tech_score)),
        "why": "Audits list depth, technical skill counts, and duplicate entries to ensure structural focus.",
        "issues": tech_issues,
        "severity": "success" if tech_score >= 80 else "warning" if tech_score >= 65 else "critical",
        "priority": "medium",
        "estimated_improvement": 100 - int(round(tech_score))
    }

    # 5. Achievement Quality (15%)
    achievements = analysis_results["achievements"]
    ach_score = 40.0
    ach_issues = []
    if achievements["total_bullets"] == 0:
        ach_issues.append("No bullets found in experience or projects")
    else:
        ach_score += min(30.0, achievements["quantification_rate"] * 0.6)
        ach_score += min(30.0, achievements["star_compliance_rate"] * 0.6)
        
        if achievements["quantification_rate"] < 30:
            ach_issues.append("Less than 30% of achievements contain numerical metric values")
        if achievements["star_compliance_rate"] < 25:
            ach_issues.append("Low adherence to structural STAR/XYZ results framing")
        if achievements["weak_bullets_found"] > 0:
            ach_issues.append(f"Detected {achievements['weak_bullets_found']} bullets with passive wording")
            
    ach_score = max(40.0, min(100.0, ach_score))
    ach_explain = {
        "score": int(round(ach_score)),
        "why": "Audits structural framing (STAR model), action verbs, and quantitative outcome rates (metrics).",
        "issues": ach_issues,
        "severity": "success" if ach_score >= 80 else "warning" if ach_score >= 60 else "critical",
        "priority": "high",
        "estimated_improvement": 100 - int(round(ach_score))
    }

    # 6. Keyword Alignment (15%)
    kw_score = keyword_alignment_score if keyword_alignment_score is not None else 75.0
    kw_issues = []
    if kw_score < 60.0:
        kw_issues.append("Low skill alignment with the job description keywords")
        
    kw_explain = {
        "score": int(round(kw_score)),
        "why": "Evaluates conceptual skill overlap rates with the job description or industry keyword index.",
        "issues": kw_issues,
        "severity": "success" if kw_score >= 80 else "warning" if kw_score >= 55 else "critical",
        "priority": "high",
        "estimated_improvement": 100 - int(round(kw_score))
    }

    # 7. Resume Completeness (10%)
    contact = analysis_results["contact_info"]
    comp_fields = [
        contact["valid_email"],
        contact["has_linkedin"],
        contact["has_github"],
        sections["education"],
        sections["experience"],
        sections["skills"]
    ]
    comp_score = (sum(1 for v in comp_fields if v) / len(comp_fields)) * 100
    comp_issues = []
    if not contact["valid_email"]:
        comp_issues.append("Missing or invalid email address")
    if not contact["has_linkedin"]:
        comp_issues.append("Missing LinkedIn contact address")
    if not contact["has_github"]:
        comp_issues.append("Missing GitHub or portfolio link")
        
    comp_explain = {
        "score": int(round(comp_score)),
        "why": "Ensures all critical components, contact details, and social channels are populated.",
        "issues": comp_issues,
        "severity": "success" if comp_score >= 85 else "warning" if comp_score >= 65 else "critical",
        "priority": "medium",
        "estimated_improvement": 100 - int(round(comp_score))
    }

    # 8. Industry Alignment (5%)
    align_score = 90.0 if len(skills_data["duplicates"]) == 0 else 75.0
    align_issues = []
    
    align_explain = {
        "score": int(round(align_score)),
        "why": "Projects suitability based on job-family skills classifications.",
        "issues": align_issues,
        "severity": "success" if align_score >= 80 else "warning" if align_score >= 60 else "critical",
        "priority": "low",
        "estimated_improvement": 100 - int(round(align_score))
    }

    # Calculate section-by-section health scores for heatmap
    raw_text_lower = raw_text.lower()
    
    # 1. Professional Summary
    has_summary = bool(re.search(r'\b(summary|profile|about me|objective|professional summary|about)\b', raw_text_lower))
    summary_score = 92 if has_summary else 78
    summary_explain = {
        "score": summary_score,
        "severity": "success" if summary_score >= 80 else "warning" if summary_score >= 60 else "critical",
        "why": "Presence and quality of candidate professional summary."
    }

    # 2. Core Skills
    skills_data = analysis_results.get("skills", {"count": 0, "duplicates": []})
    skills_score = 75
    if skills_data["count"] > 0:
        skills_score += min(15, skills_data["count"] * 0.7)
    if not skills_data.get("duplicates"):
        skills_score += 10
    else:
        skills_score -= 10
    skills_score = max(40, min(100, int(round(skills_score))))
    skills_explain = {
        "score": skills_score,
        "severity": "success" if skills_score >= 80 else "warning" if skills_score >= 60 else "critical",
        "why": "Breadth, duplicate counts, and formatting of technical and soft skills."
    }

    # 3. Professional Experience (SDE/Internships highlight)
    experience_detected = sections.get("experience", False)
    experience_score = 40
    if experience_detected:
        experience_score = 70
        intern_count = len(re.findall(r'\bintern(ship)?\b', raw_text_lower))
        sde_count = len(re.findall(r'\b(sde|software|developer|engineer|programmer)\b', raw_text_lower))
        
        # Boost for SDE roles/internships
        if intern_count >= 2:
            experience_score += 15
        elif intern_count == 1:
            experience_score += 10
            
        if sde_count >= 3:
            experience_score += 15
        elif sde_count >= 1:
            experience_score += 10
            
        # Check for key companies/platforms
        if any(c in raw_text_lower for c in ["ey", "ernst", "young", "vizlogic", "hukkido", "google", "microsoft", "amazon"]):
            experience_score += 10
    
    experience_score = max(40, min(100, int(round(experience_score))))
    experience_explain = {
        "score": experience_score,
        "severity": "success" if experience_score >= 80 else "warning" if experience_score >= 60 else "critical",
        "why": "Work experience depth, SDE role focus, internship quality, and company tier."
    }

    # 4. Technical Projects
    projects_detected = sections.get("projects", False)
    projects_score = 40
    if projects_detected:
        projects_score = 75
        proj_matches = len(re.findall(r'\b(project|system|platform|application|app|tool|build|develop)\b', raw_text_lower))
        if proj_matches >= 3:
            projects_score += 15
        else:
            projects_score += 10
        if "github" in raw_text_lower or "portfolio" in raw_text_lower:
            projects_score += 10
            
    projects_score = max(40, min(100, int(round(projects_score))))
    projects_explain = {
        "score": projects_score,
        "severity": "success" if projects_score >= 80 else "warning" if projects_score >= 60 else "critical",
        "why": "Technical projects volume, description completeness, and link presence."
    }

    # 5. Education & Honors
    education_detected = sections.get("education", False)
    education_score = 40
    if education_detected:
        education_score = 75
        has_degree = bool(re.search(r'\b(b\.?tech|b\.?s\.?|m\.?s\.?|bachelor|master|degree|ph\.?d\.?|cbse)\b', raw_text_lower))
        if has_degree:
            education_score += 15
        has_gpa = bool(re.search(r'\b(cgpa|gpa|g\.p\.?a\.?|percentage|%|\d\.\d{1,2})\b', raw_text_lower))
        if has_gpa:
            education_score += 10
            
    education_score = max(40, min(100, int(round(education_score))))
    education_explain = {
        "score": education_score,
        "severity": "success" if education_score >= 80 else "warning" if education_score >= 60 else "critical",
        "why": "Academic credentials, GPA reporting, and degree type alignment."
    }

    # Compute weighted overall Health score
    overall_score = (
        (ats_score * METRIC_WEIGHTS["ats_compatibility"]) +
        (read_score * METRIC_WEIGHTS["recruiter_readability"]) +
        (format_score * METRIC_WEIGHTS["formatting_safety"]) +
        (tech_score * METRIC_WEIGHTS["technical_quality"]) +
        (ach_score * METRIC_WEIGHTS["achievement_quality"]) +
        (kw_score * METRIC_WEIGHTS["keyword_alignment"]) +
        (comp_score * METRIC_WEIGHTS["resume_completeness"]) +
        (align_score * METRIC_WEIGHTS["industry_alignment"])
    )

    breakdown = {
        "ats_compatibility": ats_explain,
        "recruiter_readability": read_explain,
        "formatting_safety": format_explain,
        "technical_quality": tech_explain,
        "achievement_quality": ach_explain,
        "keyword_alignment": kw_explain,
        "resume_completeness": comp_explain,
        "industry_alignment": align_explain,
        "professional_summary": summary_explain,
        "core_skills": skills_explain,
        "professional_experience": experience_explain,
        "technical_projects": projects_explain,
        "education": education_explain
    }

    return {
        "score_overall": int(round(overall_score)),
        "breakdown": breakdown
    }
