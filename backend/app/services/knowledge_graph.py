import re
from typing import Dict, List, Any

def extract_links_from_text(text: str) -> List[str]:
    """Helper to pull external URL links (like GitHub, LinkedIn, portfolios) from text."""
    links = []
    # Match standard URLs starting with http(s)
    url_pattern = r'(https?://[^\s$.?#].[^\s]*)'
    matches = re.findall(url_pattern, text)
    for match in matches:
        clean = match.strip(",.)('\" ")
        if clean:
            links.append(clean)

    # Match domain-style profiles without schema (e.g. github.com/username)
    domain_patterns = [
        r'\b(?:www\.)?github\.com/[^\s,.)(\'\"]+',
        r'\b(?:www\.)?linkedin\.com/in/[^\s,.)(\'\"]+',
        r'\b(?:www\.)?linkedin\.com/pub/[^\s,.)(\'\"]+'
    ]
    for pat in domain_patterns:
        domain_matches = re.findall(pat, text, re.IGNORECASE)
        for match in domain_matches:
            full_url = match
            if not full_url.startswith("http"):
                full_url = "https://" + full_url
            links.append(full_url)

    return list(set(links))

def build_knowledge_graph(extracted_data: Dict[str, Any], raw_text: str = "") -> Dict[str, Any]:
    """
    Converts parsed raw resume details into a structured, unified Knowledge Graph model
    consistently consumed by downstream Analysis, Scoring, and AI engines.
    """
    extracted_links = extracted_data.get("links", [])
    text_links = extract_links_from_text(raw_text) if raw_text else []
    
    # Merge and clean all links
    links = list(set(extracted_links + text_links))
    
    graph = {
        "candidate": {
            "name": extracted_data.get("name", ""),
            "email": extracted_data.get("email", ""),
            "phone": extracted_data.get("phone", ""),
            "links": links
        },
        "experience": [],
        "projects": [],
        "education": [],
        "skills": {
            "raw": extracted_data.get("skills", []),
            "primary": [],
            "secondary": [],
            "categorized": {}
        },
        "certifications": [],
        "metadata": {
            "total_words": len(raw_text.split()) if raw_text else 0,
            "total_lines": len([l for l in raw_text.split('\n') if l.strip()]) if raw_text else 0
        }
    }

    # Clean and parse experience lists into structured objects
    experience_bullets = extracted_data.get("experience", [])
    for i, bullet in enumerate(experience_bullets):
        graph["experience"].append({
            "id": f"exp-{i}",
            "text": bullet.strip()
        })
        
    # Clean and parse projects lists
    project_bullets = extracted_data.get("projects", [])
    for i, bullet in enumerate(project_bullets):
        graph["projects"].append({
            "id": f"proj-{i}",
            "text": bullet.strip()
        })

    # Education details
    education_lines = extracted_data.get("education", [])
    for i, line in enumerate(education_lines):
        graph["education"].append({
            "id": f"edu-{i}",
            "text": line.strip()
        })

    # Certifications details
    cert_lines = extracted_data.get("certifications", [])
    for i, line in enumerate(cert_lines):
        graph["certifications"].append({
            "id": f"cert-{i}",
            "text": line.strip()
        })

    return graph
