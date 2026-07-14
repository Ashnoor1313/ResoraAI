from typing import Dict, List, Any

def generate_recommendations(analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates a list of deterministic, actionable recommendations based on the resume analysis.
    Assigns severities, priorities, and potential score improvement values without using AI.
    """
    recs = []
    
    # 1. Contact Information
    contact = analysis_results["contact_info"]
    if not contact["valid_email"]:
        recs.append({
            "category": "Resume Completeness",
            "problem": "Invalid email address format",
            "reason": "ATS parses email addresses to create your unique application profile.",
            "suggested_fix": "Provide a standard format email address (e.g. name@domain.com) in your header.",
            "severity": "critical",
            "priority": "high",
            "expected_impact": 10
        })
    if not contact["has_linkedin"]:
        recs.append({
            "category": "Resume Completeness",
            "problem": "Missing LinkedIn profile link",
            "reason": "Over 85% of recruiters cross-reference candidates on LinkedIn during screening.",
            "suggested_fix": "Add a link to your public LinkedIn profile page in your contact header.",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 5
        })
    if not contact["has_github"] and analysis_results["quality"].get("has_projects"):
        recs.append({
            "category": "Resume Completeness",
            "problem": "Missing GitHub profile link",
            "reason": "Engineering managers expect to audit code repositories for technical roles.",
            "suggested_fix": "Add a link to your active GitHub profile or portfolio in your contact header.",
            "severity": "info",
            "priority": "medium",
            "expected_impact": 4
        })

    # 2. Section presence
    structure = analysis_results["structure"]
    for sec in ["education", "experience", "skills"]:
        if not structure["sections_detected"][sec]:
            recs.append({
                "category": "ATS Compatibility",
                "problem": f"Missing {sec.capitalize()} section",
                "reason": f"Standard ATS models expect a distinct section labeled '{sec.capitalize()}' to segment parsed details.",
                "suggested_fix": f"Add a section header named '{sec.capitalize()}' containing your relevant details.",
                "severity": "critical",
                "priority": "high",
                "expected_impact": 15
            })
            
    if not structure["sections_detected"]["projects"]:
        recs.append({
            "category": "Technical Quality",
            "problem": "Missing Projects section",
            "reason": "Adding personal or academic projects shows hands-on application of your technical skill set.",
            "suggested_fix": "Add a 'Projects' section describing 2-3 technical projects.",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 8
        })

    if not structure["sections_detected"]["certifications"]:
        recs.append({
            "category": "Resume Completeness",
            "problem": "Missing Certifications or Awards",
            "reason": "Validations and external credentials help verify your self-proclaimed skills.",
            "suggested_fix": "Add a 'Certifications' section to list verified professional credentials.",
            "severity": "info",
            "priority": "low",
            "expected_impact": 3
        })

    # 3. Readability & Length Validation
    readability = analysis_results["readability"]
    if readability["word_count_status"] == "too_short":
        recs.append({
            "category": "Recruiter Readability",
            "problem": "Resume is too short",
            "reason": "Resumes under 300 words usually lack detail and scope about past achievements.",
            "suggested_fix": "Expand on your bullet descriptions by adding context, tools used, and business metrics.",
            "severity": "critical",
            "priority": "high",
            "expected_impact": 12
        })
    elif readability["word_count_status"] == "too_long":
        recs.append({
            "category": "Recruiter Readability",
            "problem": "Resume is too long",
            "reason": "Resumes over 1000 words run the risk of layout clutter and low recruiter attention span.",
            "suggested_fix": "Consolidate your bullet points and aim for a clean 1-2 page structure (400-800 words ideal).",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 8
        })
        
    if readability["long_paragraphs"] > 0:
        recs.append({
            "category": "Recruiter Readability",
            "problem": "Dense text blocks / Long paragraphs",
            "reason": "Recruiters spend an average of 6 seconds scanning a resume. Dense blocks are frequently skipped.",
            "suggested_fix": "Break down paragraphs into 1-2 line bullet points starting with strong action verbs.",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 6
        })

    # 4. Phrasing & achievements
    achievements = analysis_results["achievements"]
    if achievements["total_bullets"] > 0:
        if achievements["quantification_rate"] < 30:
            recs.append({
                "category": "Achievement Quality",
                "problem": "Low numerical quantification rate",
                "reason": "Without metrics, statements describe simple job duties rather than actual impact.",
                "suggested_fix": "Use the Google XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]. Add metrics to at least 4 bullets.",
                "severity": "critical",
                "priority": "high",
                "expected_impact": 15
            })
        if achievements["star_compliance_rate"] < 20:
            recs.append({
                "category": "Achievement Quality",
                "problem": "Low STAR framework compliance",
                "reason": "Top companies evaluate ownership by auditing whether statements outline Situation, Task, Action, and Result.",
                "suggested_fix": "Ensure bullets start with strong verbs, list specific actions, and end with the positive outcome or result.",
                "severity": "warning",
                "priority": "high",
                "expected_impact": 10
            })
        if achievements["weak_bullets_found"] > 0:
            recs.append({
                "category": "Achievement Quality",
                "problem": "Passive/Weak phrasing detected",
                "reason": "Phrases like 'responsible for' make achievements sound passive and list-like.",
                "suggested_fix": "Replace passive verbs with active verbs (e.g. change 'Responsible for coding' to 'Architected and built').",
                "severity": "warning",
                "priority": "medium",
                "expected_impact": 5
            })
        if len(achievements.get("buzzwords", [])) > 1:
            recs.append({
                "category": "Recruiter Readability",
                "problem": "Overuse of buzzwords/filler phrases",
                "reason": "Terms like 'team player' and 'guru' are generic and add no real value.",
                "suggested_fix": f"Replace buzzwords ({', '.join(achievements['buzzwords'])}) with concrete technical skills or action metrics.",
                "severity": "info",
                "priority": "low",
                "expected_impact": 3
            })

    # 5. Skills duplicates
    skills = analysis_results["skills"]
    if len(skills.get("duplicates", [])) > 0:
        recs.append({
            "category": "Technical Quality",
            "problem": "Duplicate skills listed",
            "reason": "Listing identical skills repeatedly wastes valuable page space and looks disorganized.",
            "suggested_fix": f"Remove redundant occurrences of: {', '.join(skills['duplicates'])}.",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 4
        })

    # 6. Formatting Safety
    formatting = analysis_results["formatting"]
    if formatting.get("multiple_columns"):
        recs.append({
            "category": "Formatting Safety",
            "problem": "Multi-column layout structure",
            "reason": "Standard ATS scanners read text left-to-right, meaning multi-column content often gets scrambled during parsing.",
            "suggested_fix": "Convert layout to a clean, single-column vertical flow structure.",
            "severity": "critical",
            "priority": "high",
            "expected_impact": 15
        })
    if formatting.get("has_images"):
        recs.append({
            "category": "Formatting Safety",
            "problem": "Embedded graphical elements or images",
            "reason": "Images cannot be parsed by basic ATS systems and can trigger parsing crashes or text omissions.",
            "suggested_fix": "Remove profile photos, logo images, and progress bars. Keep the file text-only.",
            "severity": "critical",
            "priority": "high",
            "expected_impact": 10
        })
    if formatting.get("unsupported_fonts"):
        recs.append({
            "category": "Formatting Safety",
            "problem": "Non-standard/Unsupported fonts used",
            "reason": "Unusual fonts can cause text encoding scrambling during extraction.",
            "suggested_fix": "Stick to universal safe fonts: Arial, Calibri, Times New Roman, Garamond, or Georgia.",
            "severity": "warning",
            "priority": "medium",
            "expected_impact": 5
        })

    return recs
