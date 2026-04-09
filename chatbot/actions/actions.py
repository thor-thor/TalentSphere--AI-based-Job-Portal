from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection details
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "jobportal")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2003")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

class ActionSearchJobs(Action):
    def name(self) -> Text:
        return "action_search_jobs"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        job_title = tracker.get_slot("job_title")
        
        query = "SELECT title, location, salary_min, salary_max FROM jobs WHERE is_active = true"
        params = []
        
        if job_title:
            query += " AND title ILIKE %s"
            params.append(f"%{job_title}%")
        
        query += " LIMIT 5"
        
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(query, params)
            jobs = cur.fetchall()
            cur.close()
            conn.close()
            
            if not jobs:
                dispatcher.utter_message(text=f"I couldn't find any active jobs for '{job_title or 'your search'}'. Try searching for something else?")
                return []
            
            message = "I found these jobs for you:\n"
            for job in jobs:
                title, loc, smin, smax = job
                message += f"- {title} in {loc} (Salary: {smin}-{smax})\n"
            
            dispatcher.utter_message(text=message)
        except Exception as e:
            dispatcher.utter_message(text="Sorry, I had trouble searching the database.")
            print(f"Error: {e}")
            
        return []

class ActionSuggestSkills(Action):
    def name(self) -> Text:
        return "action_suggest_skills"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # In a real app, this could be based on trending jobs or some analysis
        # Here we'll return some top skills from our skills table
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT name FROM skills LIMIT 10")
            skills = cur.fetchall()
            cur.close()
            conn.close()
            
            if not skills:
                dispatcher.utter_message(text="I recommend learning JavaScript, React, and Node.js as they are highly in demand!")
                return []
            
            message = "Based on current trends, you should consider learning:\n"
            for skill in skills:
                message += f"- {skill[0]}\n"
            
            dispatcher.utter_message(text=message)
        except Exception as e:
            dispatcher.utter_message(text="I recommend focusing on Cloud Engineering and AI-related skills.")
            print(f"Error: {e}")
            
        return []

class ActionRecommendJobsByProfile(Action):
    def name(self) -> Text:
        return "action_recommend_jobs_by_profile"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_id = tracker.get_slot("user_id")
        
        if not user_id:
            dispatcher.utter_message(text="Please log in so I can suggest jobs based on your profile!")
            return []
            
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Fetch user's skills
            cur.execute("""
                SELECT s.name 
                FROM skills s
                JOIN job_seeker_skills jss ON s.id = jss.skill_id
                JOIN job_seeker_profiles jsp ON jss.profile_id = jsp.id
                WHERE jsp.user_id = %s
            """, (user_id,))
            user_skills = [row[0] for row in cur.fetchall()]
            
            if not user_skills:
                dispatcher.utter_message(text="It looks like you haven't added any skills to your profile yet. Add some skills to get personalized recommendations!")
                cur.close()
                conn.close()
                return []
                
            # Find jobs matching those skills (simple overlap)
            # This is a basic implementation; real production would use AI service or complex SQL
            cur.execute("""
                SELECT DISTINCT j.title, j.location
                FROM jobs j
                JOIN job_skills js ON j.id = js.job_id
                JOIN skills s ON js.skill_id = s.id
                WHERE s.name = ANY(%s) AND j.is_active = true
                LIMIT 3
            """, (user_skills,))
            recommended_jobs = cur.fetchall()
            
            cur.close()
            conn.close()
            
            if not recommended_jobs:
                dispatcher.utter_message(text="I couldn't find an exact match for your skills right now, but I'll keep an eye out for you!")
                return []
                
            message = "Based on your profile skills, I recommend these roles:\n"
            for job in recommended_jobs:
                message += f"- {job[0]} in {job[1]}\n"
                
            dispatcher.utter_message(text=message)
            
        except Exception as e:
            dispatcher.utter_message(text="I'm having trouble accessing your profile right now.")
            print(f"Error: {e}")
            
        return []
