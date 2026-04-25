🌱 AgroSense Frontend

AgroSense is a smart farming web application that helps farmers monitor real-time farm conditions, receive AI-based recommendations, and manage crops efficiently. This repository contains the frontend of the AgroSense system.

🚀 Features

    🔐 Farmer Authentication (Login & Register)
    📊 Real-time Dashboard (Temperature, Humidity, Soil Moisture)
    🚰 Water Requirement Calculation
    🌦 7-Day Weather Forecast
    ⚠️ Alerts System (Admin + AI-based)
    💡 AI Recommendations for Irrigation
    🌾 Crop Monitoring (Add, Edit, Delete crops)
    👨‍🌾 Farmer Profile Page
    🧑‍💼 Admin Dashboard (View all farmers & data)
    📈 Live Charts using Chart.js

🛠️ Tech Stack

    HTML5
    CSS3
    JavaScript (Vanilla JS)
    Chart.js (for data visualization)
    
📂 Project Structure

          frontend/
      │── login.html
      │── register.html
      │── dashboard.html
      │── profile.html
      │── admin.html
      │── styles.css (if separate)
      │── script.js (if separate)
      
Frontend uses APIs like:

    /api/auth/login
    /api/auth/register
    /api/data/:userId
    /api/data/all
    /api/crops
    /api/alerts
    /api/weather

📸 Screens

    Login Page
    Farmer Dashboard
    Crop Monitoring
    Weather Forecast
    Admin Panel
    
💡 How It Works

    Sensor data is fetched from backend APIs
    Dashboard updates in real-time
    AI logic generates recommendations
    Weather API provides forecast
    MongoDB stores user & crop data
    🔒 Validation
    Minimum password length enforced
    Input validation on forms
    Error handling for API calls
    🚧 Future Improvements
    Mobile responsive UI
    Voice assistant integration
    Advanced AI predictions
    Multi-language support
