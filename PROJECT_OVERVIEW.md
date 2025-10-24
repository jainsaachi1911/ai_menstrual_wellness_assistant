# AI Menstrual Wellness Assistant - Project Overview

## 📋 Project Summary

This is a **comprehensive menstrual health risk assessment system** that uses machine learning to analyze menstrual cycle data and predict health risks. The project implements a multi-component AI system called **PRWI (Personalized Risk and Wellness Index)** that combines clustering, risk assessment, and ensemble scoring.

---

## 🗂️ Project Structure

### **Data Files**
- **FedCycleData.csv** (1,665 rows, 159 users) - Original dataset
- **FedCycleData_2.csv** (3,183 rows) - Augmented dataset version 1
- **FedCycleData 3.csv** (2,043 rows) - Augmented dataset version 2
- **new_FedCycleData_2.csv** (4,163 rows) - Latest augmented dataset

### **Model Files**
- **clusterdev_gmm_model.pkl** (317KB) - Gaussian Mixture Model for clustering
- **menstrual_risk_user_model (1).pkl** (335KB) - XGBoost risk assessment model

### **Notebooks**
1. **DataAug.ipynb** - Data augmentation pipeline
2. **ClusterDev.ipynb** - Cluster development using GMM
3. **RiskAssessment 2.ipynb** - Risk prediction using XGBoost
4. **PRWIScore.ipynb** - PRWI score calculation using ensemble methods

---

## 📊 Dataset Details

### **Structure**
- **80 columns** covering menstrual cycle metrics, demographics, and health indicators
- **Multi-cycle per user**: Each user has multiple menstrual cycles tracked
- **159 unique users** in original dataset (expanded through augmentation)

### **Key Features**

#### **Cycle Metrics**
- LengthofCycle, MeanCycleLength, StdCycleLength
- EstimatedDayofOvulation
- LengthofLutealPhase
- FirstDayofHigh, TotalNumberofHighDays, TotalNumberofPeakDays
- TotalDaysofFertility

#### **Menstrual Bleeding**
- LengthofMenses, MeanMensesLength
- MensesScoreDayOne through MensesScoreDay15
- TotalMensesScore, MeanBleedingIntensity
- UnusualBleeding, PhasesBleeding

#### **Demographics & Health**
- Age, Height, Weight, BMI
- Maristatus, Yearsmarried, Religion, Ethnicity
- Schoolyears, Income

#### **Reproductive History**
- ReproductiveCategory, Reprocate
- Numberpreg, Livingkids, Miscarriages, Abortions
- Breastfeeding status

#### **Medical History**
- Medvits (vitamins/medications)
- Gynosurgeries, Urosurgeries

#### **Fertility Tracking**
- NumberofDaysofIntercourse
- IntercourseInFertileWindow
- Method, Prevmethod (contraception methods)

---

## 🔬 Component 1: Data Augmentation (DataAug.ipynb)

### **Purpose**
Address class imbalance in risk categories by generating synthetic users with realistic cycle patterns.

### **Methodology**

1. **Risk Score Calculation**
   - Analyzes user-level aggregated features
   - Assigns risk scores based on:
     - Irregular cycle percentage (>30% = high risk)
     - Cycle variability (std > 7 days)
     - Short luteal phase (>30% cycles with phase < 10 days)
     - Unusual bleeding frequency
     - Age factors

2. **Risk Categories**
   - **Low Risk**: Score 0-3
   - **Medium Risk**: Score 4-7
   - **High Risk**: Score 8+

3. **Target Distribution**
   - Low Risk: 50%
   - Medium Risk: 31%
   - High Risk: 19%

