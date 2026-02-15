# StockFlow 📦

**StockFlow** is a modern, full-stack inventory management system designed for seamless tracking of assets across dynamic folders and products. Built with **React Native (Expo)** for cross-platform mobile access and **Python Flask** for a robust backend, it features real-time analytics, secure role-based authentication, and cloud synchronization.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ✨ Features

- **📂 Dynamic Schema**: Create custom folders and define custom fields (Text, Number, Currency) specific to each folder type.
- **📊 Analytics Dashboard**: Visualize inventory value and quantities with interactive charts powered by `react-native-chart-kit`.
- **🔐 secure Authentication**: 
  - **Admin Mode**: Full CRUD access secured with JWT tokens and Bcrypt password hashing.
  - **Guest Mode**: Read-only access for team members.
- **☁️ Cloud Sync**: 
  - Backend hosted on **Render** (Python Flask).
  - Database managed by **TiDB Serverless** (MySQL).
- **📱 Cross-Platform**: Optimized for both Android and iOS devices.

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native (Expo SDK 54)
- **Navigation**: Expo Router (File-based routing)
- **Styling**: StyleSheet API (Clean, component-scoped styles)
- **HTTP Client**: Axios (with Interceptors for auth)
- **Charts**: `react-native-chart-kit` & `react-native-svg`

### Backend (API)
- **Server**: Python Flask
- **WSGI Server**: Gunicorn (Production ready)
- **Database**: MySQL 8.0 (TiDB Cloud)
- **Authentication**: `bcrypt` for hashing, `secrets` for token generation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone the Repository
```bash
git clone https://github.com/vedant27-lab/StockFlow.git
cd StockFlow
```

### 2. Backend Setup
Set up the Python Flask server.

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
# Create a .env file in the root directory with:
# MYSQL_HOST=...
# MYSQL_USER=...
# MYSQL_PASSWORD=...
# MYSQL_DB=stockflow
# MYSQL_PORT=4000

# Initialize Database
python scripts/initialize_db.py

# Run Server
python server.py
```

### 3. Frontend Setup
Run the mobile application.

```bash
# Install NPM packages
npm install

# Start Expo
npx expo start
```
Scan the QR code with **Expo Go** on your Android/iOS device.

## 📂 Project Structure

```
stockflow/
├── app/                  # Expo Router screens (pages)
├── components/           # Reusable UI components
├── services/             # API integration (Axios)
├── scripts/              # Database maintenance scripts
├── server.py             # Flask API entry point
├── schema.sql            # Database schema definition
├── requirements.txt      # Python dependencies
└── package.json          # Node dependencies
```

## 🔒 Authentication

The system is pre-configured with a default admin account.
- **Username**: `admin`
- **Default Password**: `admin123` (Change this upon first deployment!)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ by Vedant.*
