import json
import os
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np

class VectorStore:
    def __init__(self, model_name="all-MiniLM-L6-v2", index_path="data/sampleData.index"):
        self.model = SentenceTransformer(model_name)
        self.index_path = index_path
        self.texts = []

        if os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
            self._load_texts()
        else:
            self.index = faiss.IndexFlatL2(self.model.get_sentence_embedding_dimension())

    def _load_texts(self):
        with open("data/vector_texts.json", "r") as f:
            self.texts = json.load(f)

    def _save_texts(self):
        with open("data/vector_texts.json", "w") as f:
            json.dump(self.texts, f)

    def build_index(self, json_file_path):
        with open(json_file_path, "r") as f:
            data = json.load(f)

        documents = []
        for section in ["doctors", "patients"]:
            for entry in data.get(section, []):
                documents.append(json.dumps(entry))  # Or customize to relevant fields
        
        self.texts = documents
        embeddings = self.model.encode(documents, convert_to_numpy=True)
        self.index.add(embeddings)
        self._save_texts()
        faiss.write_index(self.index, self.index_path)

    def add_entry(self, text_entry: str):
        embedding = self.model.encode([text_entry], convert_to_numpy=True)
        self.index.add(embedding)
        self.texts.append(text_entry)
        self._save_texts()
        faiss.write_index(self.index, self.index_path)

    def search(self, query, top_k=3):
        query_embedding = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.search(query_embedding, top_k)
        return [self.texts[i] for i in indices[0]]
