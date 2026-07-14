from typing import Dict, List, Any

COMPANY_PROFILES = {
    "Google": {
        "name": "Google",
        "preferred_skills": ["Python", "Java", "C++", "Go", "TypeScript", "System Design", "Machine Learning", "Kubernetes"],
        "preferred_resume_characteristics": "Highly technical, focus on scale, algorithms, optimization, complexity analysis, open source.",
        "project_expectation": "Demonstrated scale, architectural decisions, independent execution.",
        "achievement_expectation": "STAR framework compliance, numerical metrics (e.g. latency reduced by X ms, processing scale Y TB).",
        "rubric": {
            "technical_depth": 0.4,
            "scale_metrics": 0.3,
            "system_complexity": 0.3
        }
    },
    "Amazon": {
        "name": "Amazon",
        "preferred_skills": ["Java", "C++", "AWS", "DynamoDB", "Microservices", "System Design", "Distributed Systems", "SQL"],
        "preferred_resume_characteristics": "Leadership principles alignment, customer obsession, ownership, bias for action.",
        "project_expectation": "End-to-end product delivery, microservices, cloud deployments.",
        "achievement_expectation": "Customer metrics, operational excellence (scaling systems, cost reductions, team enablement).",
        "rubric": {
            "leadership_alignment": 0.4,
            "cloud_architecture": 0.3,
            "metrics_driven": 0.3
        }
    },
    "Meta": {
        "name": "Meta",
        "preferred_skills": ["React", "JavaScript", "TypeScript", "Python", "PHP", "GraphQL", "Product Engineering", "System Design"],
        "preferred_resume_characteristics": "Fast-paced execution, moving fast, direct product impact, end-user scaling.",
        "project_expectation": "Full-stack apps, open source contributions, consumer-facing optimizations.",
        "achievement_expectation": "Product growth metrics (active users, conversion rates, rendering speed improvements).",
        "rubric": {
            "product_impact": 0.4,
            "frontend_stack": 0.3,
            "execution_speed": 0.3
        }
    },
    "Microsoft": {
        "name": "Microsoft",
        "preferred_skills": ["C#", "C++", "Azure", "SQL Server", ".NET", "Enterprise Software", "Security", "TypeScript"],
        "preferred_resume_characteristics": "Robustness, enterprise-grade architecture, backward compatibility, structured formatting.",
        "project_expectation": "Enterprise tools, cloud migration, operating systems, compiler details.",
        "achievement_expectation": "Stability metrics, developer productivity boosts, cloud consumption metrics.",
        "rubric": {
            "enterprise_scale": 0.4,
            "backend_depth": 0.3,
            "stability_focus": 0.3
        }
    },
    "Apple": {
        "name": "Apple",
        "preferred_skills": ["Swift", "Objective-C", "C", "C++", "Python", "Metal", "iOS", "macOS", "Hardware Integration"],
        "preferred_resume_characteristics": "Attention to detail, pixel-perfection, hardware-software co-design, extreme refinement.",
        "project_expectation": "App development, firmware development, low-level optimizations.",
        "achievement_expectation": "User experience delight, latency optimization, battery efficiency metrics.",
        "rubric": {
            "low_level_optimization": 0.4,
            "mobile_focus": 0.3,
            "precision_detail": 0.3
        }
    },
    "Netflix": {
        "name": "Netflix",
        "preferred_skills": ["Java", "JavaScript", "Python", "AWS", "Cassandra", "Distributed Systems", "Media Streaming", "CI/CD"],
        "preferred_resume_characteristics": "Freedom & responsibility, high talent density, self-motivation, scalability.",
        "project_expectation": "High-throughput servers, microservice patterns, chaos engineering implementations.",
        "achievement_expectation": "Performance at extreme scale, load balancing, cost-efficiency optimization.",
        "rubric": {
            "distributed_scaling": 0.4,
            "chaos_practices": 0.3,
            "operational_impact": 0.3
        }
    },
    "Uber": {
        "name": "Uber",
        "preferred_skills": ["Go", "Java", "Python", "React", "Kafka", "Hadoop", "Cassandra", "System Design"],
        "preferred_resume_characteristics": "Real-time systems, marketplace metrics, geospatial databases, high concurrency.",
        "project_expectation": "Concurrences models, message brokers integration, routing optimization engines.",
        "achievement_expectation": "Transaction scaling metrics, route optimizations, latency reduction under peak traffic.",
        "rubric": {
            "concurrency_depth": 0.4,
            "realtime_scaling": 0.3,
            "marketplace_impact": 0.3
        }
    },
    "Adobe": {
        "name": "Adobe",
        "preferred_skills": ["C++", "Java", "JavaScript", "Python", "Cloud Platform", "WebGL", "Creative Cloud Suite", "API Development"],
        "preferred_resume_characteristics": "Creative enablement, rich user interactions, rendering engines, SaaS transformation.",
        "project_expectation": "WebGL applications, graphics processing algorithms, SaaS integrations.",
        "achievement_expectation": "SaaS adoption rates, graphics processing speeds, API scalability indexes.",
        "rubric": {
            "graphics_and_rendering": 0.4,
            "saas_architectures": 0.3,
            "core_language_depth": 0.3
        }
    },
    "Salesforce": {
        "name": "Salesforce",
        "preferred_skills": ["Java", "JavaScript", "Apex", "Visualforce", "Lightning Web Components", "SQL", "Cloud CRM", "API Platform"],
        "preferred_resume_characteristics": "SaaS multitenancy, CRM extensions, security boundaries, customer success.",
        "project_expectation": "Enterprise integrations, CRM extensions, database performance optimizations.",
        "achievement_expectation": "API call scaling, multitenant resource sharing efficiencies, client onboarding acceleration.",
        "rubric": {
            "saas_multitenancy": 0.4,
            "enterprise_crm": 0.3,
            "platform_scale": 0.3
        }
    },
    "Atlassian": {
        "name": "Atlassian",
        "preferred_skills": ["React", "TypeScript", "Node.js", "Java", "AWS", "Jira API", "Collaboration Tools", "DevOps Tools"],
        "preferred_resume_characteristics": "Teamwork values (Play, as a team), modular plugins, collaborative tools.",
        "project_expectation": "Developer tool integrations, agile plugins development, collaborative dashboard UI.",
        "achievement_expectation": "Team productivity enhancements, dashboard load times, extension ecosystem scaling.",
        "rubric": {
            "collaborative_tools": 0.4,
            "modern_frontend": 0.3,
            "ecosystem_expansion": 0.3
        }
    }
}

