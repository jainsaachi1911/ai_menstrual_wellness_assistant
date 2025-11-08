# Component Interactions & Data Flow Details

## 📱 Frontend Components Deep Dive

### 1. Authentication Components

#### Login.jsx
```javascript
// Flow:
User Input (email, password)
  ↓
signInWithEmailAndPassword(auth, email, password)
  ↓
Firebase Auth validates credentials
  ↓
Auth state listener triggered
  ↓
Navigate to /home
  ↓
Load user profile from Firestore
```

**Key Functions**:
- `onSubmit()` - Handles form submission
- Error handling for invalid credentials

**Dependencies**:
- Firebase Auth SDK
- React Router (useNavigate)

---

#### Signup.jsx
```javascript
// Flow:
User Input (email, password, profile info)
  ↓
createUserWithEmailAndPassword(auth, email, password)
  ↓
Firebase creates auth user
  ↓
Create user document in Firestore
  ↓
Save profile data
  ↓
Navigate to /home
```

**Key Functions**:
- `onSubmit()` - Registration handler
- `saveUserProfile()` - Save to Firestore

**Dependencies**:
- Firebase Auth SDK
- Firestore service

---

### 2. Main Pages

#### Home.jsx (Dashboard)
```javascript
// Purpose: Display cycle overview and quick stats

// Data Flow:
1. Load user profile from Firestore
2. Load cycles from Firestore
3. Calculate quick stats:
   - Average cycle length
   - Next period prediction
   - Last cycle date
4. Display recent analysis results
5. Show navigation cards

// State Management:
- user: Current authenticated user
- userProfile: User's personal data
- cycles: Array of cycle objects
- analysisMetrics: Calculated metrics
- modelPredictions: ML model results

// Renders:
- Welcome message
- Quick stats cards
- Recent analysis summary
- Navigation links to other pages
```

---

#### Analysis.jsx (Main Analysis Page)
```javascript
// Purpose: Core analysis functionality

// Key Functions:

1. recalculateMetrics(uid, profile, userCycles)
   - Collects cycle data + user profile
   - POST to /api/calculate-metrics
   - Saves metrics to Firestore
   - Updates state

2. prepareFeatures(metrics, userProfileData)
   - Consolidates metrics + profile
   - Handles camelCase/PascalCase conversion
   - Ensures correct types
   - Returns 17 features object

3. runModelPredictions(metrics, userProfileData)
   - Calls prepareFeatures()
   - POST to /api/predict
   - Receives risk, cluster, PRWI results
   - Saves to Firestore
   - Updates UI

4. calculateMetricsFromBackend()
   - Main analysis trigger
   - Calls recalculateMetrics()
   - Calls runModelPredictions()
   - Updates analysis history

// Data Flow:
User clicks "Analyze"
  ↓
calculateMetricsFromBackend()
  ↓
recalculateMetrics()
  ├─ POST /api/calculate-metrics
  ├─ Save metrics to Firestore
  └─ Update state
  ↓
runModelPredictions()
  ├─ prepareFeatures()
  ├─ POST /api/predict
  ├─ Save predictions to Firestore
  └─ Update state
  ↓
Display results in UI
```

---

#### User.jsx (Profile Management)
```javascript
// Purpose: User profile and health history

// Features:
- Edit personal information
- View cycle history
- View analysis history
- Download reports
- Settings

// Data Flow:
1. Load user profile from Firestore
2. Load cycles from Firestore
3. Load analyses from Firestore
4. Display in organized tabs
5. Allow editing and updates
6. Save changes to Firestore
```

---

#### AIChat.jsx (AI Chat Interface)
```javascript
// Purpose: Conversational AI for health education

// Data Flow:
User Types Message
  ↓
sendMessageToAI(message, conversationHistory)
  ├─ Build message array with system prompt
  ├─ Add conversation history
  ├─ POST to Groq API
  └─ Receive response
  ↓
Display response in chat UI
  ↓
Add to conversation history
  ↓
Save locally (optional)

// Key Functions:
- sendMessageToAI() - Groq API call
- formatMessage() - Format for display
- saveConversation() - Local storage

// State:
- messages: Array of chat messages
- loading: API call status
- error: Error messages
```

---

### 3. Key Components

#### AnalysisForm.jsx (Cycle Input Form)
```javascript
// Purpose: Collect cycle data from user

// Features:
- Calendar date picker
- Cycle intensity selector (1-5)
- Symptom tracker (9 symptoms)
- Cycle list display
- Next period prediction

// Key Functions:

1. predictNextPeriod(cyclesList)
   - POST to /api/predict-next-period
   - Returns predicted start/end dates
   - Displays on calendar

2. handleDateSelection(date)
   - Toggle start/end date selection
   - Validate date range
   - Update temp state

3. handleSubmit()
   - Validate cycle data
   - POST to /api/predict (optional)
   - Save to Firestore
   - Update UI

// Data Structure:
cyclesMap = {
  "2024-01": {
    start: "2024-01-01",
    end: "2024-01-05",
    intensity: 3,
    symptoms: {
      cramps: 4,
      headache: true,
      fatigue: 3,
      mood: 2,
      bloating: false,
      nausea: false,
      backPain: 2,
      acne: false,
      cravings: 1
    }
  }
}

// Calendar UI:
- Display month calendar
- Highlight cycle dates
- Show predicted period dates
- Allow date selection
```

