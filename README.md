# 🏠 Smart Home Automation System

An end-to-end smart home prototype integrating IoT hardware with AI-powered facial 
recognition for secure keyless entry, intelligent room automation, and real-time 
environmental monitoring — with a full-stack web dashboard for centralised control.

---

## 🎯 What It Does

| Feature | How It Works |
|---|---|
| 🔐 Facial Recognition Entry | Custom-trained model identifies registered users and triggers gate + buzzer |
| 💡 Smart Room Automation | PIR motion sensor auto-controls fan based on room occupancy |
| 🌡️ Environment Monitoring | DHT sensors log real-time temperature & humidity to backend + web dashboard |
| 🌐 Web Control Panel | Full-stack dashboard gives centralised, overridable control over all devices |
| 📋 Access Logging | SQLite database logs all authentication events and registered face IDs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python, TypeScript |
| AI/ML | Facial Recognition, Computer Vision |
| Frontend | React, Tailwind CSS, Vite |
| Backend | Python (Flask/app.py) |
| Database | SQLite (faces.db) |
| Hardware | IoT sensors, PIR sensor, DHT sensor |

---

## ⚙️ How to Run

**Backend:**
```bash
git clone https://github.com/gobwi/Smart-Home-System
cd Smart-Home-System
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## 💡 What I Learned

This project taught me how to bridge the gap between software and hardware — 
specifically how to stream real-time sensor data into a web interface, train a 
facial recognition model on a custom dataset, and manage hardware state through 
a web API. The biggest challenge was reducing latency between sensor events and 
dashboard updates.

---

## 👥 Team

Built collaboratively as part of B.Tech CSE coursework at Christ University, Bangalore.

## 👤 My Contribution — Swarnanka Biswas

- Designed the system architecture and data flow between hardware and web layers  
- Built the facial recognition pipeline and face registration/authentication system  
- Integrated sensor data into the backend and web dashboard  

---

## 📬 Contact

**Swarnanka Biswas** · B.Tech CSE, Christ University  
[LinkedIn](https://linkedin.com/in/swarnanka-biswas-5613532a1) · swarnanka.biswas@btech.christuniversity.in