def evaluate_company_alignment(resume_skills: List[str], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates the resume alignment (0-100) against all supported target companies deterministically,
    based on matching skills, metrics usage, and target characteristics.
    """
    resume_skills_lower = [s.lower() for s in resume_skills]
    achievements = analysis_results["achievements"]
    
    results = {}
    for company_name, profile in COMPANY_PROFILES.items():
        # Calculate Skill Match (out of 100)
        matched_skills = 0
        preferred = profile["preferred_skills"]
        for p_skill in preferred:
            if any(p_skill.lower() == s or p_skill.lower() in s for s in resume_skills_lower):
                matched_skills += 1
        skill_score = (matched_skills / len(preferred)) * 100 if preferred else 100
        
        # Calculate Heuristic Rubric Scores
        # 1. Scale/Metrics alignment
        metrics_rate = achievements["quantification_rate"]
        scale_score = min(100.0, max(40.0, metrics_rate * 2.0))
        
        # 2. Tech Depth
        depth_score = min(100.0, max(50.0, len(resume_skills) * 3.0))
        
        # Overall weighted alignment score
        rubric = profile["rubric"]
        weighted_score = (
            (skill_score * 0.4) +
            (scale_score * 0.3) +
            (depth_score * 0.3)
        )
        
        results[company_name.lower()] = {
            "company_name": profile["name"],
            "alignment_score": int(round(weighted_score)),
            "matched_preferred_skills": [s for s in preferred if any(s.lower() == r.lower() or s.lower() in r.lower() for r in resume_skills_lower)],
            "missing_preferred_skills": [s for s in preferred if not any(s.lower() == r.lower() or s.lower() in r.lower() for r in resume_skills_lower)],
            "resume_characteristics": profile["preferred_resume_characteristics"],
            "project_expectation": profile["project_expectation"],
            "achievement_expectation": profile["achievement_expectation"]
        }
        
    return results
