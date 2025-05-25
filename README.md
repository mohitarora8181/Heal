# H.E.A.L. – Health Enabled Anywhere & Live  
**Version:** 1.0  
**Team:** Liv2Code – MSIT  

---

## 🩺 Overview

**H.E.A.L. (Health Enabled Anywhere & Live)** is a real-time telehealth platform designed to bridge the gap between healthcare providers and patients through virtual consultations. It replicates the in-clinic experience remotely, providing:

- Video consultations
- Real-time transcription
- Appointment booking
- AI chatbot support
- Online payments & history
- Medical records management 
- Prescription records management 

---

## 🎥 Demo & UI Prototype

- **Figma UI Flow:** https://www.figma.com/design/7zbAJUWn47fjBOnql5KpvZ/HealFigma?node-id=0-1&t=999p6fqrwA18vEsx-1
- **Demo Video:** _Coming Soon_
- **Deployed Frontend :** https://heal-frontend.vercel.app/

---

## ✨ Features

- 🔐 Secure video/audio consultations (ZegoCloud)
- 🧠 Real-time voice transcription (DeepGram)
- 🤖 AI chatbot assistant (Gemini 2.0 Flash)
- 📝 Patient profile & medical history
- 💬 Real-time chat (Socket.IO)
- 💳 Secure payments (Square APIs)
- 📋 Session summaries
- 📑 Prescription management
- ✅ HIPAA & GDPR compliance

---

## 👥 User Roles

### Patients
- Register and log in
- Access doctors profile & Book consultations
- Join video calls with doctors
- Access past records and transcripts
- Chat and make secure payments
- Message with AI Assistant for personal queires ( Patient medical records had been added in System prompt )

### Doctors
- Authenticate and manage availability
- Conduct live consultations
- Access patient profile , history & prescriptions
- View real-time transcripts


---

## 🧰 Tech Stack

| Layer        | Technologies Used                           |
|--------------|----------------------------------------------|
| Frontend     | React, Next.js, TailwindCSS                  |
| Backend      | Node.js, Express                             |
| Database     | MongoDB, PostgreSQL                          |
| Realtime     | ZegoCloud, Socket.IO                         |
| AI Services  | Gemini AI, DeepGram                          |
| Payments     | Square APIs                                  |
| Auth         | OAuth, JWT                                   |
| Hosting      | Vercel                                       |

---

## 🔐 Security & Compliance

- Role-based access control
- JWT-based authentication
- Data encryption at rest & in transit ( Can be managed by Crypto.js )
- HIPAA & GDPR compliant

---

## ⚙️ Installation (Developer Setup)

```bash
# Clone the repository
git clone https://github.com/yourusername/HEAL-Telehealth.git
cd HEAL-Telehealth

# Install dependencies
npm install

# Add required environment variables
touch .env
# (Add API keys for DeepGram, Gemini, Zego, Square, etc.)

# Run the development server
npm run dev
