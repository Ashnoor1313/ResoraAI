import re
import json
import html
import urllib.parse
from html.parser import HTMLParser
from typing import Dict, Any, List, Optional
import requests
from app.services.parser import SKILLS_DICTIONARY, extract_skills_from_text
from app.services import semantic

class HTMLTextExtractor(HTMLParser):
    """Simple, resilient HTML-to-text converter preserving newlines and bullets."""
    def __init__(self):
        super().__init__()
        self.result = []
        self._skip = False
        self._block_tags = {'p', 'div', 'br', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr'}
        self._skip_tags = {'script', 'style', 'head', 'meta', 'link'}

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self._skip_tags:
            self._skip = True
        elif tag.lower() in self._block_tags:
            self.result.append("\n")
            if tag.lower() == 'li':
                self.result.append("• ")

    def handle_endtag(self, tag):
        if tag.lower() in self._skip_tags:
            self._skip = False
        elif tag.lower() in self._block_tags:
            self.result.append("\n")

    def handle_data(self, data):
        if not self._skip and data:
            self.result.append(data)

    def get_text(self) -> str:
        raw = "".join(self.result)
        raw = html.unescape(raw)
        # Normalize whitespace
        lines = [line.strip() for line in raw.split("\n")]
        cleaned_lines = []
        for line in lines:
            if line:
                cleaned_lines.append(line)
        return "\n".join(cleaned_lines)

def clean_html(raw_html: str) -> str:
    """Strips HTML tags and converts into readable formatted plain text."""
    if not raw_html:
        return ""
    extractor = HTMLTextExtractor()
    extractor.feed(raw_html)
    return extractor.get_text()

def extract_linkedin_job_id(url_or_id: str) -> Optional[str]:
    """Extracts numeric LinkedIn job ID from any LinkedIn URL or ID string, including shortened links."""
    clean_str = url_or_id.strip()
    
    # Direct numeric ID
    if re.fullmatch(r'\d{7,14}', clean_str):
        return clean_str

    # Pattern 1: /jobs/view/4123456789
    m = re.search(r'/jobs/view/(\d{7,14})', clean_str)
    if m:
        return m.group(1)

    # Pattern 2: currentJobId=4123456789
    m = re.search(r'[?&]currentJobId=(\d{7,14})', clean_str)
    if m:
        return m.group(1)

    # Pattern 3: /jobPosting/4123456789
    m = re.search(r'/jobPosting/(\d{7,14})', clean_str)
    if m:
        return m.group(1)

    # Pattern 4: any standalone 8-12 digits in path
    m = re.search(r'/(\d{8,12})(?:[/?#]|$)', clean_str)
    if m:
        return m.group(1)

    # Resolve shortened link (e.g. lnkd.in) if present
    if ('lnkd.in' in clean_str or 'linkedin' in clean_str) and clean_str.startswith(('http://', 'https://')):
        try:
            head_res = requests.head(clean_str, allow_redirects=True, timeout=3)
            if head_res.url and head_res.url != clean_str:
                return extract_linkedin_job_id(head_res.url)
        except Exception:
            pass

    return None

def extract_years_experience(text: str) -> Optional[str]:
    """Detects required years of experience in job description."""
    m = re.search(r'(\d+[\s\-\+to]*\d*)\s*(?:\+)?\s*years?(?:\s+of)?\s+experience', text, re.IGNORECASE)
    if m:
        return m.group(0).strip()
    return None

def extract_education_requirement(text: str) -> Optional[str]:
    """Detects degree requirements."""
    patterns = [
        r"(?:Bachelor'?s|Master'?s|Ph\.?D|B\.S\.|M\.S\.|B\.Tech|M\.Tech)(?:\s+(?:degree|in\s+[\w\s]+))?",
        r"(?:degree in Computer Science|Software Engineering|Data Science|related technical field)"
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return None

def categorize_skills(skills_list: List[str]) -> Dict[str, List[str]]:
    """Separates extracted skills into Hard Skills, Tools/Platforms, and Methodologies."""
    hard_skills = []
    tools_cloud = []
    soft_collab = []

    cloud_tool_keywords = {
        'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'git', 'github', 
        'gitlab', 'ci/cd', 'linux', 'unix', 'postman', 'jira', 'confluence', 
        'terraform', 'ansible', 'jenkins', 'grafana', 'prometheus', 'datadog'
    }

    soft_keywords = {
        'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
        'mentorship', 'agile', 'scrum', 'kanban', 'presentation', 'time management'
    }

    for skill in skills_list:
        sk_lower = skill.lower()
        if sk_lower in cloud_tool_keywords:
            tools_cloud.append(skill)
        elif sk_lower in soft_keywords:
            soft_collab.append(skill)
        else:
            hard_skills.append(skill)

    return {
        "hard_skills": hard_skills,
        "tools_and_platforms": tools_cloud,
        "soft_skills_and_methodologies": soft_collab
    }

def get_simulated_linkedin_job(job_id: str, original_url: str) -> Dict[str, Any]:
    """Fallback generator for offline development or sandbox mode."""
    # Deterministic simulation based on hash of job_id
    sample_roles = [
        {
            "title": "Full Stack Software Engineer",
            "company": "Stripe",
            "location": "San Francisco, CA (Hybrid)",
            "employment_type": "Full-time",
            "seniority_level": "Mid-Senior level",
            "description": (
                "About Stripe:\nStripe is a financial infrastructure platform for the internet. "
                "Millions of companies use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.\n\n"
                "The Role:\nWe are looking for a Full Stack Software Engineer to build resilient, distributed web applications. "
                "You will collaborate across product and design to deliver mission-critical payment workflows.\n\n"
                "Responsibilities:\n"
                "• Design, build, and maintain scalable APIs, microservices, and user-facing features using React, TypeScript, and Node.js.\n"
                "• Architect data models with PostgreSQL, Redis, and ensure fault-tolerant distributed transactions.\n"
                "• Build automated CI/CD pipelines, containerize services using Docker and Kubernetes, and deploy to AWS.\n"
                "• Conduct comprehensive code reviews, write unit and end-to-end tests, and mentor junior engineers.\n\n"
                "Requirements:\n"
                "• 3+ years of professional software engineering experience building production web applications.\n"
                "• Strong proficiency in React, TypeScript, Python or Node.js, and SQL databases (PostgreSQL).\n"
                "• Hands-on experience with cloud infrastructure (AWS or GCP), Docker, and REST/GraphQL APIs.\n"
                "• Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience."
            )
        },
        {
            "title": "Senior Backend Developer",
            "company": "Datadog",
            "location": "New York, NY (Remote)",
            "employment_type": "Full-time",
            "seniority_level": "Senior level",
            "description": (
                "About Datadog:\nDatadog is the monitoring and security platform for cloud applications.\n\n"
                "Responsibilities:\n"
                "• Architect high-throughput real-time ingestion pipelines processing millions of metrics per second.\n"
                "• Optimize low-latency microservices with Python, Go, and Redis caching layers.\n"
                "• Build resilient event-driven architectures with Apache Kafka and PostgreSQL.\n"
                "• Deploy resilient infrastructure via Kubernetes, Terraform, and AWS cloud services.\n\n"
                "Requirements:\n"
                "• 5+ years of backend engineering experience with Python, Go, or Java.\n"
                "• Deep knowledge of distributed systems, concurrency, database indexing, and API scaling.\n"
                "• Experience with Docker, Kubernetes, CI/CD, and cloud observability."
            )
        }
    ]
    
    idx = sum(ord(c) for c in (job_id or "123")) % len(sample_roles)
    chosen = sample_roles[idx]
    
    return {
        "job_id": job_id or "4129849201",
        "job_title": chosen["title"],
        "company_name": chosen["company"],
        "location": chosen["location"],
        "employment_type": chosen["employment_type"],
        "seniority_level": chosen["seniority_level"],
        "job_description": chosen["description"],
        "raw_text": chosen["description"],
        "is_easy_apply": True,
        "job_url": original_url or f"https://www.linkedin.com/jobs/view/{job_id}",
        "source": "simulated_sandbox"
    }

def scrape_linkedin_job(url_or_id: str) -> Dict[str, Any]:
    """
    Scrapes a LinkedIn job posting from a public URL or Job ID.
    Extracts metadata, job description, company name, location, and structured details.
    Gracefully falls back to simulated sandbox if LinkedIn anti-bot prevents direct guest fetching.
    """
    job_id = extract_linkedin_job_id(url_or_id)
    if not job_id:
        # Check if the user pasted raw text or a non-standard URL
        if len(url_or_id.strip()) > 100 and " " in url_or_id:
            # User pasted the job description directly!
            clean_text = url_or_id.strip()
            # Extract possible title from first line
            first_line = clean_text.split("\n")[0][:80].strip()
            return {
                "job_id": "custom-" + str(abs(hash(clean_text[:50]))),
                "job_title": first_line or "Target Role",
                "company_name": "Company",
                "location": "Remote / Unspecified",
                "employment_type": "Full-time",
                "seniority_level": "Mid Level",
                "job_description": clean_text,
                "raw_text": clean_text,
                "is_easy_apply": False,
                "job_url": "",
                "source": "manual_paste"
            }
        else:
            raise ValueError("Could not find a valid LinkedIn Job ID or URL.")

    # Target URLs to query
    guest_api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
    view_url = f"https://www.linkedin.com/jobs/view/{job_id}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site"
    }

    try:
        # Attempt 1: Fetch from guest API endpoint
        response = requests.get(guest_api_url, headers=headers, timeout=6)
        
        if response.status_code == 200 and len(response.text) > 400:
            html_content = response.text
            
            # 1. Check for JSON-LD JobPosting schema
            json_ld_matches = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', html_content)
            for raw_json in json_ld_matches:
                try:
                    data = json.loads(raw_json)
                    if isinstance(data, dict) and data.get("@type") == "JobPosting":
                        desc = clean_html(data.get("description", ""))
                        org = data.get("hiringOrganization", {})
                        company = org.get("name") if isinstance(org, dict) else str(org)
                        
                        addr = data.get("jobLocation", {}).get("address", {})
                        if isinstance(addr, dict):
                            loc_parts = [addr.get("addressLocality"), addr.get("addressRegion"), addr.get("addressCountry")]
                            location = ", ".join([p for p in loc_parts if p]) or "Location Not Specified"
                        else:
                            location = "Location Not Specified"

                        return {
                            "job_id": job_id,
                            "job_title": data.get("title", "Position Available").strip(),
                            "company_name": (company or "Company").strip(),
                            "location": location,
                            "employment_type": data.get("employmentType", "Full-time"),
                            "seniority_level": "Professional",
                            "job_description": desc,
                            "raw_text": desc,
                            "is_easy_apply": True,
                            "job_url": view_url,
                            "source": "linkedin_guest_jsonld"
                        }
                except Exception:
                    continue

            # 2. Parse HTML tags from guest endpoint
            title_m = re.search(r'<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)</h2>', html_content)
            title = clean_html(title_m.group(1)) if title_m else ""

            company_m = re.search(r'<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)</a>', html_content) or \
                        re.search(r'<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([\s\S]*?)</span>', html_content)
            company = clean_html(company_m.group(1)) if company_m else "Company"

            location_m = re.search(r'<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)</span>', html_content)
            location = clean_html(location_m.group(1)) if location_m else "Location Not Specified"

            desc_m = re.search(r'<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)</div>', html_content) or \
                     re.search(r'<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)</div>', html_content)
            description = clean_html(desc_m.group(1)) if desc_m else ""

            if title and description:
                return {
                    "job_id": job_id,
                    "job_title": title,
                    "company_name": company,
                    "location": location,
                    "employment_type": "Full-time",
                    "seniority_level": "Professional",
                    "job_description": description,
                    "raw_text": description,
                    "is_easy_apply": True,
                    "job_url": view_url,
                    "source": "linkedin_guest_html"
                }

        # Attempt 2: If guest endpoint is empty or challenged, try view_url
        response_view = requests.get(view_url, headers=headers, timeout=6)
        if response_view.status_code == 200:
            view_html = response_view.text
            json_ld_matches = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', view_html)
            for raw_json in json_ld_matches:
                try:
                    data = json.loads(raw_json)
                    if isinstance(data, dict) and data.get("@type") == "JobPosting":
                        desc = clean_html(data.get("description", ""))
                        org = data.get("hiringOrganization", {})
                        company = org.get("name") if isinstance(org, dict) else str(org)
                        
                        return {
                            "job_id": job_id,
                            "job_title": data.get("title", "Position Available").strip(),
                            "company_name": (company or "Company").strip(),
                            "location": "Location from LinkedIn",
                            "employment_type": data.get("employmentType", "Full-time"),
                            "seniority_level": "Professional",
                            "job_description": desc,
                            "raw_text": desc,
                            "is_easy_apply": True,
                            "job_url": view_url,
                            "source": "linkedin_view_jsonld"
                        }
                except Exception:
                    continue

    except Exception as e:
        print(f"Direct LinkedIn scraping encountered network/challenge event: {e}. Falling back to sandbox simulator.")

    # Graceful fallback to sandbox mock if LinkedIn anti-bot challenges request
    return get_simulated_linkedin_job(job_id, view_url)

def process_scraped_job_with_intelligence(
    job_data: Dict[str, Any], 
    resume_skills: Optional[List[str]] = None,
    resume_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Enriches the scraped job description with skill keyword extraction,
    experience requirements, and candidate gap match analysis.
    """
    description = job_data.get("job_description", "")
    title = job_data.get("job_title", "")
    combined_text = f"{title}\n{description}"

    # Extract all technical skills and keywords from job description
    extracted_skills = extract_skills_from_text(combined_text)
    categorized = categorize_skills(extracted_skills)
    
    years_exp = extract_years_experience(description)
    education = extract_education_requirement(description)

    result = {
        "job_info": job_data,
        "keywords": {
            "all_extracted_skills": extracted_skills,
            "hard_skills": categorized["hard_skills"],
            "tools_and_platforms": categorized["tools_and_platforms"],
            "soft_skills": categorized["soft_skills_and_methodologies"],
            "total_skills_count": len(extracted_skills)
        },
        "requirements": {
            "experience": years_exp or "Not explicitly specified",
            "education": education or "Degree or equivalent experience"
        }
    }

    # If candidate resume data is available, compute match & gap analysis
    if resume_skills is not None or resume_text is not None:
        cand_skills = resume_skills or []
        cand_text = resume_text or ""
        
        match_result = semantic.match_job_description(
            resume_text=cand_text,
            resume_skills=cand_skills,
            jd_text=description
        )
        result["match_analysis"] = match_result

    return result


def extract_linkedin_username(url_or_handle: str) -> Optional[str]:
    """Extracts clean LinkedIn username handle from a URL or raw handle string."""
    if not url_or_handle:
        return None
    clean = url_or_handle.strip().rstrip('/')
    
    # Matches: linkedin.com/in/alex-chen or https://www.linkedin.com/in/alex-chen?trk=...
    m = re.search(r'linkedin\.com/in/([a-zA-Z0-9_\-\%]+)', clean, re.IGNORECASE)
    if m:
        return urllib.parse.unquote(m.group(1).split('?')[0])
        
    # Matches: /in/alex-chen or in/alex-chen
    m2 = re.search(r'^/?in/([a-zA-Z0-9_\-\%]+)', clean, re.IGNORECASE)
    if m2:
        return urllib.parse.unquote(m2.group(1).split('?')[0])
        
    # Clean handles like @alex-chen or alex-chen-123
    clean_handle = clean.lstrip('@')
    if re.fullmatch(r'[a-zA-Z0-9_\-]{3,100}', clean_handle) and not clean_handle.startswith(('http', 'www', 'linkedin')):
        return clean_handle
        
    return None


def _format_name_from_handle(handle: str) -> str:
    """Converts a handle like 'ashnoorsingh', 'alex_chen', or 'sarah-lin-pm' into a natural proper name."""
    # Remove trailing digits or random hashes
    raw = re.sub(r'[\d]+$', '', handle).strip('_- .')
    if not raw:
        return handle.capitalize()

    # Split camelCase if present (e.g. ashnoorSingh -> ashnoor Singh)
    raw = re.sub(r'([a-z])([A-Z])', r'\1 \2', raw)

    # Split by standard delimiters -, _, .
    parts = [p.strip() for p in re.split(r'[-_.\s]+', raw) if p.strip()]

    # If it's a single concatenated word (e.g. 'ashnoorsingh'), attempt intelligent surname segmentation
    if len(parts) == 1 and len(parts[0]) > 6:
        single = parts[0].lower()
        common_surnames = [
            'singh', 'kumar', 'sharma', 'gupta', 'patel', 'verma', 'reddy', 'mehta', 'shah', 
            'chen', 'wang', 'zhang', 'kim', 'lee', 'park', 'smith', 'johnson', 'williams', 'brown',
            'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez'
        ]
        for surname in common_surnames:
            if single.endswith(surname) and len(single) > len(surname) + 2:
                prefix = single[:-len(surname)]
                parts = [prefix, surname]
                break

    cleaned = [p.capitalize() for p in parts if p and not p.isdigit()]
    if not cleaned:
        return handle.capitalize()
    return " ".join(cleaned[:3])


def get_simulated_linkedin_profile(
    username: str, 
    original_url: str = "", 
    target_role: str = "Software Engineer", 
    target_industry: str = "Technology"
) -> Dict[str, Any]:
    """
    Generates a deterministic, realistic LinkedIn profile structure based on the handle & role.
    Used for instant preview and offline development when LinkedIn rate-limits guest requests.
    """
    full_name = _format_name_from_handle(username)
    role_title = target_role if target_role else "Software Engineer"
    
    # Diverse profile templates based on hash of username
    seed = sum(ord(c) for c in (username or "user"))
    companies = ["Stripe", "Datadog", "Cloudflare", "Snowflake", "Figma", "Atlassian", "Twilio"]
    chosen_company = companies[seed % len(companies)]
    previous_company = companies[(seed + 1) % len(companies)]
    
    locations = [
        "San Francisco Bay Area, CA", 
        "Seattle, Washington, United States", 
        "New York, NY", 
        "Austin, Texas, United States", 
        "Toronto, Ontario, Canada", 
        "Bengaluru, Karnataka, India"
    ]
    chosen_location = locations[seed % len(locations)]

    headline = f"Senior {role_title} at {chosen_company} | Cloud Architecture, High-Throughput APIs & Distributed Systems"
    
    about = (
        f"Experienced {role_title} with 5+ years of software design and system architecture experience across high-growth product teams. "
        f"Specialized in architecting performant microservices, optimizing database latency, and delivering secure cloud infrastructure on AWS and GCP. "
        f"Passionate about clean code, mentoring engineering talent, and solving high-concurrency challenges in the {target_industry} space."
    )
    
    experiences = [
        {
            "title": f"Senior {role_title}",
            "company": chosen_company,
            "duration": "2023 - Present · 2 yrs",
            "location": chosen_location,
            "description": (
                f"• Architected core microservices handling 50M+ daily API requests using Python, Go, and PostgreSQL.\n"
                f"• Reduced p99 API latency by 38% through Redis caching strategies and optimized database query plans.\n"
                f"• Mentored 4 engineers and led migration to Kubernetes container clusters on AWS."
            )
        },
        {
            "title": f"{role_title}",
            "company": previous_company,
            "duration": "2021 - 2023 · 2 yrs",
            "location": "Remote",
            "description": (
                f"• Engineered scalable full-stack web applications utilizing React, TypeScript, and Node.js.\n"
                f"• Automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing release cycles from days to minutes.\n"
                f"• Implemented end-to-end integration test suites boosting overall code coverage from 62% to 91%."
            )
        }
    ]
    
    education = [
        {
            "institution": "University of Technology",
            "degree": "Bachelor of Science (B.S.), Computer Science",
            "duration": "2017 - 2021"
        }
    ]
    
    default_skills = [
        "Python", "TypeScript", "React", "Node.js", "PostgreSQL", 
        "AWS", "Docker", "Kubernetes", "Redis", "Microservices", 
        "REST APIs", "CI/CD", "Git", "System Design", "Agile"
    ]
    
    raw_text = (
        f"{full_name}\n"
        f"{headline}\n"
        f"Location: {chosen_location}\n\n"
        f"About:\n{about}\n\n"
        f"Experience:\n"
        f"1. {experiences[0]['title']} at {experiences[0]['company']} ({experiences[0]['duration']})\n"
        f"{experiences[0]['description']}\n\n"
        f"2. {experiences[1]['title']} at {experiences[1]['company']} ({experiences[1]['duration']})\n"
        f"{experiences[1]['description']}\n\n"
        f"Education:\n{education[0]['degree']} - {education[0]['institution']}\n\n"
        f"Skills:\n" + ", ".join(default_skills)
    )

    return {
        "profile_info": {
            "username": username,
            "full_name": full_name,
            "headline": headline,
            "location": chosen_location,
            "current_company": chosen_company,
            "about": about,
            "profile_url": original_url or f"https://www.linkedin.com/in/{username}",
            "experience": experiences,
            "education": education,
            "skills": default_skills,
            "avatar_initials": "".join([p[0] for p in full_name.split()[:2]]).upper(),
            "source": "simulated_sandbox"
        },
        "raw_text": raw_text,
        "extracted_skills": default_skills,
        "categorized_skills": categorize_skills(default_skills)
    }


def scrape_linkedin_profile(
    url_or_handle: str, 
    target_role: str = "Software Engineer", 
    target_industry: str = "Technology"
) -> Dict[str, Any]:
    """
    Scrapes a public LinkedIn profile from URL or handle.
    Attempts live guest metadata extraction and seamlessly falls back to 
    intelligent simulation when LinkedIn's login wall or anti-scraping challenge is triggered.
    """
    clean_input = url_or_handle.strip()
    username = extract_linkedin_username(clean_input)
    
    if not username:
        if len(clean_input) > 80 and " " in clean_input:
            # User passed raw text of their profile
            skills = extract_skills_from_text(clean_input)
            first_line = clean_input.split('\n')[0][:60].strip()
            return {
                "profile_info": {
                    "username": "custom_profile",
                    "full_name": first_line or "Candidate Profile",
                    "headline": "Professional Profile",
                    "location": "Location Unspecified",
                    "current_company": "Current Organization",
                    "about": clean_input[:300] + ("..." if len(clean_input) > 300 else ""),
                    "profile_url": "",
                    "experience": [],
                    "education": [],
                    "skills": skills,
                    "avatar_initials": "CP",
                    "source": "manual_paste"
                },
                "raw_text": clean_input,
                "extracted_skills": skills,
                "categorized_skills": categorize_skills(skills)
            }
        else:
            raise ValueError(f"Could not extract a valid LinkedIn profile username or URL from '{clean_input}'.")

    profile_url = f"https://www.linkedin.com/in/{username}" if not clean_input.startswith("http") else clean_input

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache"
    }

    try:
        response = requests.get(profile_url, headers=headers, timeout=6)
        if response.status_code == 200 and len(response.text) > 400:
            html_text = response.text
            
            # 1. Check for JSON-LD schema
            json_ld_matches = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', html_text)
            for raw_json in json_ld_matches:
                try:
                    data = json.loads(raw_json)
                    if isinstance(data, dict) and data.get("@type") == "Person":
                        full_name = data.get("name", "").strip() or _format_name_from_handle(username)
                        headline = data.get("jobTitle", "").strip()
                        about = data.get("description", "").strip()
                        addr = data.get("address", {})
                        location = addr.get("addressLocality") or addr.get("addressRegion") or "Global"
                        
                        extracted_skills = extract_skills_from_text(f"{headline}\n{about}")
                        raw_text = f"{full_name}\n{headline}\n{location}\n\n{about}\n\nSkills: {', '.join(extracted_skills)}"
                        
                        return {
                            "profile_info": {
                                "username": username,
                                "full_name": full_name,
                                "headline": headline,
                                "location": location,
                                "current_company": data.get("worksFor", {}).get("name", "Industry Leader"),
                                "about": about,
                                "profile_url": profile_url,
                                "experience": [],
                                "education": [],
                                "skills": extracted_skills,
                                "avatar_initials": "".join([p[0] for p in full_name.split()[:2]]).upper(),
                                "source": "linkedin_public_scrape"
                            },
                            "raw_text": raw_text,
                            "extracted_skills": extracted_skills,
                            "categorized_skills": categorize_skills(extracted_skills)
                        }
                except Exception:
                    continue

            # 2. Extract from OpenGraph tags and HTML title
            og_title_m = re.search(r'<meta[^>]+(?:property|name)=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE) or \
                         re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:title["\']', html_text, re.IGNORECASE)
            
            og_desc_m = re.search(r'<meta[^>]+(?:property|name)=["\'](?:og:description|description)["\'][^>]+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE) or \
                        re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:description|description)["\']', html_text, re.IGNORECASE)
            
            title_tag_m = re.search(r'<title>([\s\S]*?)</title>', html_text, re.IGNORECASE)
            raw_title = html.unescape(og_title_m.group(1)) if og_title_m else (clean_html(title_tag_m.group(1)) if title_tag_m else "")
            raw_desc = html.unescape(og_desc_m.group(1)) if og_desc_m else ""
            
            if raw_title or raw_desc:
                # Title format: "Alex Chen - Senior SDE - Stripe | LinkedIn"
                title_clean = raw_title.replace(" | LinkedIn", "").replace(" – LinkedIn", "").strip()
                name_parts = title_clean.split(" - ") if " - " in title_clean else title_clean.split(" – ")
                full_name = name_parts[0].strip() if name_parts and name_parts[0].strip() else _format_name_from_handle(username)
                headline = name_parts[1].strip() if len(name_parts) > 1 else (raw_desc[:120] if raw_desc else f"Professional in {target_industry}")
                
                extracted_skills = extract_skills_from_text(f"{raw_title}\n{raw_desc}")
                raw_text = f"{full_name}\n{headline}\n\nAbout/Description:\n{raw_desc}\n\nSkills: {', '.join(extracted_skills)}"
                
                return {
                    "profile_info": {
                        "username": username,
                        "full_name": full_name,
                        "headline": headline,
                        "location": "LinkedIn Member",
                        "current_company": "Organization",
                        "about": raw_desc or "Experienced professional with background in engineering and tech.",
                        "profile_url": profile_url,
                        "experience": [],
                        "education": [],
                        "skills": extracted_skills,
                        "avatar_initials": "".join([p[0] for p in full_name.split()[:2]]).upper() or "LI",
                        "source": "linkedin_public_scrape"
                    },
                    "raw_text": raw_text,
                    "extracted_skills": extracted_skills,
                    "categorized_skills": categorize_skills(extracted_skills)
                }

    except Exception as e:
        print(f"Direct LinkedIn profile scrape encountered: {e}. Falling back to simulation engine.")

    # Graceful fallback to rich simulated profile
    return get_simulated_linkedin_profile(username, profile_url, target_role, target_industry)


def audit_scraped_linkedin_profile(
    profile_data: Dict[str, Any],
    target_role: str = "Software Engineer",
    target_industry: str = "Technology",
    resume_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Enriches scraped or pasted LinkedIn profile data with:
    1. Gemini AI audit evaluation (completeness, keywords, headline suggestions, summary rewrite)
    2. Recruiter keyword gap analysis tailored to target role & industry
    3. Cross-platform consistency matching against the candidate's active resume.
    """
    from app.services import gemini_service, skill_engine
    
    raw_text = profile_data.get("raw_text", "")
    profile_info = profile_data.get("profile_info", {})
    extracted_skills = profile_data.get("extracted_skills", [])
    
    # Run audit through Gemini (or sandbox fallback)
    audit_report = gemini_service.audit_linkedin_profile(
        profile_text=raw_text,
        target_role=target_role,
        target_industry=target_industry
    )
    
    # Recruiter Discoverability & SEO Score
    recruiter_discoverability = min(100, int(
        (audit_report.get("completeness_score", 70) * 0.35) + 
        (audit_report.get("keyword_richness", 65) * 0.40) + 
        (audit_report.get("headline_impact", 60) * 0.25)
    ))
    audit_report["recruiter_discoverability"] = recruiter_discoverability

    # Keyword Gap Analysis against Target Role
    role_key = target_role.lower()
    high_priority_keywords = []
    
    # Determine target skills pool from TECH_FAMILIES
    if any(k in role_key for k in ["front", "react", "ui", "web"]):
        high_priority_keywords = ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind", "REST API", "GraphQL", "UI/UX", "Git", "CI/CD"]
    elif any(k in role_key for k in ["back", "python", "node", "api", "distributed"]):
        high_priority_keywords = ["Python", "PostgreSQL", "Node.js", "Docker", "AWS", "Redis", "Microservices", "REST API", "Kubernetes", "System Design"]
    elif any(k in role_key for k in ["data", "ml", "ai", "scientist", "machine"]):
        high_priority_keywords = ["Python", "SQL", "Pandas", "PyTorch", "TensorFlow", "Machine Learning", "Scikit-Learn", "PostgreSQL", "Statistics", "Docker"]
    elif any(k in role_key for k in ["devops", "cloud", "sre", "infra"]):
        high_priority_keywords = ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Git", "Python", "Prometheus", "Bash"]
    elif any(k in role_key for k in ["product", "pm", "manager"]):
        high_priority_keywords = ["Product Management", "Agile", "Scrum", "Roadmapping", "SQL", "UI/UX", "A/B Testing", "Data Analysis", "Jira", "Cross-functional Leadership"]
    else:
        # General Software Engineer defaults
        high_priority_keywords = ["Python", "React", "TypeScript", "PostgreSQL", "AWS", "Docker", "Git", "REST APIs", "Microservices", "System Design"]

    # Normalize existing profile skills
    profile_skills_lower = {s.lower() for s in extracted_skills}
    for word in raw_text.split():
        clean_w = re.sub(r'[^a-zA-Z0-9]', '', word).lower()
        if clean_w:
            profile_skills_lower.add(clean_w)

    present_keywords = []
    missing_keywords = []
    
    for kw in high_priority_keywords:
        if kw.lower() in profile_skills_lower:
            present_keywords.append(kw)
        else:
            missing_keywords.append(kw)

    keyword_gap = {
        "target_role": target_role,
        "target_industry": target_industry,
        "present_keywords": present_keywords,
        "missing_keywords": missing_keywords,
        "coverage_percentage": int((len(present_keywords) / max(1, len(high_priority_keywords))) * 100)
    }

    # Cross-Platform Resume Alignment (if resume skills provided)
    cross_platform = None
    if resume_skills:
        res_skills_set = {s.lower() for s in resume_skills}
        prof_skills_set = {s.lower() for s in extracted_skills}
        
        shared = [s for s in resume_skills if s.lower() in prof_skills_set]
        in_resume_only = [s for s in resume_skills if s.lower() not in prof_skills_set][:10]
        in_linkedin_only = [s for s in extracted_skills if s.lower() not in res_skills_set][:10]
        
        consistency_pct = int((len(shared) / max(1, len(resume_skills))) * 100)
        verdict_str = (
            "Excellent Consistency" if consistency_pct >= 75 else
            "Moderate Overlap" if consistency_pct >= 45 else
            "Platform Discrepancy Found"
        )
        cross_platform = {
            "consistency_score": consistency_pct,
            "shared_skills": shared,
            "skills_on_resume_missing_on_linkedin": in_resume_only,
            "skills_on_linkedin_missing_on_resume": in_linkedin_only,
            "alignment_verdict": verdict_str,
            "verdict": verdict_str
        }

    score_val = audit_report.get("score_overall", 75)
    return {
        "profile_info": profile_info,
        "audit": audit_report,
        "keyword_gap": keyword_gap,
        "cross_platform_alignment": cross_platform,
        "cross_platform_consistency": cross_platform,
        "score": {
            "overall": score_val,
            "completeness": audit_report.get("completeness_score", 70),
            "keyword_richness": audit_report.get("keyword_richness", 65),
            "headline_impact": audit_report.get("headline_impact", 60),
            "recruiter_discoverability": recruiter_discoverability
        },
        # Flattened top-level fields for seamless backward compatibility
        "score_overall": score_val,
        "completeness_score": audit_report.get("completeness_score", 70),
        "keyword_richness": audit_report.get("keyword_richness", 65),
        "headline_impact": audit_report.get("headline_impact", 60),
        "recruiter_discoverability": recruiter_discoverability,
        "headline_suggestions": audit_report.get("headline_suggestions", []),
        "summary_suggestion": audit_report.get("summary_suggestion", ""),
        "strengths": audit_report.get("strengths", []),
        "weaknesses": audit_report.get("weaknesses", []),
        "recommendations": audit_report.get("recommendations", [])
    }

