# How the AI Menstrual Wellness Assistant Works - Complete Guide

## 🎯 Quick Overview

The **AI Menstrual Wellness Assistant** is a full-stack application that:
1. **Tracks** menstrual cycles with dates, intensity, and symptoms
2. **Calculates** 12 health metrics from cycle data
3. **Predicts** health risks using 3 machine learning models
4. **Educates** users through an AI chatbot
5. **Generates** comprehensive health reports

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React App (Vite)                               │   │
│  │  - Login/Signup                                 │   │
│  │  - Cycle Tracking                               │   │
│  │  - Analysis Dashboard                           │   │
│  │  - AI Chat                                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │Firebase│    │Firestore │    │ Groq API │
    │  Auth  │    │ Database │    │(AI Chat) │
    └────────┘    └──────────┘    └──────────┘
        │
        ▼
    ┌──────────────────────────┐
    │  Flask Backend (Python)  │
    │  - ML Model Predictions  │
    │  - Metrics Calculation   │
    │  - Report Generation     │
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

## 👤 User Journey

### Step 1: Authentication
```
User visits app
  ↓
Sees Login/Signup page
  ↓
Enters email & password
  ↓
Firebase validates
  ↓
User document created in Firestore
  ↓
Redirected to Dashboard
```

**Technologies**: Firebase Auth, Firestore

---

### Step 2: Profile Setup
```
User fills personal information:
  - Age
  - BMI (Body Mass Index)
  - Number of pregnancies
  - Number of abortions
  - Age at first menstruation
  - Currently breastfeeding (yes/no)
  ↓
Data saved to Firestore
  ↓
Profile ready for analysis
```

**Technologies**: React Form, Firestore

---

### Step 3: Cycle Tracking
```
User opens Calendar
  ↓
Selects cycle start date
  ↓
Selects cycle end date
  ↓
Rates intensity (1-5)
  ↓
Adds symptoms:
  - Cramps (0-5)
  - Headache (yes/no)
  - Fatigue (0-5)
  - Mood (0-3)
  - Bloating (yes/no)
  - Nausea (yes/no)
  - Back pain (0-5)
  - Acne (yes/no)
  - Cravings (0-3)
  ↓
Saves cycle to Firestore
  ↓
Calendar displays cycle visually
```

**Technologies**: React Calendar UI, Firestore

---

### Step 4: Analysis & Predictions
```
User clicks "Analyze" button
  ↓
Frontend collects:
  - All cycles (at least 2 required)
  - User profile data
  ↓
Sends to Backend: POST /api/calculate-metrics
  ↓
Backend calculates 12 metrics:
  1. Average cycle length
  2. Irregularity percentage
  3. Standard deviation of cycle length
  4. Average luteal phase duration
  5. Short luteal phase percentage
  6. Average bleeding intensity
  7. Unusual bleeding percentage
  8. Average menstruation length
  9. Average ovulation day
  10. Ovulation variability
  11. Total cycles
  12. (derived from user profile)
  ↓
Metrics saved to Firestore
  ↓
Frontend sends: POST /api/predict
  ↓
Backend runs 3 ML models:
  
  Model 1: Risk Assessment
  ├─ Input: 17 features
  ├─ Output: Risk level (Low/Medium/High)
  └─ Algorithm: XGBoost
  
  Model 2: Cluster Deviation
  ├─ Input: 17 features
  ├─ Output: Cluster (0/1/2) + Deviation score
  └─ Algorithm: RandomForest + Gaussian Mixture
  
  Model 3: PRWI Score
  ├─ Input: 11 features (from Models 1 & 2)
  ├─ Output: Wellness score (0-100)
  └─ Algorithm: RandomForest Ensemble
  ↓
Results saved to Firestore
  ↓
Dashboard displays:
  - Metrics visualization
  - Risk assessment results
  - Wellness score
  - Recommendations
```

**Technologies**: Flask, Python, XGBoost, RandomForest, Firestore

---

### Step 5: AI Chat
```
User opens AI Chat
  ↓
Types health question
  ↓
Message sent to Groq API
  ↓
Groq processes with llama-3.3-70b model
  ↓
AI responds with health education
  ↓
Response displayed in chat
  ↓
Conversation history maintained
```

**Technologies**: Groq API, OpenAI SDK, LLM (llama-3.3-70b)

---

### Step 6: Report Generation
```
User clicks "Generate Report"
  ↓
Backend collects:
  - User profile
  - Cycle data
  - Calculated metrics
  - Model predictions
  ↓
Backend generates comprehensive report:
  - Summary
  - Metrics analysis
  - Risk assessment
  - Wellness recommendations
  ↓
Frontend receives report JSON
  ↓
Converts to PDF using html2canvas + jsPDF
  ↓
User downloads PDF
```

**Technologies**: Flask, html2canvas, jsPDF

---

## 🔄 Data Flow Details

### Feature Calculation Pipeline

