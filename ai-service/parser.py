import fitz  # PyMuPDF
import docx
import spacy
from spacy.matcher import PhraseMatcher
import io

class ResumeParser:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            import os
            os.system("python -m spacy download en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
        
        self.matcher = PhraseMatcher(self.nlp.vocab)
        self.skills = [
            "Python", "Java", "JavaScript", "C++", "React", "Node.js", "Express",
            "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Azure",
            "GCP", "Machine Learning", "Deep Learning", "HTML", "CSS", "SQL",
            "Tailwind", "Git", "REST API", "GraphQL", "FastAPI", "Flask",
            "Django", "TypeScript", "Redux", "Svelte", "Vue", "Next.js"
        ]
        patterns = [self.nlp.make_doc(text) for text in self.skills]
        self.matcher.add("SKILLS", patterns)

    def extract_text_from_pdf(self, file_content):
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def extract_text_from_docx(self, file_content):
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    def parse(self, file_content, filename):
        ext = filename.split(".")[-1].lower()
        if ext == "pdf":
            text = self.extract_text_from_pdf(file_content)
        elif ext == "docx":
            text = self.extract_text_from_docx(file_content)
        else:
            raise ValueError("Unsupported file format")

        doc = self.nlp(text)
        matches = self.matcher(doc)
        
        extracted_skills = set()
        for match_id, start, end in matches:
            span = doc[start:end]
            extracted_skills.add(span.text)

        # Basic logic for education/experience (could be improved with NER)
        entities = {"ORG": [], "GPE": [], "DATE": []}
        for ent in doc.ents:
            if ent.label_ in entities:
                entities[ent.label_].append(ent.text)

        return {
            "text": text,
            "skills": list(extracted_skills),
            "entities": entities
        }

parser = ResumeParser()
