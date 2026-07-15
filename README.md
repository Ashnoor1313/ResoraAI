# 🚀 ResoraAI – Explainable Resume Intelligence Platform

> **Bypass the "Black Box" of Applicant Tracking Systems (ATS).** Get zero-variance scoring, parser visualization, and AI-powered recruiter feedback in one unified, transparent dashboard.

---

## 💡 The Problem It Solves

Applying for jobs in the modern market is a game of statistics, but the systems that judge your resume are completely opaque. Job seekers face several issues:
1. **The ATS Black Box**: Standard Applicant Tracking Systems (ATS) strip formatting, merge columns, or miss vital sections entirely. Job seekers have no way of knowing *what* the parser actually extracted.
2. **Vague, Arbitrary Scores**: Existing tools give a single "score" without explaining the math or showing how to improve.
3. **Disconnected Critiques**: AI critiques are often generic, lacking the specific lenses of recruiters from top firms (like Google's focus on metric impact or Amazon's focus on leadership principles).

**ResoraAI** bridges this gap by decoupling deterministic ATS parsing simulation from advanced AI critiquing. It shows you exactly what the machines see, scores you on a fixed and explainable index, and guides you through iterative improvements with custom recruiter personas.

---

## ✨ Key Features

### 🔍 1. ATS Parser Simulator
* **Side-by-Side Visualizer**: Contrast your uploaded resume file (PDF or DOCX) with the extracted text stream. See exactly how columns, tables, and fonts affect parsing.
* **Entity Extraction**: View parsed contacts, names, skills, education, and professional history elements in structured layouts.
* **Warning Flags**: Instantly highlights critical issues like non-standard characters, multiple columns, hidden tables, or unsupported fonts.

### 📊 2. Explainable Scoring Engine
No guessing. Scores are calculated using transparent, mathematically weighted metrics:
* **25% Parsing Accuracy**: Verifies that standard contact info and key section titles are machine-readable.
* **20% Keyword Match**: Evaluates overlap against targeted job descriptions using semantic TF-IDF.
* **15% Formatting Audit**: Scans layout density, page length, and structure.
* **15% Achievement Quality**: Evaluates quantitative impact statements vs passive duty lists.
* **10% Readability Index**: Computes language complexity and flow.
* **10% Section Completeness**: Assures no major category is missing.
* **5% Industry Alignment**: Compares experience levels and terminologies against standard roles.

### 🎯 3. Multi-Role Target Benchmarks
* Benchmark your profile against normal distributions of actual candidate pools.
* **Supported Tracks**:
  * **Tech**: Software Development Engineer (SDE), Full Stack Developer, Data Scientist, DevOps Engineer.
  * **Non-Tech**: Product Manager, Marketing Specialist, HR Specialist, Financial Analyst.

### 🤖 4. Recruiters & FAANG Readiness Personas
* **Google, Amazon, Meta, Microsoft Critiques**: Runs specialized AI reviews matching candidate evaluation philosophies for each company.
* **Bullet Rewriter**: Transforms passive duty descriptions into quantified, high-impact statements using Google's X-Y-Z formula: *"Accomplished [X] as measured by [Y], by doing [Z]"*.

### 💼 5. Career & Outreach Suite
* **Cover Letter Tailoring**: Generates hyper-relevant cover letters aligned with the JD.
* **LinkedIn Auditor**: Details section-by-section optimizations to boost search visibility.
* **Interview Coach**: Generates behavioral questions tailored to your experience and target role.
* **Networking Outreach**: Outputs custom cold-outreach templates for hiring managers, recruiters, and peers.
* **Portfolio Builder**: Packages resume content into clean, responsive HTML/JS portfolios.

### 🔄 6. Version History & Tracking
* Log revisions and compare scores across multiple iterations.
* Interactive charts visualize metric progress from Draft 1 to final submission.
* **Sandbox Mock Fallback**: Bootstraps the platform without any configuration, transitioning to live Gemini API models instantly once a key is supplied.

---

## 🛠️ Tech Stack

