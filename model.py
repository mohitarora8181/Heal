import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def generate(user_input: str, context: list = None, user_name: str = "", medical_records: list = None):
    """
    Generate a response using Google's Gemini model based on user input and context.
    
    Args:
        user_input (str): The user's message
        context (list, optional): Relevant context entries from the vector store
        user_name (str, optional): The name of the user for personalization
        medical_records (list, optional): List of medical records with title and description
        
    Returns:
        str: The generated response text
    """
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    # Initialize chat history with user's input
    chat_history = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_input)]
        )
    ]
    
    # Add context if available
    if context:
        for entry in context:
            chat_history.append(
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=f"Relevant information: {entry}")]
                )
            )
    
    # Build system prompt with user information
    system_prompt = """You are HEAL, a helpful and knowledgeable medical assistant chatbot designed to support doctors and patients.

- Always respond clearly and concisely.
- If the user is a patient, answer using layman-friendly language.
- If the user is a doctor, use clinical language and include evidence-based medical references when needed.
- You can retrieve previous doctor-patient conversations, medical records, medications, and appointment details if asked.
- Do not provide a diagnosis. Always advise consulting a certified medical professional.
- Respect patient privacy and never reveal personal details unless explicitly asked by the authorized user.
- You are not allowed to speculate on diseases or treatments without sufficient information.
- If you're unsure about something, say 'I'm not sure, please consult a healthcare provider.'
- Always be empathetic and supportive.
"""
    
    # Add user name if provided
    if user_name:
        system_prompt += f"\nYou are currently speaking with {user_name}. Address them by name when appropriate."
    
    # Add medical records if provided
    if medical_records:
        system_prompt += "\n\nRelevant medical records:"
        for record in medical_records:
            title = record.get("title", "Untitled")
            description = record.get("description", "No description")
            system_prompt += f"\n- {title}: {description}"
    
    # Configure system instructions
    generate_content_config = types.GenerateContentConfig(
        system_instruction=[
            types.Part.from_text(text=system_prompt),
        ],
    )

    # Generate the response (non-streaming)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=chat_history,
        config=generate_content_config,
    )
    
    return response.text


if __name__ == "__main__":
    # This block is only for testing the model directly
    print("HEAL: Hello! I'm HEAL, your medical assistant chatbot. How can I help you today?")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == "exit":
            print("Exiting the chat. Goodbye!")
            break
        
        response_text = generate(user_input)
        print(f"\nHEAL: {response_text}")