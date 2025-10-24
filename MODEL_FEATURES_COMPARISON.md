# Model Features Comparison

## ❌ NO - The 3 models DO NOT use the same input features

Each model has different input requirements based on its specific purpose:

---

## 📊 Feature Comparison Table

| Feature Category | ClusterDev (GMM) | Risk Assessment (XGBoost) | PRWI Score (Ensemble) |
|-----------------|------------------|---------------------------|----------------------|
| **Total Features** | **47 features** | **13 features** | **~15-20 features** |
| **Input Level** | User-aggregated | User-aggregated | User-aggregated |
| **Purpose** | Cluster assignment & deviation | Risk classification | Wellness score (0-100) |

---

## 1️⃣ ClusterDev (GMM) - 47 Features

### Demographics (17 features)
- Age, AgeM
- Height, Weight, BMI
- Schoolyears
- Numberpreg, Livingkids, Miscarriages, Abortions
- Maristatus, MaristatusM, Yearsmarried
- Religion, ReligionM
- Ethnicity, EthnicityM

### Cycle Statistics (18 features)
- LengthofCycle_mean, LengthofCycle_std, LengthofCycle_min, LengthofCycle_max
- LengthofLutealPhase_mean, LengthofLutealPhase_std
- LengthofMenses_mean, LengthofMenses_std
- MeanBleedingIntensity_mean, MeanBleedingIntensity_std
- TotalMensesScore_mean, TotalMensesScore_std
- TotalNumberofHighDays_mean, TotalNumberofHighDays_std
- TotalDaysofFertility_mean, TotalDaysofFertility_std
- NumberofDaysofIntercourse_mean, NumberofDaysofIntercourse_std

### Ovulation & Fertility (3 features)
- EstimatedDayofOvulation_mean, EstimatedDayofOvulation_std
- TotalNumberofPeakDays_mean

### Derived Features (9 features)
- menses_score_mean, menses_score_std
- extended_period_ratio
- max_period_day
- Breastfeeding
- unusual_bleeding_ratio
- cycle_irregularity
- cycle_count
- repro_category_mode

---

## 2️⃣ Risk Assessment (XGBoost) - 13 Features

**Medical-priority features only:**

### Cycle Regularity (3 features)
- AvgCycleLength - Primary PCOS indicator
- IrregularCyclesPercent - Irregularity frequency
- StdCycleLength - Cycle variability

### Hormonal Function (2 features)
- AvgLutealPhase - Luteal phase adequacy
- ShortLutealPercent - Luteal phase deficiency frequency

### Bleeding Patterns (3 features)
- AvgBleedingIntensity - Bleeding severity
- UnusualBleedingPercent - Abnormal bleeding frequency
- AvgMensesLength - Menstrual duration

### Fertility & Ovulation (2 features)
- AvgOvulationDay - Ovulation timing
- OvulationVariability - Ovulation consistency

### Demographics (3 features)
- Age - Easy to provide
- BMI - Health indicator
- TotalCycles - Data completeness indicator

---

## 3️⃣ PRWI Score (Ensemble) - ~15-20 Features

**Similar to Risk Assessment but with additional features:**

### Core Features (from aggregation)
- AvgCycleLength (from LengthofCycle_mean)
- StdCycleLength (from LengthofCycle_std)
- IrregularCyclesPercent (cycles <24 or >35)
- AvgLutealPhase (from LengthofLutealPhase_mean)
- ShortLutealPercent (luteal phase <10 days)
- AvgMensesLength (from LengthofMenses_mean)
- UnusualBleedingPercent (from UnusualBleeding)
- AvgOvulationDay (from EstimatedDayofOvulation_mean)
- OvulationVariability (from EstimatedDayofOvulation_std)
- AvgBleedingIntensity (from MeanBleedingIntensity_mean)

### Additional Features
- Age
- BMI
- Numberpreg (number of pregnancies)
- Abortions
- AgeM (male partner age)
- Breastfeeding

