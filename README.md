# ResumeIQ AI – Explainable Resume Intelligence Platform

ResumeIQ AI is a next-generation resume analysis SaaS designed to bypass the ambiguity of traditional ATS calculators. By separating deterministic layout parsing from human-style recruiter critiques, the platform delivers zero-variance scoring and actionable transparency for applicants targeting Tech and Non-Tech roles.

---

## Key Differentiators & Architecture

1. **Explainable Scoring Engine**: Scores are computed locally based on fixed mathematical weights: 25% Parsing, 20% Keyword Match, 15% Formatting, 15% Achievement Quality, 10% Readability, 10% Section Completeness, and 5% Industry Alignment.
2. **ATS Parsing Simulator**: Displays "What ATS Sees" (clean textual streams) side-by-side with parsed elements (Name, contact data, lists of skills) and maps warning flags if core sections fail to parse.
3. **Multi-Role Benchmarks**: Evaluates resumes against normal distributions modeled for:
   - **Tech Tracks**: Software Development Engineer (SDE), Full Stack Developer, Data Scientist, DevOps Engineer.
   - **Non-Tech Tracks**: Product Manager, Marketing Specialist, HR Specialist, Financial Analyst.
4. **Recruiter personas & FAANG Readiness**: Leverages Gemini 2.5 Pro for custom hiring critique modules matching specific company values (Google, Amazon, Meta, Microsoft) and optimizes weak bullets into quantified metric impact statements.
5. **Sandbox Mock Fallback**: Runs 100% offline out-of-the-box using simulated Gemini evaluations if no API Key is configured in `.env`.

---

## Directory Structure

```text
ResumeIQ/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py          # Environment settings loader
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy configuration
│   │   │   └── models.py          # SQLite database schema models
│   │   ├── services/
│   │   │   ├── parser.py          # PDF & DOCX text extraction
│   │   │   ├── formatting.py      # Layout column/table/font audit
│   │   │   ├── scoring.py         # Deterministic scoring algorithm
│   │   │   ├── semantic.py        # TF-IDF Cosine Similarity engine
│   │   │   ├── benchmarking.py    # Cumulative statistical percentiles
│   │   │   └── gemini_service.py  # AI critiques & rewriter
│   │   └── main.py                # FastAPI endpoints
│   ├── .env                       # Local configurations
│   └── requirements.txt           # Python packages list
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DashboardLayout.tsx # Navigation and global wrapping shell
    │   │   ├── UploadSection.tsx   # React-dropzone uploader & progress machine
    │   │   └── ParserSimulator.tsx # Render of parsed vs raw streams
    │   ├── pages/
    │   │   ├── LandingPage.tsx     # Animated SaaS intro screen
    │   │   ├── AtsAnalysis.tsx     # Circular compatibility breakdowns
    │   │   ├── JdMatch.tsx         # Job description paste and keyword search
    │   │   ├── FaangReadiness.tsx  # Company readiness sub-sliders
    │   │   ├── RecruiterReview.tsx # Avatar reviews and AI bullet rewriter
    │   │   ├── History.tsx         # Draft version line chart tracking
    │   │   └── Settings.tsx        # System configuration page
    │   ├── App.tsx                 # Core React state routing
    │   └── index.css               # Design system stylings
    ├── tailwind.config.js          # Design token colors configuration
    └── package.json                # React packages list
```

---

## Launch Instructions

### 1. Launch Backend API Server
Navigate to the `backend/` directory, activate the virtual environment, and boot up the FastAPI app:

```bash
cd backend
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Start Uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Open your browser to `http://127.0.0.1:8000/docs` to view the interactive FastAPI Swagger UI.

### 2. Launch React Frontend
Navigate to the `frontend/` directory and spin up the Vite development server:

```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` to explore the platform.

### 3. (Optional) Configure Gemini API
Create a free Gemini API Key at [Google AI Studio](https://aistudio.google.com). You can paste this key directly under the **Settings** page in the browser (saved locally inside `localStorage` for your session) or add it to the `backend/.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```
Once added, the system automatically transitions from **Sandbox Mock Mode** to **Live Gemini Engine**.
