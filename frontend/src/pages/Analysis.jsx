import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, saveAnalysisMetrics, getAnalyses, getCycles } from '../services/firestore';
import { 
  Activity, 
  Brain, 
  Heart, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  Calculator,
  User,
  Baby,
  Scale,
  Droplet,
  PieChart,
  LineChart,
  Target,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Download
} from 'lucide-react';
import '../styles/Analysis.css';

// Simple Chart Components
const CircularProgress = ({ value, max, label, color = '#b8396b' }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="circular-progress">
      <svg width="100" height="100" className="progress-ring">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#e0e0e0"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-circle"
        />
      </svg>
      <div className="progress-content">
        <div className="progress-value">{value}</div>
        <div className="progress-label">{label}</div>
      </div>
    </div>
  );
};

const BarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bar-chart">
      <h4 className="chart-title">{title}</h4>
      <div className="bars-container">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar">
              <div 
                className="bar-fill"
                style={{ 
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#b8396b'
                }}
              ></div>
            </div>
            <div className="bar-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendChart = ({ cycles }) => {
  if (!cycles || cycles.length < 2) return null;
  
  const cycleLengths = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const start = new Date(cycles[i].startDate?.toDate ? cycles[i].startDate.toDate() : cycles[i].startDate);
    const nextStart = new Date(cycles[i + 1].startDate?.toDate ? cycles[i + 1].startDate.toDate() : cycles[i + 1].startDate);
    const length = Math.round((nextStart - start) / (1000 * 60 * 60 * 24));
    cycleLengths.push({ cycle: i + 1, length });
  }
  
  const maxLength = Math.max(...cycleLengths.map(c => c.length));
  const minLength = Math.min(...cycleLengths.map(c => c.length));
  
  return (
    <div className="trend-chart">
      <h4 className="chart-title">Cycle Length Trend</h4>
      <div className="trend-line">
        {cycleLengths.map((point, index) => (
          <div key={index} className="trend-point" style={{
            left: `${(index / (cycleLengths.length - 1)) * 100}%`,
            bottom: `${((point.length - minLength) / (maxLength - minLength)) * 80 + 10}%`
          }}>
            <div className="point" title={`Cycle ${point.cycle}: ${point.length} days`}></div>
            <div className="point-label">{point.length}</div>
          </div>
        ))}
      </div>
      <div className="trend-axis">
        <span>Cycle 1</span>
        <span>Cycle {cycleLengths.length}</span>
      </div>
    </div>
  );
};

