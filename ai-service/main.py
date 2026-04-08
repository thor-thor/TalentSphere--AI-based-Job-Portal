from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional
from parser import parser
from matcher import matcher

app = FastAPI(title="TalentSphere AI Service")

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

class RecommendationRequest(BaseModel):
    user_profile: dict
    jobs: List[dict]

class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.get("/")
async def root():
    return {"message": "TalentSphere AI Service is running"}

@app.post("/parse_resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_data = parser.parse(content, file.filename)
        return {
            "filename": file.filename,
            "extracted_data": extracted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match_job")
async def match_job_endpoint(request: JobMatchRequest):
    try:
        score = matcher.calculate_match(request.resume_text, request.job_description)
        # Simple logic for skills comparison
        resume_doc = parser.nlp(request.resume_text.lower())
        job_doc = parser.nlp(request.job_description.lower())
        
        resume_skills = set([token.text for token in resume_doc if token.text in [s.lower() for s in parser.skills]])
        job_skills = set([token.text for token in job_doc if token.text in [s.lower() for s in parser.skills]])
        
        matching = list(resume_skills.intersection(job_skills))
        missing = list(job_skills.difference(resume_skills))
        
        return {
            "match_score": score,
            "matching_skills": matching,
            "missing_skills": missing
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend_jobs")
async def recommend_jobs_endpoint(request: RecommendationRequest):
    try:
        recommendations = matcher.get_recommendations(request.user_profile, request.jobs)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_resume")
async def analyze_resume_endpoint(resume_text: str):
    try:
        resume_doc = parser.nlp(resume_text.lower())
        skills_found = [token.text for token in resume_doc if token.text in [s.lower() for s in parser.skills]]
        
        # Simple ATS score logic
        score = min(100, len(skills_found) * 10 + (20 if len(resume_text) > 500 else 10))
        
        suggestions = []
        if len(skills_found) < 5:
            suggestions.append("Add more technical skills relevant to your target roles.")
        if len(resume_text) < 300:
            suggestions.append("Your resume content seems brief. Consider adding more details about your projects and responsibilities.")
            
        return {
            "ats_score": score,
            "suggestions": suggestions,
            "skills_detected": list(set(skills_found))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    msg = request.message.lower()
    
    # Conversational Logic with Keyword Mapping
    responses = {
        "hello": "Hello! I'm your TalentSphere AI assistant. I can help you find jobs, analyze your resume, and give career tips. How can I help you today?",
        "hi": "Hi there! Ready to take the next step in your career? Ask me about job recommendations or resume analysis.",
        "job": "I can definitely help with that! Based on current trends, tech roles like Full Stack Developer and AI Engineer are in high demand. Have you tried our 'Best Matches' feature on your dashboard?",
        "suggest": "Sure! To give you the best suggestions, make sure your resume is uploaded. I'll then analyze your skills and match them with our live job listings.",
        "resume": "A great resume should be concise and skill-focused. Our AI can analyze yours! Just upload it in the Profile section, and I'll give you an ATS score and improvement tips.",
        "analyze": "Once you upload your resume, I'll calculate an ATS score for you and identify 'Missing Skills' that recruiters in your field are looking for.",
        "match": "Matching is based on TF-IDF algorithms. We compare your skill set with the job requirements to give you a percentage score. Aim for 70%+ for best results!",
        "recommend": "I'll look for jobs that match your top skills. If you're a React developer, I'll prioritize Frontend and Full Stack roles for you.",
        "help": "I can help you with: \n1. Finding jobs\n2. Analyzing your resume\n3. Understanding match scores\n4. Career advice\nWhat's on your mind?",
        "salary": "Salaries vary by location and experience. Many of our listings include salary ranges to help you make informed decisions."
    }

    # Best match search
    for key in responses:
        if key in msg:
            return {"response": responses[key]}
            
    return {"response": "That's interesting! I'm still learning, but I can definitely help you with job searches and resume analysis. Would you like to know more about our matching system?"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
