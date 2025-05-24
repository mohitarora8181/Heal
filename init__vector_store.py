from vector_store import VectorStore

# Create the vector store instance
vector_store = VectorStore()

# Build index from the existing JSON file
vector_store.build_index("data\sampleData.json")
