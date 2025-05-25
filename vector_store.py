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
        """
        Search for similar entries to the query in the vector store.
        
        Args:
            query: The search query
            top_k: Number of results to return
            
        Returns:
            List of relevant text entries
        """
        # Make sure we don't try to retrieve more entries than we have
        actual_k = min(top_k, len(self.texts)) if self.texts else 0
        
        # If we have no texts or k is 0, return empty list
        if actual_k == 0:
            print("Warning: Vector store is empty or top_k is 0")
            return []
        
        try:
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            distances, indices = self.index.search(query_embedding, actual_k)
            
            # Filter invalid indices and return corresponding texts
            results = []
            for idx in indices[0]:
                if 0 <= idx < len(self.texts):  # Check if index is valid
                    results.append(self.texts[idx])
                else:
                    print(f"Warning: Index {idx} out of range (0-{len(self.texts)-1})")
            
            return results
        except Exception as e:
            print(f"Error in vector search: {str(e)}")
            return []  # Return empty list on error

    def rebuild_index(self):
        """
        Rebuilds the FAISS index from the existing texts.
        Use this if the index and texts get out of sync.
        """
        # Clear the existing index
        self.index = faiss.IndexFlatL2(self.model.get_sentence_embedding_dimension())
        
        if not self.texts:
            print("No texts available for indexing")
            return
            
        # Re-encode and add all texts
        embeddings = self.model.encode(self.texts, convert_to_numpy=True)
        self.index.add(embeddings)
        
        # Save the updated index
        faiss.write_index(self.index, self.index_path)
        self._save_texts()
        
        print(f"Index rebuilt with {len(self.texts)} entries")