4. **Augmentation Strategy**
   - Selects base users from existing data
   - Modifies cycle characteristics to match target risk category
   - Generates new ClientIDs (nfp####)
   - Preserves realistic cycle patterns and correlations

### **Output**
- Augmented datasets with balanced risk distributions
- Maintains data integrity and medical plausibility

---

## 🧩 Component 2: Cluster Development (ClusterDev.ipynb)

### **Purpose**
Identify healthy lifestyle clusters and measure user deviation from optimal health patterns.

### **Class: ClusterDevGMM**

#### **Key Methods**

1. **`prepare_features(df, user_id_col=None)`**
   - Aggregates cycle-level data to user-level
   - Creates statistical summaries (mean, std, min, max, percentiles)
   - Handles multi-cycle-per-user structure

2. **`fit(df, n_components_range=(2, 8))`**
   - Trains Gaussian Mixture Model
   - Uses BIC (Bayesian Information Criterion) for optimal cluster selection
   - Tests cluster counts from 2 to 8
   - Fits StandardScaler and SimpleImputer

3. **`predict_cluster(df)`**
   - Assigns users to clusters
   - Returns cluster labels

4. **`calculate_deviation_score(df)`**
   - Computes Mahalanobis distance from cluster centers
   - Normalizes to 0-100 scale
   - Higher score = greater deviation from healthy patterns

5. **`save_model(filepath)`** / **`load_model(filepath)`**
   - Serializes/deserializes model components

### **Features Used**
- Cycle length statistics (mean, std, irregularity)
- Luteal phase characteristics
- Bleeding intensity and patterns
- Age and BMI
- Fertility window metrics

### **Output**
- **clusterdev_gmm_model.pkl**: Trained GMM with scaler and imputer
- Cluster assignments and deviation scores for each user

---

## 🎯 Component 3: Risk Assessment (RiskAssessment 2.ipynb)

### **Purpose**
Predict menstrual health risk levels using supervised machine learning.

### **Methodology**

#### **1. User-Level Feature Engineering**
Function: `create_user_level_features(df)`

Aggregates cycle data to create comprehensive user profiles:
- **Cycle Statistics**: Mean, std, min, max cycle lengths
- **Irregularity Metrics**: Percentage of irregular cycles
- **Luteal Phase**: Mean length, short phase percentage
- **Bleeding Patterns**: Mean intensity, max intensity, unusual bleeding count
- **Temporal Features**: Total cycles tracked
- **Demographics**: Age, BMI

#### **2. Data Confidence Scoring**
Function: `calculate_data_confidence(user_data, min_cycles=3, optimal_cycles=12)`

Calculates prediction confidence based on:
- Number of cycles tracked (more cycles = higher confidence)
- Data completeness (missing values reduce confidence)
- Feature availability

**Confidence Levels**:
- **Excellent**: 12+ cycles, complete data (90-100%)
- **High**: 8-11 cycles, mostly complete (75-89%)
- **Medium**: 5-7 cycles, some gaps (50-74%)
- **Low**: 3-4 cycles, significant gaps (25-49%)
- **Very Low**: <3 cycles or very incomplete (<25%)

#### **3. Model Training**
- **Algorithm**: XGBoost Classifier
- **Target**: Risk categories (Low/Medium/High)
- **Features**: Medical-priority features selected based on clinical relevance
- **Preprocessing**: StandardScaler, median imputation
- **Validation**: Train-test split, cross-validation

#### **4. Model Comparison**
Also trains and compares:
- **Random Forest Classifier**
- **K-Means Clustering** (unsupervised baseline)

#### **5. Evaluation Metrics**
- Classification report (precision, recall, F1-score)
- Confusion matrix
- ROC-AUC score
- Feature importance analysis
- Confidence-stratified performance

#### **6. Prediction Function**
Function: `predict_user_menstrual_risk(user_cycles_data, model, scaler_obj, target_enc, feature_weights)`

**Returns**:
- Risk category (Low/Medium/High)
- Risk probability scores
- Confidence level
- Risk factors identified
- Personalized recommendations

### **Output**
- **menstrual_risk_user_model (1).pkl**: Complete model package with:
  - Trained XGBoost model
  - StandardScaler
  - Target encoder
  - Feature names and weights
  - Metadata (training date, version)

---

## 📈 Component 4: PRWI Score (PRWIScore.ipynb)

### **Purpose**
Generate a comprehensive **Personalized Risk and Wellness Index (PRWI)** score using ensemble methods.

### **Methodology**

#### **1. Data Preparation**
- Loads augmented dataset (FedCycleData 3.csv)
- Aggregates user-level features
- Creates target variable (risk score or category)

#### **2. Ensemble Models**

**Model 1: CatBoost Regressor**
- Handles categorical features natively
- Robust to overfitting
- Ordered boosting algorithm

**Model 2: LightGBM Regressor**
- Fast gradient boosting
- Leaf-wise tree growth
- Efficient memory usage

**Model 3: XGBoost Regressor** (mentioned in imports)
- Level-wise tree growth
- Regularization capabilities

#### **3. Model Training**
- Train-test split
- Hyperparameter tuning
- Cross-validation

#### **4. Evaluation**
Computes for each model:
- **MSE** (Mean Squared Error)
- **RMSE** (Root Mean Squared Error)
- **MAE** (Mean Absolute Error)
- **R²** (R-squared score)

#### **5. Visualization**
- Bar plots of model MSEs
- Scatter plots: Predicted vs Actual
- Residual plots
- Feature importance charts

#### **6. Ensemble Strategy**
Combines predictions from multiple models to create final PRWI score:
- Weighted average based on model performance
- Reduces variance and improves generalization

### **PRWI Score Interpretation**
- **0-30**: Low Risk - Healthy menstrual patterns
- **31-60**: Medium Risk - Some irregularities, monitoring recommended
- **61-100**: High Risk - Significant concerns, medical consultation advised

### **Output**
- Trained ensemble models
- PRWI scores for all users
- Model comparison metrics
- Visualization plots

---

## 🔄 System Workflow

```
1. DATA AUGMENTATION (DataAug.ipynb)
   ↓
   [Balanced dataset with realistic synthetic users]
   ↓
2. CLUSTER DEVELOPMENT (ClusterDev.ipynb)
   ↓
   [User cluster assignments + deviation scores]
   ↓
3. RISK ASSESSMENT (RiskAssessment 2.ipynb)
   ↓
   [Risk categories + confidence levels + recommendations]
   ↓
4. PRWI SCORE CALCULATION (PRWIScore.ipynb)
   ↓
   [Final PRWI score: 0-100 scale]
```

---

## 🎯 Key Features of the System

### **1. Multi-Model Approach**
- Combines unsupervised (GMM) and supervised (XGBoost) learning
- Ensemble methods for robust predictions
- Model comparison and validation

### **2. User-Level Analysis**
- Aggregates multiple cycles per user
- Captures temporal patterns and trends
- Accounts for individual variability

### **3. Confidence-Aware Predictions**
- Quantifies prediction reliability
- Adjusts recommendations based on data quality
- Transparent uncertainty communication

### **4. Clinical Relevance**
- Feature selection based on medical importance
- Interpretable risk factors
- Actionable recommendations

### **5. Scalability**
- Handles varying amounts of user data (3-12+ cycles)
- Efficient preprocessing pipelines
- Serialized models for deployment

---

## 🛠️ Technical Stack

### **Libraries**
- **Data Processing**: pandas, numpy
- **Machine Learning**: scikit-learn, xgboost, lightgbm, catboost
- **Clustering**: sklearn.mixture.GaussianMixture
- **Visualization**: matplotlib, seaborn
- **Model Persistence**: pickle

### **Algorithms**
- **Gaussian Mixture Model (GMM)** - Clustering
- **XGBoost Classifier** - Risk classification
- **Random Forest Classifier** - Comparison baseline
- **CatBoost Regressor** - PRWI score component
- **LightGBM Regressor** - PRWI score component

### **Preprocessing**
- StandardScaler - Feature normalization
- SimpleImputer - Missing value handling
- Label encoding - Categorical variables

---

## 📊 Model Performance Highlights

### **Risk Assessment Model (XGBoost)**
- Multi-class classification (Low/Medium/High risk)
- Feature importance analysis reveals key risk factors
- Confidence-stratified evaluation
- ROC-AUC curves for each risk category

### **Cluster Development (GMM)**
- Optimal cluster selection via BIC
- Mahalanobis distance for deviation measurement
- Identifies healthy lifestyle patterns

### **PRWI Ensemble**
- Combines multiple regression models
- Metrics: MSE, RMSE, MAE, R²
- Model comparison for best performance

---

## 🚀 Use Cases

### **1. Personal Health Monitoring**
- Track menstrual cycle patterns over time
- Identify deviations from healthy norms
- Receive personalized wellness recommendations

### **2. Early Risk Detection**
- Predict potential menstrual health issues
- Confidence-based alerts
- Proactive intervention suggestions

### **3. Clinical Decision Support**
- Provide healthcare professionals with data-driven insights
- Quantify risk levels objectively
- Support diagnosis and treatment planning

### **4. Research & Analytics**
- Analyze population-level menstrual health trends
- Identify risk factor correlations
- Validate clinical hypotheses

---

## 📝 Key Insights

### **Risk Factors Identified**
1. **Cycle Irregularity**: High variability in cycle length
2. **Short Luteal Phase**: <10 days indicates hormonal issues
3. **Unusual Bleeding**: Spotting or heavy bleeding outside normal menses
4. **Age**: Reproductive age category impacts risk
5. **BMI**: Extremes correlate with menstrual irregularities

### **Data Quality Matters**
- Predictions improve significantly with 8+ cycles
- Confidence scoring helps users understand reliability
- Encourages consistent tracking for better insights

### **Personalization is Key**
- User-level aggregation captures individual patterns
- Cluster-based deviation accounts for healthy diversity
- Recommendations tailored to specific risk factors

---

## 🔮 Future Enhancements

### **Potential Improvements**
1. **Real-time Predictions**: API for live cycle tracking apps
2. **Symptom Integration**: Include pain, mood, energy levels
3. **Temporal Modeling**: LSTM/RNN for sequence prediction
4. **Explainable AI**: SHAP values for feature contribution
5. **Mobile App**: User-friendly interface for predictions
6. **Multi-language Support**: Expand accessibility
7. **Integration with Wearables**: Sync with fitness trackers

### **Research Directions**
1. **Causal Inference**: Identify causal risk factors vs correlations
2. **Transfer Learning**: Adapt models to different populations
3. **Federated Learning**: Privacy-preserving multi-center training
4. **Longitudinal Studies**: Track users over years

---

## 📚 Documentation Notes

### **Code Quality**
- Well-structured classes and functions
- Comprehensive docstrings
- Error handling and validation
- Modular design for reusability

### **Reproducibility**
- Random seeds set (random_state=42)
- Model versioning and metadata
- Serialized models for consistency

### **Google Colab Integration**
- All notebooks designed for Colab
- Google Drive mounting for data access
- GPU/TPU support where applicable

---

## 🎓 Academic Context

This appears to be a **Capstone Project** for an academic program, focusing on:
- **Applied Machine Learning** in healthcare
- **Women's Health Technology**
- **Predictive Analytics**
- **Ensemble Methods**
- **Data Augmentation Techniques**

The project demonstrates proficiency in:
- End-to-end ML pipeline development
- Healthcare data analysis
- Model evaluation and comparison
- Real-world problem solving

---

## 📞 Project Metadata

- **Author**: Saachi Jain (based on notebook metadata)
- **Environment**: Google Colab
- **Dataset**: FedCycleData (fertility/cycle tracking data)
- **Models Saved**: September 12, 2024 (based on file timestamps)
- **Primary Language**: Python 3
- **Notebook Format**: Jupyter (.ipynb)

---

## 🏁 Conclusion

This is a **sophisticated, production-ready menstrual health AI system** that combines multiple machine learning techniques to provide comprehensive risk assessment and wellness scoring. The project demonstrates strong technical skills in:

✅ Data preprocessing and augmentation  
✅ Feature engineering for healthcare data  
✅ Multi-model ensemble approaches  
✅ Model evaluation and validation  
✅ Confidence-aware predictions  
✅ Clinical relevance and interpretability  

The system is designed to be **scalable, accurate, and user-friendly**, with clear potential for real-world deployment in health tracking applications or clinical settings.
