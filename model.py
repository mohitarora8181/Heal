# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import json
from vector_store import VectorStore

vector_store = VectorStore()
load_dotenv()

def generate(user_input: str):#, context: list[str] = None):
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    chat_history = []
        
    model = "gemini-2.0-flash"
    print("HEAL: Hello! I'm HEAL, your medical assistant chatbot. How can I help you today?")
    print("\nType 'exit' to quit the chat.")
    while True:
           
        # Check for exit command
        user_input = input("\nYou: ")
        if user_input.lower() == "exit":
            print("Exiting the chat. Goodbye!")
            break
        
        # If input is valid, proceed with generating content
        
    #user_input = input("You: ")
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_input)]
            )
        )
        relevent_entries = vector_store.search(user_input)
        if relevent_entries:
            for entry in relevent_entries:
                chat_history.append(
                    types.Content(
                        role = "user",
                        parts=[types.Part.from_text(text=entry)]
                    )
                )
        
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            system_instruction=[
                types.Part.from_text(text="""\"You are HEAL, a helpful and knowledgeable medical assistant chatbot designed to support doctors and patients. 

    - Always respond clearly and concisely.
    - If the user is a patient, answer using layman-friendly language.
    - If the user is a doctor, use clinical language and include evidence-based medical references when needed.
    - You can retrieve previous doctor-patient conversations, medical records, medications, and appointment details if asked.
    - Do not provide a diagnosis. Always advise consulting a certified medical professional.
    - Respect patient privacy and never reveal personal details unless explicitly asked by the authorized user.
    - You are not allowed to speculate on diseases or treatments without sufficient information.
    - If you're unsure about something, say 'I'm not sure, please consult a healthcare provider.'

    - Always be empathetic and supportive.\""""),
            ],
        )

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=chat_history,
            config=generate_content_config,
        ):
            print(chunk.text, end="")


if __name__ == "__main__":
    generate()

