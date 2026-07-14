import math
from typing import Dict, Any

BENCHMARK_PROFILES = {
    "Software Engineer": {
        "Intern": {"mean": 60.0, "std": 8.0},
        "Entry Level": {"mean": 70.0, "std": 7.0},
        "Mid Level": {"mean": 78.0, "std": 6.0},
        "Senior Level": {"mean": 86.0, "std": 5.0}
    },
    "Data Analyst": {
        "Intern": {"mean": 58.0, "std": 9.0},
        "Entry Level": {"mean": 68.0, "std": 7.5},
        "Mid Level": {"mean": 76.0, "std": 6.5},
        "Senior Level": {"mean": 84.0, "std": 5.5}
    },
    "AI Engineer": {
        "Intern": {"mean": 62.0, "std": 8.5},
        "Entry Level": {"mean": 72.0, "std": 7.0},
        "Mid Level": {"mean": 80.0, "std": 5.8},
        "Senior Level": {"mean": 88.0, "std": 4.5}
    },
    "Frontend Developer": {
        "Intern": {"mean": 59.0, "std": 8.0},
        "Entry Level": {"mean": 69.0, "std": 7.2},
        "Mid Level": {"mean": 77.0, "std": 6.2},
        "Senior Level": {"mean": 85.0, "std": 5.2}
    },
    "Backend Developer": {
        "Intern": {"mean": 60.0, "std": 8.0},
        "Entry Level": {"mean": 70.0, "std": 7.0},
        "Mid Level": {"mean": 78.0, "std": 6.0},
        "Senior Level": {"mean": 86.0, "std": 5.0}
    },
    "Full Stack Developer": {
        "Intern": {"mean": 61.0, "std": 8.2},
        "Entry Level": {"mean": 71.0, "std": 7.2},
        "Mid Level": {"mean": 79.0, "std": 6.2},
        "Senior Level": {"mean": 87.0, "std": 5.0}
    },
    "Product Manager": {
        "Intern": {"mean": 63.0, "std": 7.5},
        "Entry Level": {"mean": 73.0, "std": 6.8},
        "Mid Level": {"mean": 81.0, "std": 5.5},
        "Senior Level": {"mean": 89.0, "std": 4.5}
    }
}

def get_canonical_role(role: str) -> str:
    """Resolves standard roles from a raw input string."""
    role_lower = role.lower()
    if "data analyst" in role_lower or "business analyst" in role_lower:
        return "Data Analyst"
    if "ai" in role_lower or "ml" in role_lower or "machine learning" in role_lower or "data scientist" in role_lower:
        return "AI Engineer"
    if "frontend" in role_lower:
        return "Frontend Developer"
    if "backend" in role_lower:
        return "Backend Developer"
    if "full stack" in role_lower:
        return "Full Stack Developer"
    if "product" in role_lower:
        return "Product Manager"
    return "Software Engineer"

def get_canonical_level(level: str) -> str:
    """Normalizes experience inputs to canon level string key."""
    level_clean = level.strip().lower()
    if "intern" in level_clean:
        return "Intern"
    if "entry" in level_clean or "junior" in level_clean:
        return "Entry Level"
    if "mid" in level_clean:
        return "Mid Level"
    if "senior" in level_clean or "executive" in level_clean or "lead" in level_clean:
        return "Senior Level"
    return "Entry Level"

def normal_cdf(x: float, mean: float, std: float) -> float:
    """Calculates the cumulative distribution function (CDF) for a normal distribution."""
    if std <= 0:
        return 1.0 if x >= mean else 0.0
    return 0.5 * (1.0 + math.erf((x - mean) / (std * math.sqrt(2.0))))

def calculate_benchmarks(score: float, target_role: str, experience_level: str = "Entry Level") -> Dict[str, Any]:
    """Compares the user score to benchmark distributions and computes percentiles."""
    canon_role = get_canonical_role(target_role)
    canon_level = get_canonical_level(experience_level)
    
    profiles = BENCHMARK_PROFILES.get(canon_role, BENCHMARK_PROFILES["Software Engineer"])
    current_dist = profiles.get(canon_level, profiles["Entry Level"])
    
    # Calculate main percentile
    pct = normal_cdf(score, current_dist["mean"], current_dist["std"]) * 100.0
    pct = int(round(max(1.0, min(99.0, pct))))
    
    # Calculate details for other levels for comparison
    breakdown = {}
    for lvl, dist in profiles.items():
        lvl_pct = normal_cdf(score, dist["mean"], dist["std"]) * 100.0
        breakdown[lvl] = int(round(max(1.0, min(99.0, lvl_pct))))
        
    if pct >= 80:
        summary_text = f"Outstanding candidate profile. You outperform {pct}% of applicants in the {canon_level} bracket for {canon_role} roles."
    elif pct >= 50:
        summary_text = f"Competitive profile. You are performing above average ({pct}th percentile) for {canon_level} {canon_role} candidates."
    else:
        summary_text = f"Your resume has alignment gaps compared to other {canon_level} {canon_role} resumes. Focus on suggestions to move up."
        
    return {
        "global_percentile": pct,
        "role": canon_role,
        "level": canon_level,
        "breakdown": breakdown,
        "summary": summary_text
    }
