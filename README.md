# RESUME-PARSER

A **rule-based** resume parsing and job matching system with a modern Web Interface built with **pure Node.js** — zero external dependencies, zero LLMs.

### 🌟 Live Demos
- **Vercel Deployment:** [https://resume-parser-gamma.vercel.app/](https://resume-parser-gamma.vercel.app/)
- **Render Deployment:** [https://resume-parser-1-lo6c.onrender.com](https://resume-parser-1-lo6c.onrender.com)

## Features

- **Resume Parsing** — Extracts Name, Salary, Years of Experience, and Skills from resume text/PDF
- **JD Processing** — Parses 15 job descriptions to extract role, required skills, optional skills, and salary
- **Skill Mapping** — Maps every JD skill against resume skills with `presentInResume: true/false`
- **Matching Score** — `(Matched JD Skills / Total JD Skills) × 100`
- **Weighted Score** — Required skills (70%) + Optional skills (30%) weighted variant
- **Web Interface** — Beautiful, responsive Glassmorphic UI with animated match scores and visualizations
- **HTTP API** — Built-in REST API using Node.js `http` module only
- **No external packages** — Works with Node.js ≥14, no `npm install` needed

## Project Structure

```
resume-matcher/
├── index.js                    # CLI entry point / demo runner
├── package.json
├── src/
│   ├── pdfParser.js            # PDF text extraction (zlib + raw stream)
│   ├── resumeExtractor.js      # Salary, experience, name, skills extraction
│   ├── jdParser.js             # Job description parser
│   ├── matcher.js              # Skill mapping + score calculation
│   ├── skills.js               # Skills dictionary (~200 technologies)
│   └── server.js               # HTTP API server (built-in http module)
├── data/
│   ├── jds/jds.json            # 15 job descriptions (structured)
│   └── resumes/sample_resume.txt
├── output/
│   └── result.json             # Generated output
└── tests/
    └── test.js                 # 26 unit tests (no test framework needed)
```

## Quick Start

```bash
# No installation needed — pure Node.js

# Run demo with sample resume
node index.js

# Run with your own resume file
node index.js path/to/resume.pdf
node index.js path/to/resume.txt

# Start HTTP API server
node index.js --server

# Run tests
node tests/test.js
```

## HTTP API

### `POST /api/match`
Match a resume against all JDs.

```bash
# JSON body
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe\nJava Spring Boot developer with 5 years experience in Docker Kubernetes AWS"}'
```

### `GET /api/jds`
List all parsed job descriptions.

```bash
curl http://localhost:3000/api/jds
```

### `GET /api/health`
Health check.

```bash
curl http://localhost:3000/api/health
```

---

## Output Format

```json
{
  "name": "John Doe",
  "salary": "12 LPA",
  "yearOfExperience": 6,
  "resumeSkills": ["AWS", "Agile", "Angular", "Bash", "CI/CD", "Docker", "Java", ...],
  "matchingJobs": [
    {
      "jobId": "JD002",
      "role": "Capgemini Java Full Stack Engineer",
      "salary": "$61,087 - $104,364",
      "aboutRole": "Should have 7 years of strong hands-on experience with Core Java...",
      "skillsAnalysis": [
        { "skill": "Java", "presentInResume": true },
        { "skill": "Spring Boot", "presentInResume": true },
        { "skill": "Kafka", "presentInResume": true },
        { "skill": "Angular", "presentInResume": true },
        { "skill": "Docker", "presentInResume": true },
        { "skill": "Kubernetes", "presentInResume": true },
        { "skill": "SQL Server", "presentInResume": false },
        { "skill": "Python", "presentInResume": true },
        { "skill": "AI", "presentInResume": false },
        { "skill": "Azure", "presentInResume": false },
        { "skill": "Jenkins", "presentInResume": true },
        { "skill": "CI/CD", "presentInResume": true }
      ],
      "matchingScore": 66.7,
      "weightedScore": 72.3,
      "summary": "8/12 skills matched"
    }
  ]
}
```

---

## Extraction Logic

### Salary Extraction
Uses regex patterns covering:
- Indian format: `12 LPA`, `CTC: ₹10,00,000`, `Expected Salary: 18 LPA`
- US format: `$120,000 - $150,000`, `$61,087 - $104,364`

### Experience Extraction
1. **Explicit patterns**: `"5 years of experience"`, `"6+ years"`, `"Total Experience: 4 years"`
2. **Date range calculation**: Sums up duration of each date range (e.g., `Jan 2020 – Present`)

### Skills Extraction
- Dictionary of ~200 technology skills organized by category (languages, frontend, backend, cloud, ML/AI, DevOps, databases)
- Word-boundary regex matching for each skill
- Alias resolution: `nodejs → Node.js`, `k8s → Kubernetes`, `postgres → PostgreSQL`
- Deduplication: removes subskills when superstring is present (e.g., removes `Spring` if `Spring Boot` found)

### Matching Score
```
Matching Score = (Matched JD Skills / Total JD Skills) × 100
```
Results are sorted by score descending. Ties broken by weighted score.

---

## Technical Requirements

- **Runtime**: Node.js ≥ 14.0.0
- **No external packages** — uses only built-in modules: `fs`, `path`, `http`, `zlib`, `assert`
- **No LLMs** — 100% rule-based / regex / statistical logic

---

## Running Tests

```bash
node tests/test.js
```

26 tests covering:
- Salary extraction (4 tests)
- Experience extraction (5 tests)
- Skills extraction (5 tests)
- Name extraction (2 tests)
- JD parsing (4 tests)
- Matching & scoring (6 tests)