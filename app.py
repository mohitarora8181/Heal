# This is a simple Flask application that serves as a starting point for the chatbot.
from flask import Flask, jsonify, request
import json
import os
from flask_cors import CORS
from model import generate
from vector_store import VectorStore


app = Flask(__name__)
CORS(app, origins = ["*"])

#building vector store for sampleData.json
vector_store = VectorStore()
#vector_store.build_index("sampleData.json")

@app.route('/')
def home():
    return "Chatbot for HEAL is running"

@app.route('/data')
def get_data():
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'sampleData.json')
    with open(file_path, 'r') as file:
        data = json.load(file)
        
    return jsonify(data)
    
@app.route('/register/doctor', methods=['POST'])
def register_doctor():
    file_path = os.path.join(os.path.dirname(__file__),'data', 'sampleData.json')
    with open(file_path, 'r') as file:
        data = json.load(file)

    new_doctor = request.get_json()
    
    if any(d['id'] == new_doctor['id'] for d in data['doctors']):
        return jsonify({"message": "Doctor ID already exists."}), 400

    data['doctors'].append(new_doctor)
    
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
        
    vector_store.add_entry(json.dumps(new_doctor))
    return jsonify({"message": "Successfully registered!", "doctor": new_doctor}), 201
    
@app.route('/register/patient', methods=['POST'])
def register_patient():
    new_patient = request.get_json()
    file_path = os.path.join(os.path.dirname(__file__),'data', 'sampleData.json')
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    # Check for duplicate ID
    if any(p['id'] == new_patient['id'] for p in data['patients']):
        return jsonify({"message": "Patient ID already exists."}), 400

    data['patients'].append(new_patient)
    
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
        
    vector_store.add_entry(json.dumps(new_patient))
    
    return jsonify({
        "patient": new_patient,
        "message": "Successfully registered!"
    }), 201

@app.route("/message", methods=["POST"])
def message():
    data = request.get_json()
    user_message = data.get("message")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
       # relevent_entries = vector_store.search(user_message)
        #print(f"Relevant entries found: {relevent_entries}")
        response_text = generate(user_message) #, context=relevent_entries)
        is_exit = user_message.strip().lower() == "quit"
        return jsonify({
            "response": response_text,
            "end_conversation": is_exit
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    #with app.test_request_context():
    #    print("Available routes:")
    #    print(app.url_map)
    app.run(debug=True, host='127.0.0.1', port=5000)
