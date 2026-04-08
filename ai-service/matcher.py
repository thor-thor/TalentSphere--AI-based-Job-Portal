from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class JobMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def calculate_match(self, resume_text, job_description):
        if not resume_text or not job_description:
            return 0.0

        tfidf_matrix = self.vectorizer.fit_transform([resume_text, job_description])
        similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        
        match_percentage = round(float(similarity_matrix[0][0]) * 100, 2)
        return match_percentage

    def get_recommendations(self, user_profile, jobs_list):
        # Collaborative filtering or simple content-based filtering
        # For simplicity, we compare user profile text with each job description
        profile_text = f"{user_profile.get('headline', '')} {user_profile.get('summary', '')} {' '.join(user_profile.get('skills', []))}"
        
        scores = []
        for job in jobs_list:
            job_text = f"{job['title']} {job['description']} {job.get('requirements', '')}"
            score = self.calculate_match(profile_text, job_text)
            scores.append({"job_id": job['id'], "score": score})
        
        # Sort by score descending
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores

matcher = JobMatcher()