### Frontend (Modern React SPA)
* **Framework**: React 18, TypeScript, Vite
* **Styling**: TailwindCSS (Design Tokens & Layout), Vanilla CSS
* **Charts & Icons**: Recharts, Lucide React
* **File Uploads**: React Dropzone

### Backend (Robust FastAPI & Processing Engine)
* **Framework**: FastAPI (Python 3.10+), Uvicorn
* **Database / ORM**: SQLite (Default) / PostgreSQL support via SQLAlchemy
* **Document Parsing**: PyMuPDF (fitz), pdfplumber (coordinate audit), python-docx
* **Analytics**: NumPy, TF-IDF Cosine Similarity
* **LLM Engine**: Google GenAI SDK (Gemini 2.5 Pro & Gemini 2.5 Flash)

---

## 📂 Project Directory Structure

```text
ResoraAI/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py          # Environment settings loader
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy database engine
│   │   │   └── models.py          # SQLite/Postgres DB schema models
│   │   ├── services/
│   │   │   ├── parser.py          # PDF & DOCX text extraction
│   │   │   ├── formatting.py      # Layout column/table/font audit
│   │   │   ├── scoring.py         # Deterministic scoring algorithm
│   │   │   ├── semantic.py        # TF-IDF Cosine Similarity engine
│   │   │   ├── benchmarking.py    # Cumulative statistical percentiles
│   │   │   └── gemini_service.py  # Gemini AI critiques & rewriter
│   │   └── main.py                # FastAPI endpoints
│   ├── .env                       # Local configurations (port, DB, API keys)
│   └── requirements.txt           # Python packages list
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DashboardLayout.tsx # Navigation and global wrapping shell
    │   │   ├── UploadSection.tsx   # React-dropzone uploader & progress machine
    │   │   └── ParserSimulator.tsx # Render of parsed vs raw streams
    │   ├── pages/
    │   │   ├── LandingPage.tsx     # Animated SaaS landing page
    │   │   ├── AtsAnalysis.tsx     # Circular compatibility breakdowns
    │   │   ├── JdMatch.tsx         # Job description paste and keyword search
    │   │   ├── FaangReadiness.tsx  # Company readiness sub-sliders
    │   │   ├── RecruiterReview.tsx # Avatar reviews and AI bullet rewriter
    │   │   ├── AiAssistant.tsx     # Direct chat with ResoraAI
    │   │   ├── CareerSuite.tsx     # Gateway to Cover Letters, Portfolios, Networking
    │   │   ├── CoverLetterTailor.tsx # Custom cover letter generation
    │   │   ├── LinkedinAudit.tsx   # LinkedIn profile audit dashboard
    │   │   ├── InterviewCoach.tsx  # Mock interview prep
    │   │   ├── NetworkingOutreach.tsx # Cold-outreach script generators
    │   │   ├── PortfolioGenerator.tsx # Code exporter for portfolio websites
    │   │   ├── History.tsx         # Version comparisons and score logs
    │   │   └── Settings.tsx        # System configuration page
    │   ├── App.tsx                 # Core routing & global state manager
    │   └── index.css               # Design system stylings
    ├── tailwind.config.js          # Design token colors configuration
    └── package.json                # React packages list
```

---

## 🚀 Setup & Launch

### 1. Backend API Server Setup
Clone the repository and navigate to the backend folder:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
# Create venv
python -m venv venv

# Activate venv (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate venv (macOS/Linux)
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

Launch the FastAPI dev server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
* Interactive Swagger Docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend React Setup
Open a new terminal, navigate to the frontend folder, and install node modules:
```bash
cd frontend
npm install
```

Launch the Vite development server:
```bash
npm run dev
```
* The application will run at [http://localhost:5173](http://localhost:5173).

---

## 🔑 AI Engine Configuration

ResoraAI supports a dual configuration for intelligence endpoints:
1. **Mock Sandbox Fallback**: Works offline out-of-the-box using local parser rules.
2. **Gemini Live Engine**:
   - Create a free Gemini API Key at [Google AI Studio](https://aistudio.google.com).
   - Enter it directly inside the app's **Settings** page (stored securely in your browser's local storage), OR
   - Create a `.env` file in the `backend/` directory:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```

---

## 📄 License

This project is licensed under the MIT License.
