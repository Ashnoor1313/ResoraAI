from typing import Dict, List, Set, Any

# Map variations or aliases of skills to a single normalized canonical form
SKILL_ALIASES = {
    "reactjs": "React",
    "react.js": "React",
    "react": "React",
    
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node": "Node.js",
    
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "express": "Express.js",
    
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    
    "javascript": "JavaScript",
    "js": "JavaScript",
    
    "c sharp": "C#",
    "c-sharp": "C#",
    "c#": "C#",
    
    "c++": "C++",
    "cpp": "C++",
    
    "typescript": "TypeScript",
    "ts": "TypeScript",
    
    "python": "Python",
    "py": "Python",
    
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes"
}

# Group canonical skills into technology families and categories
TECH_FAMILIES = {
    "Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Ruby", "Go", "Rust", "PHP", "Swift", "Kotlin", "SQL", "HTML", "CSS", "Bash", "R", "Scala", "Matlab"],
    "Frontend": ["React", "Angular", "Vue", "Next.js", "Nuxt", "Svelte", "Redux", "GraphQL", "Tailwind", "Bootstrap", "jQuery", "Vercel", "Netlify"],
    "Backend / APIs": ["Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring", "API", "REST API", "GraphQL"],
    "Databases": ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "Firebase", "Supabase"],
    "DevOps / Cloud": ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "Jenkins", "Ansible", "Linux", "Unix", "CI/CD", "Heroku", "Cloud"],
    "Data Science / AI": ["Pandas", "Numpy", "Scikit-Learn", "TensorFlow", "PyTorch", "Keras", "OpenCV", "Machine Learning", "Deep Learning", "Statistics", "Data Mining", "Modeling"],
    "Mobile": ["Swift", "Kotlin", "Java", "React Native", "Flutter", "iOS", "Android"],
    "Design / PM / Business": ["Product Management", "Project Management", "Scrum", "Agile", "SEO", "SEM", "Copywriting", "Figma", "Sketch", "Photoshop", "Illustrator", "Wireframing", "UI/UX", "Tableau", "Power BI", "Excel", "Budgets", "Sales", "HR"]
}

def normalize_skill(skill: str) -> str:
    """Standardizes a skill variation to its canonical name."""
    clean = skill.strip().lower()
    return SKILL_ALIASES.get(clean, skill.strip())

def process_skills(raw_skills: List[str]) -> Dict[str, Any]:
    """
    Normalizes raw skills, groups them into tech families,
    and categorizes them into Primary vs Secondary skills.
    """
    normalized = []
    seen = set()
    for s in raw_skills:
        canon = normalize_skill(s)
        canon_lower = canon.lower()
        if canon_lower not in seen:
            seen.add(canon_lower)
            normalized.append(canon)
            
    # Group into categories
    categorized = {}
    for family, skills_list in TECH_FAMILIES.items():
        skills_in_family = []
        for s in normalized:
            if s in skills_list or any(s.lower() == item.lower() for item in skills_list):
                skills_in_family.append(s)
        if skills_in_family:
            categorized[family] = sorted(skills_in_family)
            
    # Heuristic for Primary vs Secondary:
    # Families with most skills are considered Primary technology families
    sorted_families = sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True)
    
    primary = []
    secondary = []
    
    if sorted_families:
        # Top 2 families are primary
        for family, skills_list in sorted_families[:2]:
            primary.extend(skills_list)
        # Others are secondary
        for family, skills_list in sorted_families[2:]:
            secondary.extend(skills_list)
            
    # If primary is empty but we have normalized skills, fall back
    if not primary and normalized:
        primary = normalized[:5]
        secondary = normalized[5:]
        
    return {
        "normalized": sorted(normalized),
        "primary": sorted(primary),
        "secondary": sorted(secondary),
        "categorized": categorized
    }
