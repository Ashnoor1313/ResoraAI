import sys
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.db import models

client = TestClient(app)
headers = {'Authorization': 'Bearer mock-token'}

print('========================================')
print('  RESORAAI COMPREHENSIVE BACKEND E2E TEST')
print('========================================')

# Setup user and resume
db = SessionLocal()
user = db.query(models.User).filter_by(id='mock-user-123').first()
if not user:
    user = models.User(id='mock-user-123', email='candidate@resumeiq.ai')
    db.add(user)
    db.commit()

resume = db.query(models.Resume).filter_by(user_id='mock-user-123').first()
if not resume:
    resume = models.Resume(
        user_id='mock-user-123',
        filename='ashnoor_senior_dev.pdf',
        file_path='ashnoor_senior_dev.pdf',
        extracted_text='Ashnoor Singh\nSenior Full Stack Engineer\n• Architected a distributed cloud pipeline using Python, FastAPI, and Docker, reducing latency by 35%.\n• Designed and shipped React and TypeScript frontend dashboards with GraphQL and Tailwind CSS.\n• Managed PostgreSQL databases and Redis caching clusters.'
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

report = db.query(models.ScanReport).filter_by(resume_id=resume.id).first()
if not report:
    report = models.ScanReport(
        resume_id=resume.id,
        target_role='Full Stack Engineer',
        score_overall=84.0,
        score_breakdown={'ats_compatibility': 88, 'technical_quality': 85},
        extracted_data={'name': 'Ashnoor Singh', 'skills': ['Python', 'FastAPI', 'Docker', 'React', 'TypeScript', 'PostgreSQL', 'Redis']},
        formatting_issues={'warnings': []},
        keyword_analysis={'resume_keywords': ['Python', 'Docker', 'React'], 'jd_keywords': ['Python', 'Docker', 'AWS'], 'matching_keywords': ['Python', 'Docker'], 'missing_keywords': ['AWS'], 'semantic_matches': [], 'jd_similarity_score': 0.85},
        recruiter_feedback={},
        faang_readiness={},
        benchmarking_percentile=82.0
    )
    db.add(report)
    db.commit()
    db.refresh(report)

resume_id = resume.id
db.close()
print(f'Test User & Resume Ready: Resume ID {resume_id}')

# TEST 1: Phase 1 LinkedIn Job Scraper & JD Matcher
print('\n[TEST 1/6] Testing Phase 1: LinkedIn Job Scraper & Semantic Matcher...')
p1_scrape = client.post('/api/v1/linkedin/scrape-job', json={
    'job_url': 'https://www.linkedin.com/jobs/view/4129849201'
}, headers=headers)
assert p1_scrape.status_code == 200, f'Scrape failed: {p1_scrape.text}'
p1_data = p1_scrape.json()
assert 'job_info' in p1_data and 'keywords' in p1_data
job_info = p1_data['job_info']
skills = p1_data['keywords'].get('all_extracted_skills', [])
print(f"  [PASS] Scraped Job: {job_info.get('job_title')} at {job_info.get('company_name')} ({len(skills)} skills detected)")

p1_match = client.post(f'/api/v1/resumes/{resume_id}/match-jd', json={
    'job_description': 'Seeking a Senior Full Stack Engineer with Python, FastAPI, Docker, and React to build scalable microservices.'
}, headers=headers)
assert p1_match.status_code == 200, f'Match JD failed: {p1_match.text}'
p1_match_data = p1_match.json()
kw = p1_match_data.get('keyword_analysis', {})
print(f"  [PASS] Semantic Match Score: {kw.get('jd_similarity_score')} / 1.0 (Matching: {len(kw.get('matching_keywords', []))})")

# TEST 2: Phase 2 LinkedIn Profile Scraper & Auditor
print('\n[TEST 2/6] Testing Phase 2: LinkedIn Profile Scraper & Auditor...')
p2_scrape = client.post('/api/v1/linkedin/scrape-profile', json={
    'profile_url': 'https://www.linkedin.com/in/ashnoorsingh'
}, headers=headers)
assert p2_scrape.status_code == 200, f'Profile scrape failed: {p2_scrape.text}'
p2_data = p2_scrape.json()
assert 'headline' in p2_data and 'skills' in p2_data
headline_snip = p2_data.get('headline', '')[:40]
print(f"  [PASS] Scraped Profile: {p2_data.get('name', 'User')} - {headline_snip}...")

p2_audit = client.post('/api/v1/tools/linkedin-audit', json={
    'linkedin_url': 'https://www.linkedin.com/in/ashnoorsingh',
    'headline': p2_data.get('headline'),
    'about': p2_data.get('about'),
    'experience': p2_data.get('experience'),
    'target_role': 'Full Stack Engineer',
    'resume_id': resume_id
}, headers=headers)
assert p2_audit.status_code == 200, f'Profile audit failed: {p2_audit.text}'
p2_audit_data = p2_audit.json()
print(f"  [PASS] Profile Audit Score: {p2_audit_data.get('score', {}).get('overall', 'N/A')}/100")
if 'cross_platform_consistency' in p2_audit_data:
    print(f"  [PASS] Cross-Platform Consistency Check: {p2_audit_data['cross_platform_consistency'].get('verdict')}")

# TEST 3: Phase 3 Applications Pipeline CRUD
print('\n[TEST 3/6] Testing Phase 3: Applications Pipeline CRUD...')
# Clean prior test applications for mock-user
db = SessionLocal()
db.query(models.JobApplication).filter_by(user_id='mock-user-123').delete()
db.commit()
db.close()

# List (should be empty for new user)
p3_list1 = client.get('/api/v1/applications', headers=headers)
assert p3_list1.status_code == 200
assert len(p3_list1.json()) == 0, 'New user tracker should be empty initially!'
print('  [PASS] Initial pipeline is empty for new user (0 items)')

# Create
p3_create = client.post('/api/v1/applications', json={
    'title': 'Senior Full Stack Engineer',
    'company': 'Stripe',
    'salary': '$160,000 / yr',
    'location': 'San Francisco, CA (Hybrid)',
    'status': 'applied',
    'match_score': 88.0,
    'skills': ['Python', 'FastAPI', 'React', 'Docker']
}, headers=headers)
assert p3_create.status_code == 200, f'Create application failed: {p3_create.text}'
created_app = p3_create.json()
app_id = created_app['id']
print(f"  [PASS] Created Application: {created_app['title']} at {created_app['company']} (ID: {app_id})")

# Update
p3_update = client.put(f'/api/v1/applications/{app_id}', json={
    'status': 'interviewing',
    'notes': 'Recruiter phone screen scheduled for Tuesday'
}, headers=headers)
assert p3_update.status_code == 200
assert p3_update.json()['status'] == 'interviewing'
print('  [PASS] Updated status to: interviewing with notes')

# TEST 4: Phase 4 Recruiter Cold Outreach Suite
print('\n[TEST 4/6] Testing Phase 4: Cold Outreach Suite (All 4 channels)...')
p4_res = client.post('/api/v1/tools/networking-outreach', json={
    'company_name': 'Stripe',
    'role': 'Senior Full Stack Engineer',
    'recipient_persona': 'Recruiter',
    'recipient_name': 'Sarah Connor',
    'resume_id': resume_id
}, headers=headers)
assert p4_res.status_code == 200, f'Outreach failed: {p4_res.text}'
p4_data = p4_res.json()
assert 'connection_note_300' in p4_data, 'Missing 300-char note'
assert 'inmail' in p4_data, 'Missing InMail'
assert 'cold_email' in p4_data, 'Missing Cold Email'
assert 'day_5_followup' in p4_data, 'Missing Follow-up'
note_preview = p4_data['connection_note_300'][:60]
print(f'  [PASS] 300-Char Note: "{note_preview}..." ({len(p4_data["connection_note_300"])} chars)')
print(f'  [PASS] InMail Pitch: Subject "{p4_data["inmail"].get("subject")}"')
print(f'  [PASS] Cold Email: Subject "{p4_data["cold_email"].get("subject")}"')
print(f'  [PASS] Day 5 Follow-up generated: {len(p4_data["day_5_followup"])} chars')

# TEST 5: Phase 5 RDOM Resume Rebuilder & Live PDF Download
print('\n[TEST 5/6] Testing Phase 5: RDOM Resume Rebuilder & Live PDF...')
p5_recon = client.get(f'/api/v1/resumes/{resume_id}/reconstruction', headers=headers)
assert p5_recon.status_code == 200, f'Reconstruction failed: {p5_recon.text}'
p5_data = p5_recon.json()
assert 'rdom' in p5_data and 'suggestions' in p5_data
print(f"  [PASS] RDOM Pages: {len(p5_data['rdom']['pages'])} | Suggestions: {len(p5_data['suggestions'])}")

approved_changes = {}
if p5_data['suggestions']:
    first_sug = p5_data['suggestions'][0]
    approved_changes[first_sug['block_id']] = first_sug['suggested']

p5_rebuild = client.post(f'/api/v1/resumes/{resume_id}/rebuild', json={
    'approved_changes': approved_changes
}, headers=headers)
assert p5_rebuild.status_code == 200, f'Rebuild failed: {p5_rebuild.text}'
assert p5_rebuild.headers['content-type'] == 'application/pdf'
assert p5_rebuild.content.startswith(b'%PDF-')
print(f"  [PASS] Rebuilt Vector PDF: {len(p5_rebuild.content)} bytes ({p5_rebuild.headers.get('content-disposition')})")

# TEST 6: Phase 6 Interactive Mock Interview Arena & Live Evaluator
print('\n[TEST 6/6] Testing Phase 6: Interactive Interview Arena & Live Evaluator...')
p6_prep = client.post('/api/v1/tools/interview-prep', json={
    'resume_id': resume_id,
    'target_role': 'Senior Full Stack Engineer',
    'company_name': 'Stripe'
}, headers=headers)
assert p6_prep.status_code == 200, f'Interview prep failed: {p6_prep.text}'
p6_prep_data = p6_prep.json()
assert 'questions' in p6_prep_data and len(p6_prep_data['questions']) > 0
q1 = p6_prep_data['questions'][0]
q_text = q1.get('question', '')[:60]
print(f'  [PASS] Generated Question 1: "{q_text}..."')

p6_eval = client.post('/api/v1/tools/interview-evaluate', json={
    'question': q1.get('question'),
    'user_answer': 'So basically, in my previous role, our distributed pipeline was suffering from 800ms latencies. I took ownership, um, redesigned our indexing, and added Redis caching with FastAPI. We dropped latency down to 45ms and increased throughput by 40%.',
    'target_role': 'Senior Full Stack Engineer',
    'company_name': 'Stripe',
    'resume_bullet': q1.get('bullet_ref')
}, headers=headers)
assert p6_eval.status_code == 200, f'Interview evaluate failed: {p6_eval.text}'
eval_res = p6_eval.json()
assert 'overall_score' in eval_res and 'star_ratings' in eval_res
ref_answer = eval_res.get('refined_answer', '')[:65]
print(f"  [PASS] Evaluation Score: {eval_res['overall_score']}/100 ({eval_res.get('verdict')})")
print(f"  [PASS] STAR Dimensions: S={eval_res['star_ratings']['situation']['score']}%, T={eval_res['star_ratings']['task']['score']}%, A={eval_res['star_ratings']['action']['score']}%, R={eval_res['star_ratings']['result']['score']}%")
print(f"  [PASS] Filler Words Detected: {eval_res.get('filler_words')}")
print(f'  [PASS] Refined Exemplar Answer: "{ref_answer}..."')

print('\n========================================')
print('  ALL 6 PHASES BACKEND TESTS PASSED 100%!')
print('========================================')