---

#### Navbar.jsx (Navigation)
```javascript
// Purpose: Main navigation and user menu

// Features:
- Navigation links to all pages
- User menu (profile, logout)
- Responsive design
- Active page highlighting

// State:
- isOpen: Mobile menu state
- user: Current user

// Functions:
- handleLogout() - Sign out user
- toggleMenu() - Mobile menu toggle
```

---

## 🔗 Service Layer

### firebase.js (Firebase Initialization)
```javascript
// Initializes Firebase app with config
// Exports:
- auth: Firebase Auth instance
- db: Firestore instance

// Config:
const firebaseConfig = {
  apiKey: "...",
  authDomain: "ai-menstrual-wellness.firebaseapp.com",
  projectId: "ai-menstrual-wellness",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

---

### firestore.js (Firestore Operations)
```javascript
// CRUD operations for Firestore

// Functions:

1. saveUserProfile(uid, profile)
   - Save/update user profile
   - Merge with existing data
   - Add timestamp

2. addCycle(uid, cycleData)
   - Add new cycle
   - Auto-generate ID
   - Add timestamp

3. getCycles(uid)
   - Fetch all cycles for user
   - Sort by monthKey
   - Return array

4. addAnalysis(uid, analysis)
   - Save analysis results
   - Store with timestamp
   - Link to user

5. getAnalyses(uid)
   - Fetch all analyses
   - Sort by date (descending)
   - Return array

6. saveAnalysisMetrics(uid, metrics)
   - Save calculated metrics
   - Update user document
   - Merge with existing data

7. getUserProfile(uid)
   - Fetch user profile
   - Return profile object
```

---

### aiService.js (Groq API Integration)
```javascript
// AI chat service using Groq API

// Configuration:
const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true
})

// System Prompt:
"You are a helpful and empathetic AI assistant specializing 
in menstrual health education. You provide accurate, 
evidence-based information..."

// Function:
export const sendMessageToAI = async (message, conversationHistory)
  - Input: User message + chat history
  - Output: AI response
  - Model: llama-3.3-70b-versatile
  - Temperature: 0.7
  - Max tokens: 1024
```

---

## 🔄 Backend API Integration

### Flask Backend (app.py)

#### Request/Response Cycle

```
Frontend Request
  ↓
Flask Route Handler
  ├─ Parse JSON body
  ├─ Validate input
  └─ Extract parameters
  ↓
Business Logic
  ├─ Calculate metrics
  ├─ Validate features
  ├─ Run ML models
  └─ Generate results
  ↓
Response
  ├─ JSON format
  ├─ Success/error status
  └─ Data payload
  ↓
Frontend Receives
  ├─ Parse response
  ├─ Update state
  ├─ Save to Firestore
  └─ Update UI
```

---

### Endpoint: /api/calculate-metrics

```
Frontend Call:
fetch(`${API_BASE_URL}/api/calculate-metrics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_data: {
      age: 25,
      bmi: 22,
      numberPregnancies: 0,
      numberAbortions: 0,
      ageAtFirstMenstruation: 12,
      currentlyBreastfeeding: false
    },
    cycles: [
      {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        intensity: 3
      }
    ]
  })
})

Backend Processing:
1. Extract user_data and cycles
2. Call calculate_metrics_from_data()
3. Calculate 12 metrics:
   - avgCycleLength
   - irregularCyclesPercent
   - stdCycleLength
   - avgLutealPhase
   - shortLutealPercent
   - avgBleedingIntensity
   - unusualBleedingPercent
   - avgMensesLength
   - avgOvulationDay
   - ovulationVariability
   - totalCycles
4. Return metrics object

Frontend Receives:
{
  "success": true,
  "calculated_metrics": {
    "avgCycleLength": 28.5,
    "irregularCyclesPercent": 10,
    ...
  }
}

Frontend Actions:
1. setAnalysisMetrics(data.calculated_metrics)
2. saveAnalysisMetrics(uid, metrics)
3. Update UI with metrics
```

---

### Endpoint: /api/predict

```
Frontend Call:
fetch(`${API_BASE_URL}/api/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    features: {
      AvgCycleLength: 28,
      IrregularCyclesPercent: 10,
      StdCycleLength: 2,
      AvgLutealPhase: 14,
      ShortLutealPercent: 5,
      AvgBleedingIntensity: 3,
      UnusualBleedingPercent: 0,
      AvgMensesLength: 5,
      AvgOvulationDay: 14,
      OvulationVariability: 2,
      TotalCycles: 12,
      Age: 25,
      BMI: 22,
      Numberpreg: 0,
      Abortions: 0,
      AgeM: 12,
      Breastfeeding: 0
    },
    models: ["all"]
  })
})

