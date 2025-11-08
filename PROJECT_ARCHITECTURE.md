# AI Menstrual Wellness Assistant - Complete Project Architecture

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Component Interactions](#component-interactions)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Machine Learning Models](#machine-learning-models)

---

## 🎯 Project Overview

**AI Menstrual Wellness Assistant** is a full-stack web application that helps users track menstrual cycles and provides AI-powered health insights using machine learning models.

### Key Features
- 📅 **Cycle Tracking**: Log menstrual cycles with dates, intensity, and symptoms
- 🤖 **AI Analysis**: ML models predict health risks and wellness metrics
- 💬 **AI Chat**: Conversational AI for menstrual health education
- 📊 **Health Dashboard**: Visualize cycle patterns and health metrics
- 🔐 **Secure Authentication**: Firebase Auth with email/password
- ☁️ **Cloud Storage**: Firestore for real-time data synchronization

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI Framework | 19.1.1 |
| Vite | Build Tool | 7.1.7 |
| React Router | Client-side Routing | 6.23.1 |
| Firebase SDK | Auth & Firestore | 11.0.2 |
| Chart.js | Data Visualization | 4.4.0 |
| Framer Motion | Animations | 11.11.7 |
| Lucide React | Icons | 0.552.0 |
| html2canvas | PDF Export | 1.4.1 |
| jsPDF | PDF Generation | 2.5.1 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Python | Language | 3.11 |
| Flask | Web Framework | 3.0.0 |
| Flask-CORS | CORS Handling | 4.0.0 |
| Pandas | Data Processing | 2.2.0 |
| NumPy | Numerical Computing | 1.26.4 |
| Scikit-learn | ML Preprocessing | 1.4.0 |
| XGBoost | Gradient Boosting | 2.0.3 |
| CatBoost | Categorical Boosting | 1.2.2 |

### Cloud & Database
| Technology | Purpose |
|-----------|---------|
| Firebase | Auth, Firestore, Storage, Hosting |
| Google Cloud Run | Backend Deployment |
| Firestore | Real-time NoSQL Database |
| Groq API | LLM for Chat (llama-3.3-70b) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                │
│  Pages: Home, Login, Signup, User, Analysis, AIChat    │
│  Services: Firebase, Firestore, AI Chat                │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────┐        ┌──────────┐    ┌──────────┐
    │Firebase│        │Firestore │    │ Groq API │
    │  Auth  │        │ Database │    │(LLM Chat)│
    └────────┘        └──────────┘    └──────────┘
        │
        ▼
    ┌──────────────────────────┐
    │  FLASK BACKEND (Python)  │
    │  API Endpoints           │
    └──────────────────────────┘
        │
    ┌───┴───┬──────────┬──────────┐
    │       │          │          │
    ▼       ▼          ▼          ▼
  ┌────┐ ┌────────┐ ┌──────┐ ┌──────────┐
  │Risk│ │Cluster │ │ PRWI │ │ Feature  │
  │    │ │Deviation│ │Model │ │Validation│
  └────┘ └────────┘ └──────┘ └──────────┘
```

---

## 🔄 Component Interactions

### 1. Authentication Flow
```
User → Login/Signup Page
  ↓
Firebase Auth (signInWithEmailAndPassword)
  ↓
Auth State Listener
  ↓
Load User Profile from Firestore
  ↓
Redirect to /home
```

**Files**: `Login.jsx`, `Signup.jsx`, `firebase.js`, `firestore.js`

### 2. Cycle Tracking Flow
```
User → AnalysisForm Component
  ↓
Select Dates + Intensity + Symptoms
  ↓
Save to Firestore (addCycle)
  ↓
Update Local State
  ↓
Display in Calendar View
```

**Files**: `AnalysisForm.jsx`, `firestore.js`, `Analysis.jsx`

### 3. Metrics Calculation Flow
```
User Clicks "Analyze"
  ↓
Collect Cycle Data + User Profile
  ↓
POST /api/calculate-metrics
  ↓
Backend Calculates 12 Metrics
  ↓
Save to Firestore
  ↓
Display in Dashboard
```

**Files**: `Analysis.jsx`, `app.py`

### 4. Model Prediction Flow
```
Calculated Metrics + User Profile
  ↓
Prepare 17 Features
  ↓
POST /api/predict
  ↓
Run 3 ML Models
  ↓
Combine Results
  ↓
Save to Firestore
  ↓
Display Results
```

**Files**: `Analysis.jsx`, `app.py`

### 5. AI Chat Flow
```
User Types Message
  ↓
AIChat Component
  ↓
Call aiService.sendMessageToAI()
  ↓
Send to Groq API
  ↓
Display Response
  ↓
Save Conversation History
```

**Files**: `AIChat.jsx`, `aiService.js`

---

## 📊 Data Flow

### Complete User Journey

```
1. SIGNUP/LOGIN
   ├─ User enters email & password
   ├─ Firebase Auth validates
   ├─ User document created in Firestore
   └─ Redirect to /home

2. USER PROFILE SETUP
   ├─ User enters personal info (age, BMI, etc.)
   ├─ Saved to Firestore: users/{uid}
   └─ Profile data cached in React state

3. CYCLE TRACKING
   ├─ User adds cycle via AnalysisForm
   ├─ Data saved to Firestore: users/{uid}/cycles/{cycleId}
   ├─ Cycles sorted by monthKey (YYYY-MM)
   └─ Display in calendar view

4. ANALYSIS CALCULATION
   ├─ User clicks "Analyze"
   ├─ Collect all cycles + user profile
   ├─ POST to backend /api/calculate-metrics
   ├─ Backend calculates 12 metrics
   ├─ Metrics saved to Firestore
   └─ Display metrics in dashboard

5. MODEL PREDICTIONS
   ├─ Prepare 17 features from metrics + profile
   ├─ POST to backend /api/predict
   ├─ Backend validates features
   ├─ Run 3 ML models
   ├─ Combine results
   ├─ Save to Firestore
   └─ Display predictions in UI

6. REPORT GENERATION
   ├─ User clicks "Generate Report"
   ├─ POST to backend /api/generate-report
   ├─ Backend creates comprehensive report
   ├─ Return as JSON
   └─ Export as PDF (html2canvas + jsPDF)

7. AI CHAT
   ├─ User asks question
   ├─ Send to Groq API via aiService
   ├─ Groq returns response
   ├─ Display in chat UI
   └─ Save conversation history locally
```

---

## 💾 Database Schema

### Firestore Structure

```
firestore/
├── users/{uid}/
│   ├── email: string
│   ├── age: number
│   ├── bmi: number
│   ├── numberPregnancies: number
│   ├── numberAbortions: number
│   ├── ageAtFirstMenstruation: number
│   ├── currentlyBreastfeeding: boolean
│   ├── profile: object
│   ├── analysisMetrics: object
│   │   ├── avgCycleLength: number
│   │   ├── irregularCyclesPercent: number
│   │   ├── stdCycleLength: number
│   │   ├── avgLutealPhase: number
│   │   ├── shortLutealPercent: number
│   │   ├── avgBleedingIntensity: number
│   │   ├── unusualBleedingPercent: number
│   │   ├── avgMensesLength: number
│   │   ├── avgOvulationDay: number
│   │   ├── ovulationVariability: number
│   │   ├── totalCycles: number
│   │   └── lastCalculated: timestamp
│   ├── modelPredictions: object
│   │   ├── risk_assessment: object
│   │   ├── clusterdev: object
│   │   └── prwi_score: object
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── cycles/{cycleId}/
│   │   ├── startDate: ISO string
│   │   ├── endDate: ISO string
│   │   ├── intensity: 1-5
│   │   ├── monthKey: "YYYY-MM"
│   │   ├── symptoms: object
│   │   │   ├── cramps: 0-5
│   │   │   ├── headache: boolean
│   │   │   ├── fatigue: 0-5
│   │   │   ├── mood: 0-3
│   │   │   ├── bloating: boolean
│   │   │   ├── nausea: boolean
│   │   │   ├── backPain: 0-5
│   │   │   ├── acne: boolean
│   │   │   └── cravings: 0-3
│   │   ├── createdAt: timestamp
│   │   └── ovulationDay: number (optional)
│   │
│   └── analyses/{analysisId}/
│       ├── inputFeatures: object
│       ├── cyclesSnapshot: array
│       ├── modelsRun: array
│       ├── riskCategory: string
│       ├── riskProbabilities: object
│       ├── prwiScore: number
│       ├── clusterLabel: number
│       ├── deviationScore: number
│       ├── recommendations: array
│       ├── confidence: number
│       └── createdAt: timestamp
```

---

## 🔌 API Endpoints

### 1. Health Check
```
GET /api/health
Response: { status: "healthy", models: {...} }
```

### 2. Calculate Metrics
```
POST /api/calculate-metrics
Input: { user_data: {...}, cycles: [...] }
Output: { success: true, calculated_metrics: {...} }
```

### 3. Predict (ML Models)
```
POST /api/predict
Input: { features: {...}, models: ["all"] }
Output: {
  success: true,
  results: {
    risk_assessment: {...},
    clusterdev: {...},
    prwi_score: {...}
  }
}
```

### 4. Predict Next Period
```
POST /api/predict-next-period
Input: { cycles: [...] }
Output: {
  success: true,
  prediction: {
    predictedStartDate: "...",
    predictedEndDate: "...",
    confidence: 0.85
  }
}
```

### 5. Generate Report
```
POST /api/generate-report
Input: { features: {...}, cycles: [...], userInfo: {...} }
Output: { success: true, report: {...} }
```

---

## 🤖 Machine Learning Models

### Model 1: Risk Assessment
- **Purpose**: Predict menstrual health risk level
- **Input**: 17 features (cycle metrics + user data)
- **Output**: Risk level (Low/Medium/High) + probabilities
- **Algorithm**: XGBoost Classifier
- **File**: `/models/risk_model (4).pkl`

### Model 2: Cluster Deviation
- **Purpose**: Identify unusual patterns in cycle data
- **Input**: 17 features
- **Output**: Cluster assignment (0/1/2) + deviation score (0-100)
- **Algorithm**: RandomForest + Gaussian Mixture Model
- **File**: `/models/cluster_model (4).pkl`

### Model 3: PRWI Score
- **Purpose**: Comprehensive wellness score (ensemble meta-model)
- **Input**: 11 features (risk probs + cluster data + derived metrics)
- **Output**: PRWI score (0-100) + interpretation
- **Algorithm**: RandomForest Regressor
- **File**: `/models/prwi_model (4).pkl`

### Feature Preparation Pipeline
```
Raw Cycle Data
  ↓
Calculate Metrics (12)
  ↓
Combine with User Profile (5)
  ↓
Total Features (17)
  ↓
Validate & Clean
  ↓
Convert to PascalCase
  ↓
Pass to Models
```

### 17 Required Features

| # | Feature | Type | Range | Source |
|---|---------|------|-------|--------|
| 1 | AvgCycleLength | float | 15-50 | Calculated |
| 2 | IrregularCyclesPercent | float | 0-100 | Calculated |
| 3 | StdCycleLength | float | 0-20 | Calculated |
| 4 | AvgLutealPhase | float | 8-20 | Calculated |
| 5 | ShortLutealPercent | float | 0-100 | Calculated |
| 6 | AvgBleedingIntensity | float | 0-5 | Calculated |
| 7 | UnusualBleedingPercent | float | 0-100 | Calculated |
| 8 | AvgMensesLength | float | 2-10 | Calculated |
| 9 | AvgOvulationDay | float | 8-20 | Calculated |
| 10 | OvulationVariability | float | 0-10 | Calculated |
| 11 | TotalCycles | int | 1-1000 | Calculated |
| 12 | Age | int | 10-80 | User Profile |
| 13 | BMI | float | 10-60 | User Profile |
| 14 | Numberpreg | int | 0-20 | User Profile |
| 15 | Abortions | int | 0-20 | User Profile |
| 16 | AgeM | int | 8-20 | User Profile |
| 17 | Breastfeeding | int | 0/1 | User Profile |

---

## 📁 Frontend Structure

```
frontend/src/
├── pages/
│   ├── Home.jsx           # Dashboard
│   ├── Login.jsx          # Login form
│   ├── Signup.jsx         # Registration
│   ├── User.jsx           # User profile
│   ├── Analysis.jsx       # Main analysis page
│   ├── Calendar.jsx       # Calendar view
│   └── AIChat.jsx         # AI chat interface
├── components/
│   ├── Navbar.jsx         # Navigation
│   └── AnalysisForm.jsx   # Cycle input form
├── services/
│   ├── firebase.js        # Firebase init
│   ├── firestore.js       # Firestore CRUD
│   └── aiService.js       # Groq API calls
├── styles/
│   ├── Auth.css
│   ├── Home.css
│   └── [other styles]
├── App.jsx                # Main app
└── main.jsx               # Entry point
```

---

## 🔧 Backend Structure

```
backend/
├── app.py                 # Main Flask app
├── requirements.txt       # Dependencies
├── Dockerfile             # Docker config
└── models/
    ├── risk_model (4).pkl
    ├── cluster_model (4).pkl
    └── prwi_model (4).pkl
```

### Key Backend Functions

- `calculate_metrics_from_data()` - Calculate 12 metrics
- `validate_features_for_models()` - Validate 17 features
- `predict_risk()` - Run risk model
- `predict_cluster_deviation()` - Run cluster model
- `predict_prwi()` - Run PRWI model
- `generate_detailed_report()` - Create comprehensive report

---

## 🔐 Security & Deployment

### Authentication
- Firebase Auth (Email/Password)
- Firestore Security Rules (user-scoped access)
- CORS configured for frontend domain

### Deployment
- **Frontend**: Firebase Hosting (`https://ai-menstrual-wellness.web.app`)
- **Backend**: Google Cloud Run (serverless)
- **Database**: Firestore (managed)

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/pages/Analysis.jsx` | Main analysis page, metrics calculation, model predictions |
| `frontend/src/components/AnalysisForm.jsx` | Cycle input form, calendar UI |
| `frontend/src/services/firestore.js` | Firestore CRUD operations |
| `frontend/src/services/aiService.js` | Groq API integration |
| `backend/app.py` | Flask API, ML model predictions |
| `frontend/.env.example` | Environment variables template |

---

**Last Updated**: 2024
**Project**: AI Menstrual Wellness Assistant