const Analysis = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [analysisMetrics, setAnalysisMetrics] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState({});
  const [modelPredictions, setModelPredictions] = useState(null);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [userFeatures, setUserFeatures] = useState({
    // Personal Information
    age: '',
    bmi: '',
    numberPregnancies: '',
    numberAbortions: '',
    ageAtFirstMenstruation: '',
    currentlyBreastfeeding: false,
    
    // Cycle Information
    avgCycleLength: '',
    irregularCyclesPercent: '',
    stdCycleLength: '',
    avgLutealPhase: '',
    shortLutealPercent: '',
    avgMensesLength: '',
    avgBleedingIntensity: '',
    unusualBleedingPercent: '',
    avgOvulationDay: '',
    ovulationVariability: '',
    totalCycles: ''
  });
  const [showUserForm, setShowUserForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        setAnalysisMetrics(null);
        setAnalysisHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    try {
      const [profile, analyses, cyclesData] = await Promise.all([
        getUserProfile(uid),
        getAnalyses(uid),
        getCycles(uid)
      ]);
      
      setUserProfile(profile);
      setAnalysisMetrics(profile?.analysisMetrics || null);
      setAnalysisHistory(analyses || []);
      setCycles(cyclesData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const calculateMetrics = async () => {
    if (!user || !userProfile) return;
    
    setCalculating(true);
    try {
      // Get profile data
      const profile = userProfile.profile || {};
      
      // Calculate cycle metrics from stored cycles
      const completedCycles = cycles.filter(cycle => cycle.startDate && cycle.endDate);
      
      if (completedCycles.length < 2) {
        alert('Need at least 2 complete cycles to calculate metrics');
        setCalculating(false);
        return;
      }

      // Calculate cycle lengths
      const cycleLengths = [];
      for (let i = 0; i < completedCycles.length - 1; i++) {
        const start = new Date(completedCycles[i].startDate.toDate ? completedCycles[i].startDate.toDate() : completedCycles[i].startDate);
        const nextStart = new Date(completedCycles[i + 1].startDate.toDate ? completedCycles[i + 1].startDate.toDate() : completedCycles[i + 1].startDate);
        const length = Math.round((nextStart - start) / (1000 * 60 * 60 * 24));
        cycleLengths.push(length);
      }

      const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
      
      // Calculate standard deviation
      const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgCycleLength, 2), 0) / (cycleLengths.length - 1);
      const stdCycleLength = Math.sqrt(variance);

      // Calculate irregular cycles percentage (>7 days variation)
      const irregularCycles = cycleLengths.filter(length => Math.abs(length - avgCycleLength) > 7).length;
      const irregularCyclesPercent = (irregularCycles / cycleLengths.length) * 100;

      // Calculate menses length
      const mensesLengths = completedCycles.map(cycle => {
        const start = new Date(cycle.startDate.toDate ? cycle.startDate.toDate() : cycle.startDate);
        const end = new Date(cycle.endDate.toDate ? cycle.endDate.toDate() : cycle.endDate);
        return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      });
      const avgMensesLength = mensesLengths.reduce((a, b) => a + b, 0) / mensesLengths.length;

      // Calculate bleeding intensity
      const intensityValues = completedCycles
        .map(cycle => cycle.intensity)
        .filter(intensity => intensity && intensity >= 1 && intensity <= 5);
      const avgBleedingIntensity = intensityValues.length > 0 
        ? intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length 
        : 0;

      // Calculate unusual bleeding percentage
      const unusualBleeding = completedCycles.filter(cycle => {
        const mensesLength = Math.round((new Date(cycle.endDate.toDate ? cycle.endDate.toDate() : cycle.endDate) - new Date(cycle.startDate.toDate ? cycle.startDate.toDate() : cycle.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return mensesLength < 3 || mensesLength > 7 || (cycle.intensity && cycle.intensity >= 4);
      }).length;
      const unusualBleedingPercent = (unusualBleeding / completedCycles.length) * 100;

      // Estimate luteal phase and ovulation metrics
      const avgLutealPhase = 14; // Standard assumption
      const avgOvulationDay = avgCycleLength - avgLutealPhase;
      const ovulationVariability = stdCycleLength; // Simplified
      const shortLutealPercent = 0; // Would need ovulation tracking data

      const metrics = {
        // Calculated metrics
        avgCycleLength: parseFloat(avgCycleLength.toFixed(1)),
        avgCycleLengthPercent: parseFloat(((stdCycleLength / avgCycleLength) * 100).toFixed(1)),
        irregularCyclesPercent: parseFloat(irregularCyclesPercent.toFixed(1)),
        stdCycleLength: parseFloat(stdCycleLength.toFixed(1)),
        avgLutealPhase: avgLutealPhase,
        shortLutealPercent: shortLutealPercent,
        avgBleedingIntensity: parseFloat(avgBleedingIntensity.toFixed(1)),
        unusualBleedingPercent: parseFloat(unusualBleedingPercent.toFixed(1)),
        avgMensesLength: parseFloat(avgMensesLength.toFixed(1)),
        avgOvulationDay: parseFloat(avgOvulationDay.toFixed(1)),
        ovulationVariability: parseFloat(ovulationVariability.toFixed(1)),
        totalCycles: completedCycles.length,
        
        // Profile data
        age: parseFloat(profile.Age) || 0,
        bmi: parseFloat(profile.BMI) || 0,
        numberPregnancies: parseInt(profile.Numberpreg) || 0,
        numberAbortions: parseInt(profile.Abortions) || 0,
        ageAtFirstMenstruation: parseFloat(profile.AgeM) || 0,
        currentlyBreastfeeding: profile.Breastfeeding || false
      };

      // Save to database
      await saveAnalysisMetrics(user.uid, metrics);
      setAnalysisMetrics(metrics);
      
      // Run model predictions
      await runModelPredictions(metrics);
      
      // Reload analysis history
      const updatedAnalyses = await getAnalyses(user.uid);
      setAnalysisHistory(updatedAnalyses);
      
    } catch (error) {
      console.error('Error calculating metrics:', error);
      alert('Error calculating metrics. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleFeatureChange = (field, value) => {
    setUserFeatures(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const runDirectModelPredictions = async () => {
    setPredictionsLoading(true);
    try {
      // Prepare features for all three models
      const features = {
        // Risk Assessment Model Features
        AvgCycleLength: parseFloat(userFeatures.avgCycleLength) || 28,
        IrregularCyclesPercent: parseFloat(userFeatures.irregularCyclesPercent) || 0,
        StdCycleLength: parseFloat(userFeatures.stdCycleLength) || 2,
        AvgLutealPhase: parseFloat(userFeatures.avgLutealPhase) || 14,
        ShortLutealPercent: parseFloat(userFeatures.shortLutealPercent) || 0,
        AvgBleedingIntensity: parseFloat(userFeatures.avgBleedingIntensity) || 3,
        UnusualBleedingPercent: parseFloat(userFeatures.unusualBleedingPercent) || 0,
        AvgMensesLength: parseFloat(userFeatures.avgMensesLength) || 5,
        AvgOvulationDay: parseFloat(userFeatures.avgOvulationDay) || 14,
        OvulationVariability: parseFloat(userFeatures.ovulationVariability) || 1,
        Age: parseFloat(userFeatures.age) || 25,
        BMI: parseFloat(userFeatures.bmi) || 22,
        TotalCycles: parseFloat(userFeatures.totalCycles) || 12,
        
        // PRWI Model Additional Features
        Numberpreg: parseFloat(userFeatures.numberPregnancies) || 0,
        Abortions: parseFloat(userFeatures.numberAbortions) || 0,
        AgeM: parseFloat(userFeatures.ageAtFirstMenstruation) || 13,
        Breastfeeding: userFeatures.currentlyBreastfeeding ? 1 : 0
      };

      console.log('Sending user features to models:', features);

      const response = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features: features,
          models: ['all']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Model predictions received:', data);

      if (data.success) {
        setModelPredictions(data.results);
      } else {
        console.error('Model prediction failed:', data.error);
        setModelPredictions({ error: data.error });
      }
    } catch (error) {
      console.error('Error running model predictions:', error);
      setModelPredictions({ error: error.message });
    } finally {
      setPredictionsLoading(false);
    }
  };

  const runModelPredictions = async (metrics) => {
    if (!metrics) return;
    
    setPredictionsLoading(true);
    try {
      // Prepare features for all three models
      const features = {
        // Risk Assessment Model Features
        AvgCycleLength: metrics.avgCycleLength,
        IrregularCyclesPercent: metrics.irregularCyclesPercent,
        StdCycleLength: metrics.stdCycleLength,
        AvgLutealPhase: metrics.avgLutealPhase,
        ShortLutealPercent: metrics.shortLutealPercent,
        AvgBleedingIntensity: metrics.avgBleedingIntensity,
        UnusualBleedingPercent: metrics.unusualBleedingPercent,
        AvgMensesLength: metrics.avgMensesLength,
        AvgOvulationDay: metrics.avgOvulationDay,
        OvulationVariability: metrics.ovulationVariability,
        Age: metrics.age,
        BMI: metrics.bmi,
        TotalCycles: metrics.totalCycles,
        
        // PRWI Model Additional Features
        Numberpreg: metrics.numberPregnancies,
        Abortions: metrics.numberAbortions,
        AgeM: metrics.ageAtFirstMenstruation,
        Breastfeeding: metrics.currentlyBreastfeeding ? 1 : 0
      };

      console.log('Sending features to models:', features);

      const response = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features: features,
          models: ['all']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Model predictions received:', data);

      if (data.success) {
        setModelPredictions(data.results);
      } else {
        console.error('Model prediction failed:', data.error);
        setModelPredictions({ error: data.error });
      }
    } catch (error) {
      console.error('Error running model predictions:', error);
      setModelPredictions({ error: error.message });
    } finally {
      setPredictionsLoading(false);
    }
  };

  const getHealthScore = () => {
    if (!analysisMetrics) return 0;
    let score = 100;
    
    // Deduct points for irregularities
    if (analysisMetrics.irregularCyclesPercent > 20) score -= 20;
    if (analysisMetrics.avgCycleLength < 21 || analysisMetrics.avgCycleLength > 35) score -= 15;
    if (analysisMetrics.avgBleedingIntensity > 4) score -= 10;
    if (analysisMetrics.unusualBleedingPercent > 30) score -= 15;
    
    return Math.max(score, 0);
  };

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="analysis-container">
        <div className="no-user">Please log in to view analysis.</div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h1 className="analysis-title">
          <BarChart3 size={32} />
          Menstrual Health Analysis
        </h1>
        <p className="analysis-subtitle">
          Comprehensive insights into your menstrual wellness patterns
        </p>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <LineChart size={18} />
          Trends
        </button>
        <button 
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <Target size={18} />
          Detailed Metrics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={18} />
          History
        </button>
      </div>

      {/* Calculate Metrics Section */}
      <div className="quick-actions">
        <button 
          className="calculate-btn"
          onClick={calculateMetrics}
          disabled={calculating || cycles.length < 2}
        >
          {calculating ? (
            <>
              <RefreshCw size={18} className="spinning" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator size={18} />
              Calculate Metrics
            </>
          )}
        </button>
        
        <button 
          className="user-input-btn"
          onClick={() => setShowUserForm(!showUserForm)}
        >
          <User size={18} />
          {showUserForm ? 'Hide' : 'Manual'} Input
        </button>
        
        {cycles.length < 2 && (
          <div className="warning-message">
            <AlertCircle size={16} />
            Need at least 2 cycles for analysis
          </div>
        )}
      </div>

      {/* User Input Form */}
      {showUserForm && (
        <div className="user-input-form">
          <div className="form-header">
            <h3>
              <User size={24} />
              Manual Feature Input
            </h3>
            <p>Enter your information to get AI predictions directly</p>
          </div>
          
          <div className="form-sections">
            {/* Personal Information */}
            <div className="form-section">
              <h4>
                <User size={20} />
                Personal Information
              </h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    value={userFeatures.age}
                    onChange={(e) => handleFeatureChange('age', e.target.value)}
                    placeholder="25"
                    min="12"
                    max="60"
                  />
                </div>
                <div className="form-field">
                  <label>BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={userFeatures.bmi}
                    onChange={(e) => handleFeatureChange('bmi', e.target.value)}
                    placeholder="22.5"
                    min="15"
                    max="40"
                  />
                </div>
                <div className="form-field">
                  <label>Number of Pregnancies</label>
                  <input
                    type="number"
                    value={userFeatures.numberPregnancies}
                    onChange={(e) => handleFeatureChange('numberPregnancies', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-field">
                  <label>Number of Abortions</label>
                  <input
                    type="number"
                    value={userFeatures.numberAbortions}
                    onChange={(e) => handleFeatureChange('numberAbortions', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-field">
                  <label>Age at First Menstruation</label>
                  <input
                    type="number"
                    value={userFeatures.ageAtFirstMenstruation}
                    onChange={(e) => handleFeatureChange('ageAtFirstMenstruation', e.target.value)}
                    placeholder="13"
                    min="8"
                    max="18"
                  />
                </div>
                <div className="form-field checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={userFeatures.currentlyBreastfeeding}
                      onChange={(e) => handleFeatureChange('currentlyBreastfeeding', e.target.checked)}
                    />
                    Currently Breastfeeding
                  </label>
                </div>
              </div>
            </div>

            {/* Cycle Information */}
            <div className="form-section">
              <h4>
                <Calendar size={20} />
                Cycle Information
              </h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Average Cycle Length (days)</label>
                  <input
                    type="number"
                    value={userFeatures.avgCycleLength}
                    onChange={(e) => handleFeatureChange('avgCycleLength', e.target.value)}
                    placeholder="28"
                    min="20"
                    max="40"
                  />
                </div>
                <div className="form-field">
                  <label>Irregular Cycles (%)</label>
                  <input
                    type="number"
                    value={userFeatures.irregularCyclesPercent}
                    onChange={(e) => handleFeatureChange('irregularCyclesPercent', e.target.value)}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-field">
                  <label>Cycle Length Variation (days)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={userFeatures.stdCycleLength}
                    onChange={(e) => handleFeatureChange('stdCycleLength', e.target.value)}
                    placeholder="2.5"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-field">
                  <label>Average Luteal Phase (days)</label>
                  <input
                    type="number"
                    value={userFeatures.avgLutealPhase}
                    onChange={(e) => handleFeatureChange('avgLutealPhase', e.target.value)}
                    placeholder="14"
                    min="8"
                    max="20"
                  />
                </div>
                <div className="form-field">
                  <label>Short Luteal Phase (%)</label>
                  <input
                    type="number"
                    value={userFeatures.shortLutealPercent}
                    onChange={(e) => handleFeatureChange('shortLutealPercent', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-field">
                  <label>Average Menstruation Length (days)</label>
                  <input
                    type="number"
                    value={userFeatures.avgMensesLength}
                    onChange={(e) => handleFeatureChange('avgMensesLength', e.target.value)}
                    placeholder="5"
                    min="2"
                    max="10"
                  />
                </div>
                <div className="form-field">
                  <label>Bleeding Intensity (1-5)</label>
                  <input
                    type="number"
                    value={userFeatures.avgBleedingIntensity}
                    onChange={(e) => handleFeatureChange('avgBleedingIntensity', e.target.value)}
                    placeholder="3"
                    min="1"
                    max="5"
                  />
                </div>
                <div className="form-field">
                  <label>Unusual Bleeding (%)</label>
                  <input
                    type="number"
                    value={userFeatures.unusualBleedingPercent}
                    onChange={(e) => handleFeatureChange('unusualBleedingPercent', e.target.value)}
                    placeholder="5"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-field">
                  <label>Average Ovulation Day</label>
                  <input
                    type="number"
                    value={userFeatures.avgOvulationDay}
                    onChange={(e) => handleFeatureChange('avgOvulationDay', e.target.value)}
                    placeholder="14"
                    min="8"
                    max="25"
                  />
                </div>
                <div className="form-field">
                  <label>Ovulation Variability (days)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={userFeatures.ovulationVariability}
                    onChange={(e) => handleFeatureChange('ovulationVariability', e.target.value)}
                    placeholder="1.5"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="form-field">
                  <label>Total Cycles Tracked</label>
                  <input
                    type="number"
                    value={userFeatures.totalCycles}
                    onChange={(e) => handleFeatureChange('totalCycles', e.target.value)}
                    placeholder="12"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="predict-btn"
              onClick={runDirectModelPredictions}
              disabled={predictionsLoading}
            >
              {predictionsLoading ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Getting Predictions...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Get AI Predictions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && analysisMetrics && (
          <div className="overview-section">
            {/* Key Metrics Cards */}
            <div className="key-metrics-grid">
              <div className="key-metric-card">
                <div className="metric-icon cycle-icon">
                  <Calendar size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{analysisMetrics.avgCycleLength}</div>
                  <div className="metric-label">Avg Cycle (days)</div>
                  <div className="metric-status">
                    {analysisMetrics.avgCycleLength >= 21 && analysisMetrics.avgCycleLength <= 35 ? 
                      <CheckCircle size={16} className="status-good" /> : 
                      <AlertCircle size={16} className="status-warning" />
                    }
                  </div>
                </div>
              </div>

              <div className="key-metric-card">
                <div className="metric-icon bleeding-icon">
                  <Droplet size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{analysisMetrics.avgBleedingIntensity}/5</div>
                  <div className="metric-label">Bleeding Intensity</div>
                  <div className="metric-status">
                    {analysisMetrics.avgBleedingIntensity <= 3 ? 
                      <CheckCircle size={16} className="status-good" /> : 
                      <AlertCircle size={16} className="status-warning" />
                    }
                  </div>
                </div>
              </div>

              <div className="key-metric-card">
                <div className="metric-icon regularity-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{analysisMetrics.irregularCyclesPercent.toFixed(0)}%</div>
                  <div className="metric-label">Irregular Cycles</div>
                  <div className="metric-status">
                    {analysisMetrics.irregularCyclesPercent < 20 ? 
                      <CheckCircle size={16} className="status-good" /> : 
                      <AlertCircle size={16} className="status-warning" />
                    }
                  </div>
                </div>
              </div>

              <div className="key-metric-card">
                <div className="metric-icon cycles-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-value">{analysisMetrics.totalCycles}</div>
                  <div className="metric-label">Cycles Tracked</div>
                  <div className="metric-status">
                    <CheckCircle size={16} className="status-good" />
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Section - Remove this after fixing */}
            <div style={{background: '#f0f0f0', padding: '10px', margin: '10px 0', borderRadius: '5px'}}>
              <h4>🐛 Debug Info</h4>
              <p>modelPredictions exists: {modelPredictions ? 'YES' : 'NO'}</p>
              <p>predictionsLoading: {predictionsLoading ? 'YES' : 'NO'}</p>
              {modelPredictions && (
                <pre style={{fontSize: '12px', overflow: 'auto'}}>
                  {JSON.stringify(modelPredictions, null, 2)}
                </pre>
              )}
            </div>

            {/* Model Predictions Section */}
            {modelPredictions && (
              <div className="model-predictions-section">
                <h3 className="predictions-title">
                  <Brain size={24} />
                  AI Model Predictions
                </h3>
                
                {predictionsLoading ? (
                  <div className="predictions-loading">
                    <RefreshCw size={20} className="spinning" />
                    Running AI Analysis...
                  </div>
                ) : (
                  <div className="predictions-grid">
                    {/* Risk Assessment */}
                    {modelPredictions.risk_assessment && !modelPredictions.risk_assessment.error && (
                      <div className="prediction-card risk-card">
                        <div className="prediction-header">
                          <div className="prediction-icon risk-icon">
                            <AlertCircle size={24} />
                          </div>
                          <div className="prediction-info">
                            <div className="prediction-title">Risk Assessment</div>
                            <div className={`prediction-value risk-${modelPredictions.risk_assessment.risk_level?.toLowerCase()}`}>
                              {modelPredictions.risk_assessment.risk_level} Risk
                            </div>
                          </div>
                        </div>
                        <div className="prediction-details">
                          {modelPredictions.risk_assessment.probabilities && (
                            <div className="risk-probabilities">
                              <div className="prob-item">
                                <span>Low:</span> {(modelPredictions.risk_assessment.probabilities.low * 100).toFixed(1)}%
                              </div>
                              <div className="prob-item">
                                <span>Medium:</span> {(modelPredictions.risk_assessment.probabilities.medium * 100).toFixed(1)}%
                              </div>
                              <div className="prob-item">
                                <span>High:</span> {(modelPredictions.risk_assessment.probabilities.high * 100).toFixed(1)}%
                              </div>
                            </div>
                          )}
                          <div className="prediction-interpretation">
                            {modelPredictions.risk_assessment.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PRWI Score */}
                    {modelPredictions.prwi_score && !modelPredictions.prwi_score.error && (
                      <div className="prediction-card prwi-card">
                        <div className="prediction-header">
                          <div className="prediction-icon prwi-icon">
                            <Target size={24} />
                          </div>
                          <div className="prediction-info">
                            <div className="prediction-title">PRWI Score</div>
                            <div className="prediction-value">
                              {modelPredictions.prwi_score.prwi_score?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="prediction-details">
                          <div className="prediction-interpretation">
                            {modelPredictions.prwi_score.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cluster Deviation */}
                    {modelPredictions.clusterdev && !modelPredictions.clusterdev.error && (
                      <div className="prediction-card cluster-card">
                        <div className="prediction-header">
                          <div className="prediction-icon cluster-icon">
                            <Activity size={24} />
                          </div>
                          <div className="prediction-info">
                            <div className="prediction-title">Pattern Analysis</div>
                            <div className="prediction-value">
                              Cluster {modelPredictions.clusterdev.cluster}
                            </div>
                          </div>
                        </div>
                        <div className="prediction-details">
                          <div className="deviation-score">
                            Deviation Score: {modelPredictions.clusterdev.deviation_score?.toFixed(1)}%
                          </div>
                          <div className="prediction-interpretation">
                            {modelPredictions.clusterdev.interpretation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {modelPredictions.error && (
                      <div className="prediction-error">
                        <AlertCircle size={20} />
                        <span>Model Error: {modelPredictions.error}</span>
                      </div>
                    )}
                    
                    {/* Individual Model Errors */}
                    {modelPredictions.risk_assessment?.error && (
                      <div className="prediction-error">
                        <AlertCircle size={20} />
                        <span>Risk Assessment Error: {modelPredictions.risk_assessment.error}</span>
                      </div>
                    )}
                    {modelPredictions.prwi_score?.error && (
                      <div className="prediction-error">
                        <AlertCircle size={20} />
                        <span>PRWI Error: {modelPredictions.prwi_score.error}</span>
                      </div>
                    )}
                    {modelPredictions.clusterdev?.error && (
                      <div className="prediction-error">
                        <AlertCircle size={20} />
                        <span>Cluster Analysis Error: {modelPredictions.clusterdev.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="trends-section">
            {/* Charts Section */}
            <div className="charts-section">
              <div className="chart-container">
                <TrendChart cycles={cycles} />
              </div>
              {analysisMetrics && (
                <>
                  <div className="chart-container">
                    <BarChart 
                      title="Cycle Patterns" 
                      data={[
                        { label: 'Avg Length', value: analysisMetrics.avgCycleLength, color: '#b8396b' },
                        { label: 'Std Dev', value: analysisMetrics.stdCycleLength, color: '#d97298' },
                        { label: 'Menses', value: analysisMetrics.avgMensesLength, color: '#e595b4' },
                        { label: 'Luteal', value: analysisMetrics.avgLutealPhase, color: '#a87ec0' }
                      ]}
                    />
                  </div>
                  <div className="chart-container">
                    <BarChart 
                      title="Health Metrics Comparison" 
                      data={[
                        { label: 'Cycle Regularity', value: 100 - analysisMetrics.irregularCyclesPercent, color: '#4CAF50' },
                        { label: 'Bleeding Normal', value: 100 - analysisMetrics.unusualBleedingPercent, color: '#2196F3' },
                        { label: 'Cycle Consistency', value: Math.max(0, 100 - (analysisMetrics.stdCycleLength * 10)), color: '#FF9800' }
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Detailed Metrics Tab */}
        {activeTab === 'metrics' && analysisMetrics && (
          <div className="detailed-metrics-section">
            <h2 className="section-title">
              <Activity size={24} />
              Detailed Analysis Metrics
            </h2>
          <div className="metrics-grid">
            {/* Cycle Metrics */}
            <div className="metric-category">
              <h3 className="category-title">
                <Calendar size={20} />
                Cycle Patterns
              </h3>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-label">Average Cycle Length</div>
                  <div className="metric-value">{analysisMetrics.avgCycleLength} days</div>
                  <div className="metric-range">Typical: 21-35 days</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Cycle Length Variation</div>
                  <div className="metric-value">{analysisMetrics.avgCycleLengthPercent}%</div>
                  <div className="metric-range">Lower is more regular</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Irregular Cycles</div>
                  <div className="metric-value">{analysisMetrics.irregularCyclesPercent}%</div>
                  <div className="metric-range">Range: 0-100%</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Standard Deviation</div>
                  <div className="metric-value">{analysisMetrics.stdCycleLength} days</div>
                  <div className="metric-range">Typical: 0-10 days</div>
                </div>
              </div>
            </div>

            {/* Bleeding Metrics */}
            <div className="metric-category">
              <h3 className="category-title">
                <Droplet size={20} />
                Bleeding Patterns
              </h3>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-label">Average Menses Length</div>
                  <div className="metric-value">{analysisMetrics.avgMensesLength} days</div>
                  <div className="metric-range">Typical: 3-7 days</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Average Bleeding Intensity</div>
                  <div className="metric-value">{analysisMetrics.avgBleedingIntensity}/5</div>
                  <div className="metric-range">1=light, 5=heavy</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Unusual Bleeding</div>
                  <div className="metric-value">{analysisMetrics.unusualBleedingPercent}%</div>
                  <div className="metric-range">Range: 0-100%</div>
                </div>
              </div>
            </div>

            {/* Ovulation Metrics */}
            <div className="metric-category">
              <h3 className="category-title">
                <Heart size={20} />
                Ovulation & Luteal Phase
              </h3>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-label">Average Luteal Phase</div>
                  <div className="metric-value">{analysisMetrics.avgLutealPhase} days</div>
                  <div className="metric-range">Typical: 12-16 days</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Short Luteal Phase</div>
                  <div className="metric-value">{analysisMetrics.shortLutealPercent}%</div>
                  <div className="metric-range">Range: 0-100%</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Average Ovulation Day</div>
                  <div className="metric-value">Day {analysisMetrics.avgOvulationDay}</div>
                  <div className="metric-range">Typical: Day 11-21</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Ovulation Variability</div>
                  <div className="metric-value">{analysisMetrics.ovulationVariability} days</div>
                  <div className="metric-range">Typical: 0-5 days</div>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="metric-category">
              <h3 className="category-title">
                <User size={20} />
                Personal Information
              </h3>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-label">Age</div>
                  <div className="metric-value">{analysisMetrics.age} years</div>
                  <div className="metric-range">Range: 12-60 years</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">BMI</div>
                  <div className="metric-value">{analysisMetrics.bmi}</div>
                  <div className="metric-range">Typical: 18.5-35</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Cycles Tracked</div>
                  <div className="metric-value">{analysisMetrics.totalCycles}</div>
                  <div className="metric-range">Minimum: 3 cycles</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Number of Pregnancies</div>
                  <div className="metric-value">{analysisMetrics.numberPregnancies}</div>
                  <div className="metric-range">Range: 0 or more</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Number of Abortions</div>
                  <div className="metric-value">{analysisMetrics.numberAbortions}</div>
                  <div className="metric-range">Range: 0 or more</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Age at First Menstruation</div>
                  <div className="metric-value">{analysisMetrics.ageAtFirstMenstruation} years</div>
                  <div className="metric-range">Typical: 9-16 years</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Currently Breastfeeding</div>
                  <div className="metric-value">{analysisMetrics.currentlyBreastfeeding ? 'Yes' : 'No'}</div>
                  <div className="metric-range">Yes/No</div>
                </div>
              </div>
            </div>
          </div>
          
          {analysisMetrics.lastCalculated && (
            <div className="last-updated">
              <Clock size={16} />
              Last calculated: {new Date(analysisMetrics.lastCalculated.toDate()).toLocaleString()}
            </div>
          )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && analysisHistory.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">
              <TrendingUp size={24} />
              Analysis History
            </h2>
            <div className="history-list">
              {analysisHistory.map((analysis, index) => (
                <div key={analysis.id || index} className="history-item">
                  <div className="history-header">
                    <div className="history-date">
                      {analysis.createdAt ? new Date(analysis.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                    </div>
                    {analysis.riskCategory && (
                      <div className={`risk-badge risk-${analysis.riskCategory.toLowerCase()}`}>
                        {analysis.riskCategory}
                      </div>
                    )}
                  </div>
                  {analysis.prwiScore && (
                    <div className="analysis-score">
                      PWRI Score: {analysis.prwiScore.toFixed(2)}
                    </div>
                  )}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="recommendations">
                      <strong>Recommendations:</strong>
                      <ul>
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {!analysisMetrics && cycles.length >= 2 && (
          <div className="no-metrics">
            <Brain size={48} />
            <h3>Ready for Analysis</h3>
            <p>You have {cycles.length} cycles tracked. Click "Calculate Metrics" to generate your comprehensive analysis.</p>
          </div>
        )}

        {cycles.length < 2 && (
          <div className="no-data">
            <Calendar size={48} />
            <h3>Not Enough Data</h3>
            <p>Please track at least 2 complete menstrual cycles to generate analysis metrics.</p>
            <p>Visit the Calendar page to start tracking your cycles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
