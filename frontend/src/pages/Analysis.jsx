import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Doughnut, Bar, PolarArea } from 'react-chartjs-2';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, saveAnalysisMetrics, getAnalyses, getCycles, addAnalysis } from '../services/firestore';
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
  Shield,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Download,
  FileText,
  PieChart,
  Sparkles,
  Award,
  Droplet,
  Moon,
  Sun
} from 'lucide-react';
import '../styles/Analysis.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  RadialLinearScale
);

const Analysis = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [analysisMetrics, setAnalysisMetrics] = useState(null);
  const [modelPredictions, setModelPredictions] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        loadUserData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    try {
      const [profile, userCycles, analyses] = await Promise.all([
        getUserProfile(uid),
        getCycles(uid),
        getAnalyses(uid)
      ]);
      
      setUserProfile(profile);
      setCycles(userCycles || []);
      setAnalysisHistory(analyses || []);
      
      // Always recalculate metrics from current cycles - no cached data
      if (userCycles && userCycles.length >= 2 && profile) {
        await recalculateMetrics(uid, profile, userCycles);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const recalculateMetrics = async (uid, profile, userCycles) => {
    try {
      const userData = {
        age: parseFloat(profile?.profile?.Age) || 25,
        bmi: parseFloat(profile?.profile?.BMI) || 22.0,
        numberPregnancies: parseInt(profile?.profile?.Numberpreg) || 0,
        numberAbortions: parseInt(profile?.profile?.Abortions) || 0,
        ageAtFirstMenstruation: parseFloat(profile?.profile?.AgeM) || 13,
        currentlyBreastfeeding: profile?.profile?.Breastfeeding || false
      };
      
      const cyclesData = userCycles.map(cycle => ({
        startDate: cycle.startDate?.toDate ? cycle.startDate.toDate().toISOString() : cycle.startDate,
        endDate: cycle.endDate?.toDate ? cycle.endDate.toDate().toISOString() : cycle.endDate,
        intensity: cycle.intensity || 3,
        monthKey: cycle.monthKey
      }));
      
      const response = await fetch(`${API_BASE_URL}/api/calculate-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: userData, cycles: cyclesData })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.calculated_metrics) {
        setAnalysisMetrics(data.calculated_metrics);
        await saveAnalysisMetrics(uid, data.calculated_metrics);
      }
    } catch (error) {
      console.error('Error recalculating metrics:', error);
    }
  };

  const prepareFeatures = (metrics, userProfileData) => {
    /**
     * Consolidate metrics and user profile into properly formatted features
     * Ensures all data is in PascalCase and has correct types
     */
    if (!metrics || !userProfileData) {
      console.warn('Missing metrics or userProfile for feature preparation');
      return null;
    }

    // Helper to safely get value with fallback
    const getValue = (obj, key, defaultVal) => {
      return obj?.[key] !== undefined && obj?.[key] !== null ? obj[key] : defaultVal;
    };

    const features = {
      // Cycle metrics (from calculated metrics - handle both camelCase and PascalCase)
      AvgCycleLength: parseFloat(getValue(metrics, 'AvgCycleLength', getValue(metrics, 'avgCycleLength', 28.0))),
      IrregularCyclesPercent: parseFloat(getValue(metrics, 'IrregularCyclesPercent', getValue(metrics, 'irregularCyclesPercent', 0.0))),
      StdCycleLength: parseFloat(getValue(metrics, 'StdCycleLength', getValue(metrics, 'stdCycleLength', 2.0))),
      AvgLutealPhase: parseFloat(getValue(metrics, 'AvgLutealPhase', getValue(metrics, 'avgLutealPhase', 14.0))),
      ShortLutealPercent: parseFloat(getValue(metrics, 'ShortLutealPercent', getValue(metrics, 'shortLutealPercent', 0.0))),
      AvgBleedingIntensity: parseFloat(getValue(metrics, 'AvgBleedingIntensity', getValue(metrics, 'avgBleedingIntensity', 3.0))),
      UnusualBleedingPercent: parseFloat(getValue(metrics, 'UnusualBleedingPercent', getValue(metrics, 'unusualBleedingPercent', 0.0))),
      AvgMensesLength: parseFloat(getValue(metrics, 'AvgMensesLength', getValue(metrics, 'avgMensesLength', 5.0))),
      AvgOvulationDay: parseFloat(getValue(metrics, 'AvgOvulationDay', getValue(metrics, 'avgOvulationDay', 14.0))),
      OvulationVariability: parseFloat(getValue(metrics, 'OvulationVariability', getValue(metrics, 'ovulationVariability', 1.0))),
      TotalCycles: parseInt(getValue(metrics, 'TotalCycles', getValue(metrics, 'totalCycles', 6))),

      // User profile data (from userProfile - consistent source)
      Age: parseInt(getValue(userProfileData, 'age', 25)),
      BMI: parseFloat(getValue(userProfileData, 'bmi', 22.0)),
      Numberpreg: parseInt(getValue(userProfileData, 'numberPregnancies', 0)),
      Abortions: parseInt(getValue(userProfileData, 'numberAbortions', 0)),
      AgeM: parseInt(getValue(userProfileData, 'ageAtFirstMenstruation', 13)),
      Breastfeeding: getValue(userProfileData, 'currentlyBreastfeeding', false) ? 1 : 0
    };

    console.log('DEBUG: prepareFeatures input:', { metrics, userProfileData });
    console.log('DEBUG: prepareFeatures output:', features);
    console.log('DEBUG: Feature validation check:');
    Object.entries(features).forEach(([key, value]) => {
      console.log(`  ${key}: ${value} (${typeof value}) - ${isNaN(value) ? 'INVALID' : 'valid'}`);
    });

    return features;
  };

  const calculateMetricsFromBackend = async () => {
    if (!user || !userProfile || !cycles || cycles.length < 2) {
      alert('Need at least 2 complete cycles to run analysis');
      return;
    }
    
    setCalculating(true);
    try {
      // Recalculate metrics from fresh cycle data
      await recalculateMetrics(user.uid, userProfile, cycles);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Run model predictions with the fresh metrics
      if (analysisMetrics) {
        await runModelPredictions(analysisMetrics, userProfile);
      }
      
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

  const runModelPredictions = async (metrics, userProfileData) => {
    if (!metrics || !userProfileData) {
      console.warn('Missing metrics or userProfile for predictions');
      return;
    }

    try {
      console.log('Preparing features for model predictions...');
      
      // Use consolidated feature preparation function
      const features = prepareFeatures(metrics, userProfileData);
      
      if (!features) {
        console.error('Failed to prepare features');
        return;
      }
      
      console.log('Features prepared:', features);
      console.log('Feature count:', Object.keys(features).length);
      console.log('Feature types:', Object.entries(features).map(([k, v]) => `${k}: ${typeof v}`));

      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: features, models: ['all'] })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        console.error('Error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          received_features: errorData.received_features,
          required_features: errorData.required_features
        });
        alert(`API Error: ${errorData.error}\n\nReceived features: ${errorData.received_features?.length || 0}\nRequired features: ${errorData.required_features?.length || 0}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Model predictions response:', data);

      if (data.success) {
        setModelPredictions(data.results);
        return data.results;
      } else {
        console.error('Prediction failed:', data.error);
      }
    } catch (error) {
      console.error('Error running model predictions:', error);
    }
  };

  const saveAnalysisToDatabase = async (metrics, predictions) => {
    if (!user || !metrics) return;
    
    try {
      const analysisData = {
        inputFeatures: { ...metrics, calculatedAt: new Date().toISOString() },
        modelsRun: ['risk_assessment', 'prwi_score', 'clusterdev'],
        riskCategory: predictions.risk_assessment?.risk_level || null,
        riskProbabilities: predictions.risk_assessment?.probabilities || null,
        prwiScore: predictions.prwi_score?.prwi_score || null,
        clusterLabel: predictions.clusterdev?.cluster || null,
        deviationScore: predictions.clusterdev?.deviation_score || null,
        recommendations: [
          predictions.risk_assessment?.interpretation,
          predictions.prwi_score?.interpretation,
          predictions.clusterdev?.interpretation
        ].filter(Boolean),
        confidence: 'high'
      };
      
      await addAnalysis(user.uid, analysisData);
    } catch (error) {
      console.error('Error saving analysis to database:', error);
    }
  };

  const getHealthScore = () => {
    if (!analysisMetrics) return 0;
    let score = 100;
    
    if (analysisMetrics.irregularCyclesPercent > 20) score -= 20;
    if (analysisMetrics.avgCycleLength < 21 || analysisMetrics.avgCycleLength > 35) score -= 15;
    if (analysisMetrics.avgBleedingIntensity > 4) score -= 10;
    if (analysisMetrics.unusualBleedingPercent > 30) score -= 15;
    
    return Math.max(score, 0);
  };

  if (loading) {
    return (
      <div className="analysis-loading">
        <motion.div 
          className="loading-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={48} className="sparkle-icon" />
          <h2>Loading Your Dashboard</h2>
          <p>Preparing your personalized health insights...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required">
        <motion.div 
          className="auth-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Shield size={64} className="auth-icon" />
          <h2>Sign In Required</h2>
          <p>Please sign in to access your personalized health dashboard</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="analysis-dashboard">
      {/* Hero Header */}
      <motion.header 
        className="hero-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <div className="hero-left">
            <motion.div 
              className="hero-icon"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Heart size={48} />
            </motion.div>
            <div className="hero-text">
              <h1>AI Health Dashboard</h1>
              <p>Your personal menstrual wellness companion</p>
            </div>
          </div>
          
          <div className="hero-right">
            <div className="hero-stats">
              <div className="stat-pill">
                <Calendar size={18} />
                <span>{cycles.length} Cycles</span>
              </div>
              <div className="stat-pill">
                <Brain size={18} />
                <span>{analysisHistory.length} Analyses</span>
              </div>
            </div>
            
            <motion.button 
              className="analyze-button"
              onClick={calculateMetricsFromBackend}
              disabled={calculating || cycles.length < 2}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {calculating ? (
                <>
                  <RefreshCw size={20} className="spinning" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Run Analysis
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <motion.nav 
        className="main-navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {[
          { id: 'overview', label: 'Overview & AI Insights', icon: Brain },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'metrics', label: 'Metrics', icon: BarChart3 },
          { id: 'history', label: 'History', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </motion.nav>

      {/* Main Content */}
      <div className="main-content">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="tab-content"
            >
              {null}

              {/* AI Model Insights - Professional Glass Cards */}
              {modelPredictions ? (
                <motion.div 
                  className="insights-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, staggerChildren: 0.1 }}
                  style={{ marginTop: '40px' }}
                >
                  {/* PRWI Wellness Score - Featured Card */}
                  {modelPredictions.prwi_score && !modelPredictions.prwi_score.error && (
                    <motion.div 
                      className="glass-card featured prwi-card"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <div className="card-header">
                        <div className="icon-wrapper prwi">
                          <Sparkles size={28} />
                        </div>
                        <div>
                          <h3>Wellness Score</h3>
                          <p className="card-subtitle">Overall Health Index</p>
                        </div>
                      </div>
                      
                      <div className="score-display">
                        <div className="score-circle">
                          <svg viewBox="0 0 100 100" style={{ width: '140px', height: '140px' }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(184, 163, 255, 0.2)" strokeWidth="6" />
                            <circle 
                              cx="50" cy="50" r="45" fill="none" 
                              stroke={100 - modelPredictions.prwi_score.prwi_score < 40 ? '#9de6ba' : 100 - modelPredictions.prwi_score.prwi_score < 70 ? '#ffb899' : '#ffaac5'}
                              strokeWidth="6"
                              strokeDasharray={`${2 * Math.PI * 45 * (100 - (modelPredictions.prwi_score.prwi_score || 0)) / 100} ${2 * Math.PI * 45}`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                              style={{ transition: 'stroke-dasharray 0.5s ease' }}
                            />
                          </svg>
                          <div className="score-value">{(100 - (modelPredictions.prwi_score.prwi_score || 0)).toFixed(0)}%</div>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <p className="interpretation">{modelPredictions.prwi_score.interpretation}</p>
                        <div className="metrics-preview">
                          <div className="metric-preview-item">
                            <span className="metric-label">Avg Cycle</span>
                            <span className="metric-val">{(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0).toFixed(0)} days</span>
                          </div>
                          <div className="metric-preview-item">
                            <span className="metric-label">Regularity</span>
                            <span className="metric-val">{(100 - (analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0)).toFixed(0)}%</span>
                          </div>
                          <div className="metric-preview-item">
                            <span className="metric-label">Flow</span>
                            <span className="metric-val">{(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0).toFixed(1)}/5</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Risk Assessment Card */}
                  {modelPredictions.risk_assessment && !modelPredictions.risk_assessment.error && (
                    <motion.div 
                      className="glass-card"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <div className="card-header">
                        <div className="icon-wrapper risk">
                          <Shield size={28} />
                        </div>
                        <div>
                          <h3>Risk Assessment</h3>
                          <p className="card-subtitle">Health Status</p>
                        </div>
                      </div>
                      
                      <div className="risk-badge" style={{
                        background: modelPredictions.risk_assessment.risk_level === 'Low' ? 'linear-gradient(135deg, #9de6ba, #7dd9a8)' : 
                                   modelPredictions.risk_assessment.risk_level === 'Medium' ? 'linear-gradient(135deg, #ffb899, #ffa87d)' : 
                                   'linear-gradient(135deg, #ffaac5, #ff98b3)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        marginBottom: '16px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                      }}>
                        {modelPredictions.risk_assessment.risk_level} Risk
                      </div>
                      
                      <div className="probability-bars">
                        {Object.entries(modelPredictions.risk_assessment.probabilities || {}).map(([key, value]) => (
                          <div key={key} className="probability-item">
                            <div className="prob-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                            <div className="prob-bar">
                              <motion.div 
                                className="prob-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${(value * 100)}%` }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                style={{
                                  background: key === 'high' ? '#ffaac5' : key === 'medium' ? '#ffb899' : '#9de6ba'
                                }}
                              />
                            </div>
                            <div className="prob-value">{(value * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="interpretation">{modelPredictions.risk_assessment.interpretation}</p>
                    </motion.div>
                  )}

                  {/* Cluster Pattern Card */}
                  {modelPredictions.clusterdev && !modelPredictions.clusterdev.error && (
                    <motion.div 
                      className="glass-card"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <div className="card-header">
                        <div className="icon-wrapper pattern">
                          <PieChart size={28} />
                        </div>
                        <div>
                          <h3>Health Pattern</h3>
                          <p className="card-subtitle">Cluster Analysis</p>
                        </div>
                      </div>
                      
                      <div className="cluster-display">
                        <div className="cluster-number">Group {modelPredictions.clusterdev.cluster}</div>
                        <div className="deviation-score">
                          <motion.div 
                            className="score-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${modelPredictions.clusterdev.deviation_score}%` }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            style={{
                              background: modelPredictions.clusterdev.deviation_score < 40 ? 'linear-gradient(90deg, #9de6ba, #7dd9a8)' :
                                         modelPredictions.clusterdev.deviation_score < 70 ? 'linear-gradient(90deg, #ffb899, #ffa87d)' :
                                         'linear-gradient(90deg, #ffaac5, #ff98b3)'
                            }}
                          />
                        </div>
                        <div className="score-label">Deviation: {modelPredictions.clusterdev.deviation_score?.toFixed(1)}%</div>
                      </div>
                      
                      <div className="stats-grid">
                        <div className="stat-box">
                          <span className="stat-label">Similarity</span>
                          <span className="stat-value">{(100 - modelPredictions.clusterdev.deviation_score).toFixed(1)}%</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Pattern</span>
                          <span className="stat-value">Group {modelPredictions.clusterdev.cluster}</span>
                        </div>
                      </div>
                      
                      <p className="interpretation">{modelPredictions.clusterdev.interpretation}</p>
                    </motion.div>
                  )}
                </motion.div>
              ) : null}

              {/* Empty State - Only show if no data at all */}
              {!analysisMetrics && !modelPredictions && (
                <div className="empty-state">
                  <Brain size={64} />
                  <h3>No Data Available</h3>
                  <p>Run an analysis to see your health overview and AI insights</p>
                  <button 
                    className="primary-btn"
                    onClick={calculateMetricsFromBackend}
                    disabled={calculating || cycles.length < 2}
                  >
                    {calculating ? 'Analyzing...' : 'Run First Analysis'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="tab-content"
            >
              {analysisMetrics && cycles.length >= 2 ? (
                <div className="trends-grid">
                  {/* Cycle Length Trend */}
                  <motion.div 
                    className="chart-card large"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3>Cycle Length Trend Over Time</h3>
                    <div className="chart-wrapper">
                      <CycleTrendChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Menses Duration Trend */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3>Menses Duration Trend</h3>
                    <div className="chart-wrapper">
                      <MensesDurationChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Flow Intensity */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3>Flow Intensity Distribution</h3>
                    <div className="chart-wrapper">
                      <FlowIntensityChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Cycle Distribution */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3>Cycle Length Distribution</h3>
                    <div className="chart-wrapper">
                      <CycleDistributionChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Symptoms Intensity Trend */}
                  <motion.div 
                    className="chart-card large"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3>Symptoms Intensity Over Time</h3>
                    <div className="chart-wrapper">
                      <SymptomsIntensityChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Symptom Frequency */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3>Symptom Frequency</h3>
                    <div className="chart-wrapper">
                      <SymptomFrequencyChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Average Symptom Severity */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h3>Average Symptom Severity</h3>
                    <div className="chart-wrapper">
                      <SymptomSeverityChart cycles={cycles} />
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="empty-state">
                  <TrendingUp size={64} />
                  <h3>Insufficient Data</h3>
                  <p>Track at least 2 cycles to see trends</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="tab-content">
              {analysisMetrics ? (
                <div className="metrics-list">
                  {/* Model Predictions Only */}
                  <div className="metrics-section">
                    <h3>Health Assessment</h3>
                    <div className="metrics-row">
                      {modelPredictions?.risk_assessment && (
                        <MetricItem 
                          label="Risk Level"
                          value={modelPredictions.risk_assessment.risk_level}
                          status={modelPredictions.risk_assessment.risk_level === 'Low' ? 'good' : modelPredictions.risk_assessment.risk_level === 'Medium' ? 'warning' : 'critical'}
                        />
                      )}
                      {modelPredictions?.clusterdev && (
                        <MetricItem 
                          label="Cluster Status"
                          value={`Cluster ${modelPredictions.clusterdev.cluster}`}
                          status={modelPredictions.clusterdev.deviation_score < 40 ? 'good' : 'warning'}
                        />
                      )}
                      {modelPredictions?.prwi_score && (
                        <MetricItem 
                          label="PRWI Score"
                          value={`${modelPredictions.prwi_score.prwi_score.toFixed(1)}`}
                          status={modelPredictions.prwi_score.prwi_score < 30 ? 'good' : modelPredictions.prwi_score.prwi_score < 60 ? 'warning' : 'critical'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <BarChart3 size={64} />
                  <h3>No Metrics Available</h3>
                  <p>Run an analysis to see detailed metrics</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="tab-content"
            >
              {analysisHistory.length > 0 ? (
                <div className="history-list">
                  {analysisHistory.map((analysis, index) => (
                    <motion.div 
                      key={analysis.id || index}
                      className="history-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="history-header">
                        <div className="history-date">
                          <Clock size={16} />
                          {analysis.createdAt ? new Date(analysis.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                        </div>
                        {analysis.riskCategory && (
                          <div className={`risk-badge ${analysis.riskCategory.toLowerCase()}`}>
                            {analysis.riskCategory}
                          </div>
                        )}
                      </div>
                      <div className="history-content">
                        {analysis.prwiScore && (
                          <div className="history-score">
                            <Target size={16} />
                            <span>Score: {analysis.prwiScore.toFixed(1)}</span>
                          </div>
                        )}
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <div className="history-recommendations">
                            <p>{analysis.recommendations[0]}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Clock size={64} />
                  <h3>No History Yet</h3>
                  <p>Your analysis history will appear here</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Chart Components
const RiskChart = ({ probabilities }) => {
  if (!probabilities) return null;

  const data = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [
        probabilities.low * 100,
        probabilities.medium * 100,
        probabilities.high * 100
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.toFixed(1)}%`
        }
      }
    }
  };

  return <Doughnut data={data} options={options} />;
};

const CycleTrendChart = ({ cycles }) => {
  if (!cycles || cycles.length < 2) return null;

  const cycleLengths = [];
  const labels = [];

  for (let i = 0; i < cycles.length - 1; i++) {
    const start = new Date(cycles[i].startDate?.toDate ? cycles[i].startDate.toDate() : cycles[i].startDate);
    const nextStart = new Date(cycles[i + 1].startDate?.toDate ? cycles[i + 1].startDate.toDate() : cycles[i + 1].startDate);
    const length = Math.round((nextStart - start) / (1000 * 60 * 60 * 24));
    cycleLengths.push(length);
    labels.push(`Cycle ${i + 1}`);
  }

  const data = {
    labels,
    datasets: [{
      label: 'Cycle Length (days)',
      data: cycleLengths,
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#8B5CF6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
      }
    }
  };

  return <Line data={data} options={options} />;
};

const CycleDistributionChart = ({ cycles }) => {
  if (!cycles || cycles.length < 2) return null;

  const cycleLengths = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const start = new Date(cycles[i].startDate?.toDate ? cycles[i].startDate.toDate() : cycles[i].startDate);
    const nextStart = new Date(cycles[i + 1].startDate?.toDate ? cycles[i + 1].startDate.toDate() : cycles[i + 1].startDate);
    const length = Math.round((nextStart - start) / (1000 * 60 * 60 * 24));
    cycleLengths.push(length);
  }

  const distribution = cycleLengths.reduce((acc, length) => {
    const range = length < 25 ? 'Short' : length > 35 ? 'Long' : 'Normal';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(distribution),
    datasets: [{
      data: Object.values(distribution),
      backgroundColor: ['#EF4444', '#10B981', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15 } }
    }
  };

  return <Doughnut data={data} options={options} />;
};

const FlowIntensityChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  const intensityData = cycles.reduce((acc, cycle) => {
    const intensity = cycle.intensity || 3;
    const label = intensity <= 2 ? 'Light' : intensity <= 3 ? 'Normal' : 'Heavy';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(intensityData),
    datasets: [{
      data: Object.values(intensityData),
      backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15 } }
    }
  };

  return <PolarArea data={data} options={options} />;
};

const MensesDurationChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  const labels = [];
  const durations = [];

  cycles.forEach((cycle, index) => {
    if (cycle.startDate && cycle.endDate) {
      const start = new Date(cycle.startDate?.toDate ? cycle.startDate.toDate() : cycle.startDate);
      const end = new Date(cycle.endDate?.toDate ? cycle.endDate.toDate() : cycle.endDate);
      const duration = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      labels.push(`Cycle ${index + 1}`);
      durations.push(duration);
    }
  });

  const data = {
    labels,
    datasets: [{
      label: 'Menses Duration (days)',
      data: durations,
      backgroundColor: 'rgba(255, 170, 197, 0.6)',
      borderColor: 'rgba(255, 170, 197, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        title: { display: true, text: 'Days' }
      },
      x: {
        grid: { display: false },
      }
    }
  };

  return <Line data={data} options={options} />;
};

const SymptomsIntensityChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  const labels = [];
  const crampsData = [];
  const fatigueData = [];
  const backPainData = [];

  cycles.forEach((cycle, index) => {
    if (cycle.symptoms) {
      labels.push(`Cycle ${index + 1}`);
      crampsData.push(cycle.symptoms.cramps || 0);
      fatigueData.push(cycle.symptoms.fatigue || 0);
      backPainData.push(cycle.symptoms.backPain || 0);
    }
  });

  if (labels.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No symptom data available</div>;

  const data = {
    labels,
    datasets: [
      {
        label: 'Cramps',
        data: crampsData,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Fatigue',
        data: fatigueData,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Back Pain',
        data: backPainData,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        title: { display: true, text: 'Intensity (0-5)' }
      },
      x: {
        grid: { display: false },
      }
    }
  };

  return <Line data={data} options={options} />;
};

const SymptomFrequencyChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  const symptomCounts = {
    'Headache': 0,
    'Bloating': 0,
    'Nausea': 0,
    'Acne': 0,
  };

  cycles.forEach(cycle => {
    if (cycle.symptoms) {
      if (cycle.symptoms.headache) symptomCounts['Headache']++;
      if (cycle.symptoms.bloating) symptomCounts['Bloating']++;
      if (cycle.symptoms.nausea) symptomCounts['Nausea']++;
      if (cycle.symptoms.acne) symptomCounts['Acne']++;
    }
  });

  const data = {
    labels: Object.keys(symptomCounts),
    datasets: [{
      label: 'Frequency',
      data: Object.values(symptomCounts),
      backgroundColor: [
        'rgba(139, 92, 246, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(245, 158, 11, 0.6)',
      ],
      borderColor: [
        'rgba(139, 92, 246, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
      ],
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        title: { display: true, text: 'Number of Cycles' }
      },
      x: {
        grid: { display: false },
      }
    }
  };

  return <Bar data={data} options={options} />;
};

const SymptomSeverityChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  let totalCramps = 0, totalFatigue = 0, totalBackPain = 0, totalMood = 0, totalCravings = 0;
  let count = 0;

  cycles.forEach(cycle => {
    if (cycle.symptoms) {
      totalCramps += cycle.symptoms.cramps || 0;
      totalFatigue += cycle.symptoms.fatigue || 0;
      totalBackPain += cycle.symptoms.backPain || 0;
      totalMood += cycle.symptoms.mood || 0;
      totalCravings += cycle.symptoms.cravings || 0;
      count++;
    }
  });

  if (count === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No symptom data available</div>;

  const data = {
    labels: ['Cramps', 'Fatigue', 'Back Pain', 'Mood', 'Cravings'],
    datasets: [{
      label: 'Average Severity',
      data: [
        (totalCramps / count).toFixed(1),
        (totalFatigue / count).toFixed(1),
        (totalBackPain / count).toFixed(1),
        (totalMood / count).toFixed(1),
        (totalCravings / count).toFixed(1),
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(236, 72, 153, 0.6)',
      ],
      borderWidth: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: { stepSize: 1 },
      }
    }
  };

  return <PolarArea data={data} options={options} />;
};

const MetricItem = ({ label, value, status }) => (
  <div className="metric-item">
    <div className="metric-item-label">{label}</div>
    <div className="metric-item-value">{value}</div>
    <div className={`metric-item-status ${status}`}>
      {status === 'good' ? <CheckCircle size={14} /> : status === 'warning' ? <AlertCircle size={14} /> : null}
    </div>
  </div>
);

export default Analysis;