```
Raw Cycle Data (dates, intensity)
  ↓
Calculate Metrics (12 total):
  ├─ Cycle lengths between consecutive periods
  ├─ Irregularity (% of cycles outside normal range)
  ├─ Standard deviation of cycle length
  ├─ Luteal phase duration (ovulation to next period)
  ├─ Bleeding intensity (average of all cycles)
  ├─ Menstruation length (period duration)
  ├─ Ovulation day (estimated from cycle length)
  └─ Variability measures
  ↓
Combine with User Profile (5 features):
  ├─ Age
  ├─ BMI
  ├─ Number of pregnancies
  ├─ Number of abortions
  └─ Age at first menstruation
  ↓
Total: 17 Features
  ↓
Validate Features:
  ├─ Check all 17 present
  ├─ Verify types (int vs float)
  ├─ Check ranges
  └─ Convert to PascalCase
  ↓
Pass to ML Models
```

---

### ML Model Pipeline

```
17 Features (cycle metrics + user data)
  ↓
┌─────────────────────────────────────┐
│  Model 1: Risk Assessment           │
│  Algorithm: XGBoost Classifier      │
│  Output: Risk level + probabilities │
└─────────────────────────────────────┘
  ├─ Risk Level: Low, Medium, or High
  ├─ P(Low): Probability of low risk
  ├─ P(Medium): Probability of medium risk
  └─ P(High): Probability of high risk
  ↓
┌─────────────────────────────────────┐
│  Model 2: Cluster Deviation         │
│  Algorithm: RandomForest + GMM      │
│  Output: Cluster + deviation score  │
└─────────────────────────────────────┘
  ├─ Cluster: 0, 1, or 2
  ├─ Deviation Score: 0-100
  └─ Interpretation: Text description
  ↓
┌─────────────────────────────────────┐
│  Model 3: PRWI Score (Meta-Model)   │
│  Algorithm: RandomForest Regressor  │
│  Input: Outputs from Models 1 & 2   │
│  Output: Wellness score             │
└─────────────────────────────────────┘
  ├─ PRWI Score: 0-100
  ├─ Interpretation: Text description
  └─ Recommendations: Health advice
  ↓
Combine Results
  ↓
Save to Firestore
  ↓
Display in Dashboard
```

---

## 💾 Database Structure

### Firestore Organization

```
users/
  └── {userId}/
      ├── email: "user@example.com"
      ├── age: 25
      ├── bmi: 22.5
      ├── numberPregnancies: 0
      ├── numberAbortions: 0
      ├── ageAtFirstMenstruation: 12
      ├── currentlyBreastfeeding: false
      ├── profile: { ... }
      ├── analysisMetrics: {
      │   ├── avgCycleLength: 28.5
      │   ├── irregularCyclesPercent: 10
      │   ├── ... (12 metrics total)
      │   └── lastCalculated: timestamp
      │ }
      ├── modelPredictions: {
      │   ├── risk_assessment: { ... }
      │   ├── clusterdev: { ... }
      │   └── prwi_score: { ... }
      │ }
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      │
      ├── cycles/
      │   └── {cycleId}/
      │       ├── startDate: "2024-01-01T00:00:00Z"
      │       ├── endDate: "2024-01-05T00:00:00Z"
      │       ├── intensity: 3
      │       ├── monthKey: "2024-01"
      │       ├── symptoms: {
      │       │   ├── cramps: 4
      │       │   ├── headache: true
      │       │   └── ... (9 symptoms)
      │       │ }
      │       └── createdAt: timestamp
      │
      └── analyses/
          └── {analysisId}/
              ├── inputFeatures: { ... }
              ├── cyclesSnapshot: [ ... ]
              ├── riskCategory: "Low"
              ├── riskProbabilities: { ... }
              ├── prwiScore: 72.5
              ├── clusterLabel: 1
              ├── deviationScore: 25.5
              ├── recommendations: [ ... ]
              └── createdAt: timestamp
```

---

## 🔌 API Endpoints

### Backend Flask API

#### 1. `/api/health` (GET)
**Purpose**: Check if backend is running and models are loaded
```
Response: { status: "healthy", models: {...} }
```

#### 2. `/api/calculate-metrics` (POST)
**Purpose**: Calculate 12 metrics from cycle data
```
Input: { user_data: {...}, cycles: [...] }
Output: { success: true, calculated_metrics: {...} }
```

#### 3. `/api/predict` (POST)
**Purpose**: Run ML models for predictions
```
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

#### 4. `/api/predict-next-period` (POST)
**Purpose**: Predict next menstrual period dates
```
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

#### 5. `/api/generate-report` (POST)
**Purpose**: Generate comprehensive health report
```
Input: { features: {...}, cycles: [...], userInfo: {...} }
Output: { success: true, report: {...} }
```

---

## 🛠️ Technologies Used

### Frontend
- **React 19.1.1** - UI framework
- **Vite 7.1.7** - Build tool
- **React Router 6.23.1** - Navigation
- **Firebase SDK 11.0.2** - Auth & Firestore
- **Chart.js 4.4.0** - Data visualization
- **Framer Motion 11.11.7** - Animations
- **Lucide React 0.552.0** - Icons
- **html2canvas 1.4.1** - PDF export
- **jsPDF 2.5.1** - PDF generation

