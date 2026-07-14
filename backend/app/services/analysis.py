import re
from typing import Dict, List, Any

WEAK_BULLETS = [
    "responsible for", "assisted with", "helped", "handled", "worked on", "duties included", "involved in"
]

STRONG_ACTION_VERBS = {
    "built", "developed", "implemented", "designed", "led", "managed", "created", "increased", 
    "reduced", "optimized", "achieved", "improved", "spearheaded", "launched", "engineered",
    "formulated", "established", "accelerated", "accomplished", "delivered", "maximized",
    "negotiated", "executed", "collaborated", "pioneered", "orchestrated", "architected",
    "automated", "streamlined", "modernized"
}

BUZZWORDS = {
    "synergy", "detail-oriented", "hardworking", "go-getter", "team player", "thought leader",
    "guru", "ninja", "expert", "dynamic"
}

def is_metadata_line(line: str) -> bool:
    clean = line.strip().lower()
    if not clean:
        return True
        
    # 1. Duration / Dates
    date_pattern = r'(?:19|20)\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}/\d{2,4}'
    if re.search(date_pattern, clean, re.IGNORECASE):
        return True
        
    # 2. Locations / Remote
    location_pattern = r'\b(remote|hybrid|on-site|onsite|india|usa|uk|canada|germany|london|toronto|vancouver|san francisco|sf|new york|ny|seattle|boston|austin|chicago|bengaluru|bangalore|pune|mumbai|delhi|noida|hyderabad|chennai|gurgaon)\b'
    state_code_pattern = r',\s*[A-Z]{2}\b'
    if re.search(location_pattern, clean, re.IGNORECASE) or re.search(state_code_pattern, line):
        return True
        
    # 3. Educational degrees or terms
    education_pattern = r'\b(bachelor|master|phd|bs|ms|b\.tech|m\.tech|btech|mtech|degree|major|gpa|cgpa|university|college|school|institute|academy)\b'
    if re.search(education_pattern, clean, re.IGNORECASE):
        return True
        
    # 3b. Company keywords/indicators
    company_pattern = r'\b(pvt|ltd|llc|co|corp|corporation|inc|gmbh|solutions|limited|private|technologies|systems|services|consultancy|consulting|industries|ventures|holdings)\b'
    if re.search(company_pattern, clean, re.IGNORECASE):
        return True
        
    # 4. Job Titles / Company designations
    title_keywords = r'\b(engineer|developer|intern|manager|lead|analyst|consultant|architect|designer|director|founder|specialist|co-founder|vp|head|president|executive|officer|administrator|coordinator|scrum master|student|candidate|contractor|freelancer|self-employed|temporary)\b'
    
    words = re.findall(r'\b[a-zA-Z]+\b', clean)
    first_word = words[0] if words else ""
    
    start_verbs = STRONG_ACTION_VERBS.union({
        "working", "worked", "providing", "provided", "serving", "served", "performing", "performed", 
        "using", "assisting", "assisted", "coordinating", "coordinated", "collaborating", "collaborated",
        "building", "developing", "implementing", "designing", "managing", "writing", "optimizing", 
        "architecting", "configuring", "maintaining", "coordinating", "collaborating", "assisting", 
        "pioneering", "achieving", "improving", "scaling", "integrating", "analyzing", "testing", 
        "deploying", "automating", "crafting", "increasing", "reducing", "securing", "delivering", 
        "spearheading", "engineering", "refactoring", "establishing", "mentoring", "training", 
        "directing", "conducting", "producing", "enhancing", "resolving", "strengthening", "accelerating", 
        "generating", "driving", "expanding", "growing", "partnering", "supporting", "guiding", "advising"
    })
    
    is_start_verb = first_word in start_verbs
    
    if len(clean) < 50 and re.search(title_keywords, clean, re.IGNORECASE):
        if not is_start_verb:
            return True
            
    # 5. Short lines (less than 20 chars) that don't start with action verbs
    if len(clean) < 20 and not is_start_verb:
        return True
        
    # 6. Lines under 60 chars that do not contain any action verbs (e.g. project names/titles)
    all_verbs = start_verbs.union(STRONG_ACTION_VERBS)
    has_verb = any(re.search(r'\b' + re.escape(v) + r'\b', clean) for v in all_verbs)
    if len(clean) < 60 and not has_verb:
        return True
        
    return False

