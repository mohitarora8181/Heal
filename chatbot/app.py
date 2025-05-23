# This is a simple Flask application that serves as a starting point for the chatbot.
from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

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
        
    return jsonify({
        "patient": new_patient,
        "message": "Successfully registered!"
    }), 201

if __name__ == '__main__':
    #with app.test_request_context():
    #    print("Available routes:")
    #    print(app.url_map)
    app.run(debug=True)