---

## 🔍 Key Differences

### ClusterDev (GMM) - Most Comprehensive
- **47 features** including demographics, reproductive history, lifestyle
- Uses **all available user data** for holistic clustering
- Includes partner demographics (AgeM, MaristatusM, etc.)
- Captures lifestyle factors (intercourse patterns, breastfeeding)
- **Purpose**: Identify healthy lifestyle patterns and measure deviation

### Risk Assessment (XGBoost) - Most Focused
- **13 features** - only medical-priority indicators
- **Clinically relevant** features selected by medical importance
- Excludes demographics that don't directly impact risk
- **Purpose**: Predict specific risk categories (Low/Medium/High)
- Optimized for **interpretability** and **actionable insights**

### PRWI Score (Ensemble) - Balanced Approach
- **~15-20 features** - middle ground
- Similar to Risk Assessment but includes reproductive history
- Uses ensemble of CatBoost, LightGBM, XGBoost
- **Purpose**: Generate comprehensive wellness score (0-100)
- Balances **comprehensiveness** with **clinical relevance**

---

## 🎯 Feature Overlap Analysis

### Common to All 3 Models (Core Features)
✅ Age  
✅ BMI  
✅ AvgCycleLength / LengthofCycle statistics  
✅ AvgLutealPhase / LengthofLutealPhase statistics  
✅ Bleeding intensity metrics  
✅ Ovulation timing metrics  

### Only in ClusterDev (GMM)
- Partner demographics (AgeM, MaristatusM, etc.)
- Socioeconomic factors (Schoolyears, Religion, Ethnicity)
- Detailed fertility tracking (NumberofDaysofIntercourse, TotalDaysofFertility)
- Physical measurements (Height, Weight separately)

### Only in Risk Assessment (XGBoost)
- TotalCycles (data quality indicator)
- Specific percentage metrics (IrregularCyclesPercent, ShortLutealPercent)

### Only in PRWI Score (Ensemble)
- Numberpreg (pregnancy count)
- Abortions
- AgeM (male partner age)
- Breastfeeding status

---

## 💡 Implications for Frontend/Backend

### For User Input Forms
You'll need to collect **different data** depending on which model(s) you want to use:

#### Minimal Input (Risk Assessment only)
- 13 fields - quickest user experience
- Focus on cycle tracking data
- Suitable for initial assessment

#### Comprehensive Input (All 3 models)
- Up to 47 fields
- Includes lifestyle and demographic data
- Provides complete PRWI analysis

#### Recommended Approach: **Progressive Disclosure**
1. **Phase 1**: Collect 13 core features → Get Risk Assessment
2. **Phase 2**: Optional additional fields → Enable PRWI Score
3. **Phase 3**: Full profile → Enable ClusterDev analysis

### For Backend API Design
You'll need **3 different prediction endpoints**:

```
POST /api/predict/risk          # Requires 13 features
POST /api/predict/prwi          # Requires ~15-20 features
POST /api/predict/cluster       # Requires 47 features
POST /api/predict/comprehensive # All models (47 features)
```

### Data Transformation Pipeline
Each model requires **user-level aggregation** from cycle-level data:
- Frontend collects **individual cycle records**
- Backend aggregates to **user-level statistics**
- Each model receives its specific feature subset

---

## 📝 Summary

**Answer: NO, the 3 models use DIFFERENT input features**

- **ClusterDev**: 47 features (comprehensive lifestyle analysis)
- **Risk Assessment**: 13 features (focused medical indicators)
- **PRWI Score**: ~15-20 features (balanced approach)

**Recommendation for Frontend/Backend:**
- Design a **flexible input system** that collects cycle-level data
- Implement **feature engineering** on the backend to create user-level aggregations
- Use **progressive disclosure** in the UI to collect data incrementally
- Create **separate API endpoints** for each model with appropriate feature validation
