import re
import numpy as np
from typing import Dict, List, Set, Any
from app.services.parser import SKILLS_DICTIONARY, extract_skills_from_text

# Common stopwords to ignore during raw text keyword extraction
STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't", 'required', 'experience', 'working',
    'skills', 'ability', 'knowledge', 'years', 'team', 'work', 'candidate', 'role', 'job', 'position', 'requirements'
}

# Semantic groupings (synonyms) for skills matching
SEMANTIC_GROUPS = [
    {"react", "reactjs", "react.js", "frontend", "front-end"},
    {"javascript", "js", "ecmascript"},
    {"typescript", "ts"},
    {"nodejs", "node.js", "node"},
    {"postgresql", "postgres", "sql", "mysql", "mariadb"},
    {"mongodb", "nosql", "dynamodb", "cassandra"},
    {"machine learning", "ml", "deep learning", "ai", "artificial intelligence", "pytorch", "tensorflow"},
    {"docker", "kubernetes", "k8s", "containerization"},
    {"aws", "gcp", "azure", "cloud"},
    {"product management", "product manager", "agile", "scrum", "roadmap"},
    {"marketing", "seo", "sem", "digital marketing", "growth hacking"},
    {"hr", "human resources", "recruiting", "talent acquisition"},
    {"finance", "accounting", "excel", "financial analysis", "financial modeling", "budgeting"},
    {"design", "figma", "sketch", "ui/ux", "wireframing", "adobe"}
]

def build_tfidf_vector(text1: str, text2: str) -> tuple:
    """Helper to convert two text blocks into TF-IDF vectors and calculate Cosine Similarity using numpy."""
    # Simple tokenizer
    def tokenize(text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z]{2,15}\b', text.lower())
        return [w for w in words if w not in STOPWORDS]
        
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    
    # Vocabulary
    vocab = sorted(list(set(tokens1 + tokens2)))
    if not vocab:
        return np.array([0]), np.array([0])
        
    vocab_idx = {word: i for i, word in enumerate(vocab)}
    
    # Term Frequency (TF)
    tf1 = np.zeros(len(vocab))
    tf2 = np.zeros(len(vocab))
    
    for t in tokens1:
        if t in vocab_idx:
            tf1[vocab_idx[t]] += 1
    for t in tokens2:
        if t in vocab_idx:
            tf2[vocab_idx[t]] += 1
            
    # Inverse Document Frequency (IDF) - simple document count (2 documents)
    idf = np.zeros(len(vocab))
    for i, word in enumerate(vocab):
        doc_count = 0
        if word in tokens1:
            doc_count += 1
        if word in tokens2:
            doc_count += 1
        # idf = ln(total_docs / docs_containing_term) + 1
        idf[i] = np.log(2.0 / doc_count) + 1.0
        
    # TF-IDF vectors
    tfidf1 = tf1 * idf
    tfidf2 = tf2 * idf
    
    return tfidf1, tfidf2

def calculate_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Calculates cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

def check_semantic_match(missing_skill: str, resume_skills: List[str]) -> str:
    """Checks if a missing skill has a semantically equivalent skill in the resume."""
    missing_lower = missing_skill.lower()
    for group in SEMANTIC_GROUPS:
        if missing_lower in group:
            for skill in resume_skills:
                if skill.lower() in group and skill.lower() != missing_lower:
                    return skill
    return ""

def match_job_description(resume_text: str, resume_skills: List[str], jd_text: str) -> Dict[str, Any]:
    """Analyzes a job description against the resume text to calculate match details."""
    # 1. Extract skills from Job Description
    jd_skills = extract_skills_from_text(jd_text)
    
    if not jd_skills:
        # Fallback keyword extraction: take high-frequency terms from JD that are in dictionary
        # If still empty, grab any capitalized sequences
        jd_skills = ["Communication", "Leadership"]
        
    # 2. Categorize skill matches
    matching_skills = []
    missing_skills = []
    semantic_matches = [] # [{"jd_skill": "ReactJS", "resume_skill": "React"}]
    
    resume_skills_lower = [s.lower() for s in resume_skills]
    
    for jd_skill in jd_skills:
        jd_skill_lower = jd_skill.lower()
        if jd_skill_lower in resume_skills_lower:
            matching_skills.append(jd_skill)
        else:
            # Check if it has a semantic close match
            equiv = check_semantic_match(jd_skill, resume_skills)
            if equiv:
                semantic_matches.append({
                    "jd_skill": jd_skill,
                    "resume_skill": equiv
                })
                # Add to matching count but flag as semantic
                matching_skills.append(jd_skill) 
            else:
                missing_skills.append(jd_skill)
                
    # 3. Calculate text-based semantic similarity (TF-IDF Cosine Similarity)
    tfidf1, tfidf2 = build_tfidf_vector(resume_text, jd_text)
    similarity_score = calculate_cosine_similarity(tfidf1, tfidf2)
    
    # 4. Compute composite Match Score (0 - 100)
    # 60% keyword match rate, 40% semantic cosine similarity
    keyword_match_rate = len(matching_skills) / len(jd_skills) if jd_skills else 1.0
    match_score = (keyword_match_rate * 60.0) + (similarity_score * 40.0)
    # Clip between 0 and 100
    match_score = max(0.0, min(100.0, float(match_score)))
    
    return {
        "match_score": int(round(match_score)),
        "missing_skills": missing_skills,
        "matching_skills": [m for m in matching_skills if m not in [s["jd_skill"] for s in semantic_matches]],
        "semantic_matches": semantic_matches,
        "semantic_similarity": int(round(similarity_score * 100.0))
    }