### Backend
- **Python 3.11** - Language
- **Flask 3.0.0** - Web framework
- **Pandas 2.2.0** - Data processing
- **NumPy 1.26.4** - Numerical computing
- **Scikit-learn 1.4.0** - ML preprocessing
- **XGBoost 2.0.3** - Gradient boosting
- **CatBoost 1.2.2** - Categorical boosting
- **RandomForest** - Ensemble learning

### Cloud & Database
- **Firebase** - Auth, Firestore, Hosting
- **Google Cloud Run** - Backend deployment
- **Firestore** - Real-time database
- **Groq API** - LLM for chat

### AI/ML
- **Groq API** - LLM provider
- **llama-3.3-70b** - Language model
- **OpenAI SDK** - API client

---

## 🔐 Security Features

### Authentication
- Firebase Email/Password authentication
- Secure password hashing
- Auth state management

### Data Protection
- Firestore security rules (user-scoped access)
- HTTPS/SSL encryption
- Data validation on frontend and backend

### Privacy
- User data isolated by UID
- No data sharing between users
- Secure API endpoints

---

## 📊 Key Metrics Explained

### 1. Average Cycle Length
- **Definition**: Average number of days between period starts
- **Normal Range**: 21-35 days
- **Calculation**: Sum of all cycle lengths / number of cycles

### 2. Irregularity Percentage
- **Definition**: % of cycles outside normal range
- **Calculation**: (Cycles outside 21-35 days / Total cycles) × 100

### 3. Luteal Phase Duration
- **Definition**: Days from ovulation to next period
- **Normal Range**: 12-16 days
- **Importance**: Affects fertility and hormonal balance

### 4. Bleeding Intensity
- **Definition**: Average intensity rating (1-5)
- **Calculation**: Average of all intensity ratings

### 5. Ovulation Day
- **Definition**: Estimated day of ovulation in cycle
- **Calculation**: Cycle length - luteal phase duration

---

## 🎯 ML Model Outputs

### Risk Assessment
- **Low Risk**: Healthy cycle patterns, no concerns
- **Medium Risk**: Some irregularities, monitor closely
- **High Risk**: Significant concerns, consult healthcare provider

### Cluster Deviation
- **Cluster 0/1/2**: Pattern classification
- **Deviation Score**: 0-100 (higher = more unusual)
- **Interpretation**: How different from normal patterns

### PRWI Score
- **0-33**: Low wellness (high risk)
- **34-66**: Moderate wellness (medium risk)
- **67-100**: High wellness (low risk)

---

## 🚀 Performance Characteristics

### Frontend
- Load time: < 3 seconds
- API response time: < 2 seconds
- Real-time Firestore sync

### Backend
- Model prediction time: < 1 second
- Metrics calculation: < 500ms
- Report generation: < 2 seconds

### Database
- Query response: < 100ms
- Real-time updates: < 500ms
- Auto-scaling for load

---

## 📱 User Interface

### Pages
1. **Login/Signup** - Authentication
2. **Home** - Dashboard with overview
3. **Analysis** - Main analysis page
4. **Calendar** - Visual cycle tracking
5. **User Profile** - Personal information
6. **AI Chat** - Health education
7. **Reports** - Generated reports

### Key Features
- Responsive design (mobile, tablet, desktop)
- Real-time data sync
- Intuitive calendar UI
- Beautiful data visualizations
- Smooth animations

---

## 🔄 Data Synchronization

### Real-time Updates
```
User Action
  ↓
Firestore Update
  ↓
Listener Triggered
  ↓
React State Updated
  ↓
UI Re-renders
```

### Offline Support
- Firestore offline persistence
- Local state caching
- Sync when online

---

## 📈 Scalability

### Frontend
- Lazy loading of pages
- Code splitting
- Caching strategies

### Backend
- Serverless (Cloud Run)
- Auto-scaling
- Efficient algorithms

### Database
- Firestore auto-scaling
- Indexed queries
- Efficient structure

---

## 🐛 Error Handling

### Frontend
- Try-catch blocks
- User-friendly error messages
- Fallback UI states

### Backend
- Input validation
- Exception handling
- Detailed error responses

### Database
- Transaction support
- Rollback on errors
- Data consistency

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PROJECT_ARCHITECTURE.md` | System design and structure |
| `COMPONENT_INTERACTIONS.md` | Component details and flows |
| `HOW_IT_WORKS.md` | This file - user-friendly overview |
| `frontend/.env.example` | Environment variables template |

---

## 🎓 Learning Resources

### For Developers
- React documentation: https://react.dev
- Firebase docs: https://firebase.google.com/docs
- Flask docs: https://flask.palletsprojects.com
- XGBoost docs: https://xgboost.readthedocs.io

### For Users
- Menstrual health information
- Cycle tracking tips
- Health recommendations
- AI chatbot assistance

---

## 🚀 Getting Started

### For Users
1. Sign up with email
2. Fill in personal information
3. Start tracking cycles
4. Get AI-powered insights
5. Chat with health assistant

### For Developers
1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run frontend: `npm run dev`
5. Run backend: `python app.py`
6. Access at `http://localhost:5173`

---

**Last Updated**: 2024
**Project**: AI Menstrual Wellness Assistant
**Version**: 1.0
