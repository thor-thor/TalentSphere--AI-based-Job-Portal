<<<<<<< HEAD
# TalentSphere--AI-based-Job-Portal
=======
# 🌌 TalentSphere - AI-Powered Job Ecosystem

TalentSphere is a next-generation, full-stack job portal designed to bridge the gap between talent and opportunity using modern AI. Built with a robust microservice architecture, it provides intelligent resume parsing, automated skill-gap analysis, and a real-time AI career assistant.

---

## ✨ AI-Powered Features

### 🧠 Intelligent Match Engine
Uses **TF-IDF Vectorization** and **Cosine Similarity** to compare resumes against job descriptions.
- **Match Score**: Instant percentage matching for every application.
- **Skill Gap Analysis**: Visualizes "Matched Skills" vs "Missing Skills" to help seekers improve their odds.
- **Top Recommendations**: Personalized job feeds based on extracted skill profiles.

### 📄 Smart Resume Parsing
Integrated Python microservice powered by **spaCy (NLP)** and **PyMuPDF**.
- Automatically extracts skills, experience, and contact info from PDF/DOCX.
- Calculates an **ATS Score** to give feedback on resume optimization.

### 💬 TalentSphere AI Assistant
A real-time, conversational chatbot that handles:
- Job search assistance.
- Resume improvement tips.
- Understanding matching logic and platform features.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Lucide Icons, Socket.io-client |
| **Backend** | Node.js, Express, PostgreSQL, JWT, Socket.io |
| **AI Service** | Python, FastAPI, spaCy, Scikit-learn, Uvicorn |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- **PostgreSQL** 14+

### Quick Start (Docker)
```bash
docker-compose up -d
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Microservice**: http://localhost:8000

### Manual Setup

1. **Database Initialization**
   - Create a database named `jobportal`.
   - Run the schema found in `database/schema.sql`.
   - (Optional) Run `database/migration_ai.sql` to ensure all AI metadata columns exist.

2. **AI Microservice**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python -m spacy download en_core_web_md
   python main.py
   ```

3. **Backend Server**
   ```bash
   cd backend
   npm install
   # Create .env with DB_PASSWORD and AI_SERVICE_URL=http://localhost:8000
   npm run dev
   ```

4. **Frontend Application**
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## 🔑 Default Credentials

- **Admin**: `admin@talentsphere.com` / `Admin@123`
- **Recruiter**: `recruiter@techcorp.com` / `Recruiter@123`
- **Job Seeker**: `seeker@example.com` / `Seeker@123`

---

## 📐 Architecture Highlights
- **Microservice Separation**: AI logic is isolated in Python to allow for easy integration of LLMs (like GPT or Llama) in the future.
- **Real-time Communication**: WebSockets facilitate instant messaging and live notifications.
- **Premium UI**: Dark-mode first design with glassmorphism effects and modern typography.

---

Developed with ❤️ by the TalentSphere Team.
>>>>>>> f061b326 (✨ Upgrade TalentSphere: Added AI Matching, Resume Parsing, and Smart Chat)