def analyze_resume(knowledge_graph: Dict[str, Any], raw_text: str, formatting_report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Performs comprehensive, deterministic evaluation of the candidate's Resume Knowledge Graph.
    Does NOT use AI/LLMs. Runs checks for achievements, format structure, contact info, and phrasing.
    """
    
    # 1. Contact Validation
    candidate = knowledge_graph["candidate"]
    contact_issues = []
    if not candidate.get("name"):
        contact_issues.append("Missing candidate name")
    if not candidate.get("email"):
        contact_issues.append("Missing email address")
    elif not re.match(r'[^@]+@[^@]+\.[^@]+', candidate["email"]):
        contact_issues.append("Invalid email address format")
    if not candidate.get("phone"):
        contact_issues.append("Missing phone number")
        
    # Check for social links
    links = candidate.get("links", [])
    has_linkedin = any("linkedin.com" in l.lower() for l in links)
    has_github = any("github.com" in l.lower() for l in links)
    
    # 2. Section Validation
    sections_found = {
        "education": len(knowledge_graph["education"]) > 0,
        "experience": len(knowledge_graph["experience"]) > 0,
        "projects": len(knowledge_graph["projects"]) > 0,
        "skills": len(knowledge_graph["skills"].get("raw", knowledge_graph["skills"].get("normalized", []))) > 0,
        "certifications": len(knowledge_graph["certifications"]) > 0
    }
    
    # 3. Readability & Length Validation
    words = raw_text.split()
    total_words = len(words)
    word_count_status = "ideal"
    if total_words < 300:
        word_count_status = "too_short"
    elif total_words > 1000:
        word_count_status = "too_long"
        
    sentences = re.split(r'[.!?]+', raw_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    avg_sentence_len = total_words / len(sentences) if sentences else 0
    
    # Check paragraphs length
    paragraphs = raw_text.split('\n\n')
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    long_paragraphs_count = sum(1 for p in paragraphs if len(p.split()) > 60)
    
    # 4. Action Verbs & Achievements (STAR / XYZ framework)
    experience = knowledge_graph["experience"]
    projects = knowledge_graph["projects"]
    all_bullets_raw = [item["text"] for item in experience + projects]
    all_bullets = [b for b in all_bullets_raw if not is_metadata_line(b)]
    
    quantified_count = 0
    weak_bullets_count = 0
    strong_verbs_used = set()
    buzzwords_used = set()
    star_compliant_count = 0
    
    for bullet in all_bullets:
        bullet_lower = bullet.lower()
        
        # Quantification Check: numbers or metric tokens
        has_metrics = bool(re.search(r'\d+%|\d+\s?%|\$\d+|\d+\s?million|\d+\s?billion|\d+\+|million|billion|\b\d+[kKmM]\b', bullet))
        if has_metrics:
            quantified_count += 1
            
        # Weak Phrasing Check
        if any(weak in bullet_lower for weak in WEAK_BULLETS):
            weak_bullets_count += 1
            
        # Action Verbs Extract
        words_in_bullet = re.findall(r'\b[a-zA-Z]+\b', bullet_lower)
        first_word = words_in_bullet[0] if words_in_bullet else ""
        has_strong_verb = first_word in STRONG_ACTION_VERBS
        if has_strong_verb:
            strong_verbs_used.add(first_word)
            
        # Buzzwords check
        for buzz in BUZZWORDS:
            if buzz in bullet_lower:
                buzzwords_used.add(buzz)
                
        # STAR / XYZ framework detection
        # STAR requires: Action Verb + Metrics + Clear Result/Context
        # Heuristic: starts with strong verb, has metrics, and is descriptive (>12 words)
        if has_strong_verb and has_metrics and len(words_in_bullet) > 12:
            star_compliant_count += 1

    # 5. Skills duplicate checks
    raw_skills = knowledge_graph["skills"]["raw"]
    skills_lower = [s.lower().strip() for s in raw_skills]
    duplicates = [s for s in set(skills_lower) if skills_lower.count(s) > 1]
    
    # Project and Internship quality heuristics
    has_internship = any("intern" in bullet_lower for bullet_lower in all_bullets)
    
    return {
        "contact_info": {
            "valid_email": "@" in candidate.get("email", ""),
            "has_linkedin": has_linkedin,
            "has_github": has_github,
            "issues": contact_issues
        },
        "structure": {
            "sections_detected": sections_found,
            "missing_sections": [k for k, v in sections_found.items() if not v]
        },
        "readability": {
            "word_count": total_words,
            "word_count_status": word_count_status,
            "avg_sentence_length": round(avg_sentence_len, 1),
            "long_paragraphs": long_paragraphs_count
        },
        "achievements": {
            "total_bullets": len(all_bullets),
            "quantified_bullets": quantified_count,
            "quantification_rate": round(quantified_count / len(all_bullets) * 100, 1) if all_bullets else 0,
            "star_compliant_bullets": star_compliant_count,
            "star_compliance_rate": round(star_compliant_count / len(all_bullets) * 100, 1) if all_bullets else 0,
            "weak_bullets_found": weak_bullets_count,
            "strong_verbs_count": len(strong_verbs_used),
            "buzzwords": list(buzzwords_used)
        },
        "skills": {
            "duplicates": duplicates,
            "count": len(raw_skills)
        },
        "formatting": formatting_report,
        "quality": {
            "has_internship": has_internship,
            "has_projects": len(projects) > 0
        }
    }