Backend Processing:
1. Validate features (17 required)
2. Run 3 models:
   a) predict_risk()
      - XGBoost model
      - Returns: risk_level, probabilities
   
   b) predict_cluster_deviation()
      - RandomForest + GMM
      - Returns: cluster, deviation_score
   
   c) predict_prwi()
      - Ensemble meta-model
      - Returns: prwi_score
3. Combine results

Frontend Receives:
{
  "success": true,
  "results": {
    "risk_assessment": {
      "risk_level": "Low",
      "risk_prob_low": 0.85,
      "risk_prob_medium": 0.12,
      "risk_prob_high": 0.03
    },
    "clusterdev": {
      "cluster": 1,
      "deviation_score": 25.5,
      "interpretation": "..."
    },
    "prwi_score": {
      "score": 72.5,
      "interpretation": "..."
    }
  }
}

Frontend Actions:
1. setModelPredictions(data.results)
2. Save to Firestore
3. Display in UI
```

---

## 🔐 State Management

### React State Flow

```
App.jsx
  ├─ user (Auth state)
  └─ [Pass to pages via context/props]

Analysis.jsx
  ├─ user
  ├─ userProfile
  ├─ cycles
  ├─ analysisMetrics
  ├─ modelPredictions
  ├─ calculating
  ├─ loading
  ├─ error
  └─ analysisHistory

AnalysisForm.jsx
  ├─ cyclesMap
  ├─ cycles
  ├─ currentDate
  ├─ tempStart
  ├─ tempEnd
  ├─ tempIntensity
  ├─ nextPeriodPrediction
  └─ loading

AIChat.jsx
  ├─ messages
  ├─ loading
  ├─ error
  └─ conversationHistory
```

---

## 📡 Data Synchronization

### Real-time Updates (Firestore)

```
User Updates Profile
  ↓
saveUserProfile(uid, profile)
  ├─ setDoc with merge: true
  ├─ Add updatedAt timestamp
  └─ Firestore updates
  ↓
Listener triggered (if set up)
  ├─ Fetch updated data
  ├─ Update React state
  └─ Re-render UI

User Adds Cycle
  ↓
addCycle(uid, cycleData)
  ├─ addDoc to cycles collection
  ├─ Auto-generate ID
  ├─ Add createdAt timestamp
  └─ Firestore updates
  ↓
Frontend
  ├─ Fetch updated cycles
  ├─ Sort by monthKey
  ├─ Update state
  └─ Re-render calendar
```

---

## 🎯 Error Handling

### Frontend Error Handling

```
API Call
  ↓
Try-Catch Block
  ├─ Success: Process response
  └─ Error: Handle error
  ↓
Error Types:
  ├─ Network error
  ├─ API error (400, 500)
  ├─ Validation error
  └─ Firestore error
  ↓
User Feedback:
  ├─ Alert/Toast message
  ├─ Console logging
  └─ UI error state
```

---

## 🚀 Performance Optimizations

### Frontend
- Lazy loading of pages
- Memoization of expensive calculations
- Debouncing of API calls
- Local state caching

### Backend
- Feature validation before model prediction
- Efficient pandas operations
- Model caching in memory
- Response compression

### Database
- Indexed queries
- Efficient document structure
- Subcollections for cycles/analyses
- Timestamp-based sorting

---

## 📊 Complete User Flow Example

```
1. User Signs Up
   Signup.jsx → Firebase Auth → Firestore user doc created

2. User Fills Profile
   User.jsx → saveUserProfile() → Firestore updated

3. User Adds Cycles
   AnalysisForm.jsx → addCycle() → Firestore cycles collection

4. User Clicks Analyze
   Analysis.jsx → calculateMetricsFromBackend()
   ├─ recalculateMetrics()
   │  └─ POST /api/calculate-metrics
   │     └─ Backend calculates 12 metrics
   ├─ runModelPredictions()
   │  └─ POST /api/predict
   │     └─ Backend runs 3 ML models
   └─ Save all results to Firestore

5. User Views Results
   Analysis.jsx displays:
   ├─ Calculated metrics
   ├─ Risk assessment
   ├─ Cluster deviation
   └─ PRWI score

6. User Chats with AI
   AIChat.jsx → sendMessageToAI()
   └─ Groq API → Response displayed

7. User Generates Report
   Analysis.jsx → POST /api/generate-report
   └─ Export as PDF
```

---

**Last Updated**: 2024
**Project**: AI Menstrual Wellness Assistant
