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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, saveAnalysisMetrics, getAnalyses, getCycles } from '../services/firestore';
import {
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
  RefreshCw,
  Download,
  PieChart,
  Sparkles
} from 'lucide-react';
import '../styles/Analysis.css';
import jsPDF from 'jspdf';
// ============================================================================
// API Configuration
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// ============================================================================
// Chart.js Setup
// ============================================================================
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ============================================================================
// Utility Components
// ============================================================================

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
};

// ============================================================================
// PDF Generation Function
// ============================================================================
const generatePDF = async (userProfile, analysisMetrics, modelPredictions) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('Menstrual Wellness Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Section 1: Overview
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('1. Wellness Overview', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    if (modelPredictions?.prwi_score) {
      const wellnessScore = (100 - (modelPredictions.prwi_score.prwi_score || 0)).toFixed(0);
      pdf.text(`Wellness Score: ${wellnessScore}%`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Interpretation: ${modelPredictions.prwi_score.interpretation}`, 25, yPosition, { maxWidth: pageWidth - 50 });
      yPosition += 15;
    }

    // Section 2: Key Metrics
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('2. Key Metrics', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    if (analysisMetrics) {
      const metrics = [
        [`Avg Cycle Length: ${(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0).toFixed(0)} days`],
        [`Regularity: ${(100 - (analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0)).toFixed(0)}%`],
        [`Avg Bleeding Intensity: ${(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0).toFixed(1)}/5`],
        [`Avg Menses Length: ${(analysisMetrics?.AvgMensesLength || analysisMetrics?.avgMensesLength || 0).toFixed(1)} days`],
        [`Avg Ovulation Day: Day ${(analysisMetrics?.AvgOvulationDay || analysisMetrics?.avgOvulationDay || 0).toFixed(1)}`],
        [`Ovulation Variability: ${(analysisMetrics?.OvulationVariability || analysisMetrics?.ovulationVariability || 0).toFixed(1)} days`],
      ];

      metrics.forEach(metric => {
        pdf.text(metric[0], 25, yPosition);
        yPosition += 8;
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }

    yPosition += 5;

    // Section 3: Health Assessment
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('3. Health Assessment', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    if (modelPredictions?.risk_assessment) {
      pdf.text(`Risk Level: ${modelPredictions.risk_assessment.risk_level}`, 25, yPosition);
      yPosition += 8;
    }
    if (modelPredictions?.clusterdev) {
      pdf.text(`Cluster Status: Cluster ${modelPredictions.clusterdev.cluster}`, 25, yPosition);
      yPosition += 8;
    }
    if (modelPredictions?.prwi_score) {
      pdf.text(`PRWI Score: ${modelPredictions.prwi_score.prwi_score.toFixed(1)}`, 25, yPosition);
      yPosition += 8;
    }

    // Footer
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'italic');
    pdf.text('This report is generated by AI Menstrual Wellness Assistant', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Download PDF
    pdf.save('Menstrual_Wellness_Report.pdf');
    alert('PDF Report generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};

// ============================================================================
// Main Analysis Component
// ============================================================================

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

  /**
   * Prepare features for model predictions
   * Consolidates metrics and user profile into properly formatted features
   * Ensures all data is in PascalCase and has correct types
   */
  const prepareFeatures = (metrics, userProfileData) => {
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
      const features = prepareFeatures(metrics, userProfileData);
      
      if (!features) {
        console.error('Failed to prepare features');
        return;
      }

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
              {/* AI Model Insights - Professional Glass Cards */}
              {modelPredictions ? (
                <motion.div 
                  className="insights-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, staggerChildren: 0.1 }}
                  style={{ marginTop: '40px' }}
                >
                  {/* PRWI Wellness Score - Split into 2 Cards */}
                  {modelPredictions.prwi_score && !modelPredictions.prwi_score.error && (
                    <>
                      {/* Left Card - Score & Risk Statement */}
                      <motion.div 
                        className="glass-card wellness-left"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className="score-display-simple">
                          <div className="score-value-large">
                            <AnimatedCounter value={Math.round(100 - (modelPredictions.prwi_score.prwi_score || 0))} duration={1.5} />%
                          </div>
                          <p className="wellness-label">Wellness Score</p>
                        </div>
                        
                        <div className="card-content">
                          <p className="interpretation">{modelPredictions.prwi_score.interpretation}</p>
                        </div>
                      </motion.div>

                      {/* Right Card - Metrics Preview */}
                      <motion.div 
                        className="glass-card wellness-right"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
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
                      </motion.div>
                    </>
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

                  {/* Flow Intensity & Cycle Distribution - Combined Text Card */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3>Distribution Summary</h3>
                    <div className="distribution-summary">
                      <div className="summary-item">
                        <h4>Flow Intensity</h4>
                        <p>Average bleeding intensity: <strong>{(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0).toFixed(1)}/5</strong></p>
                        <p className="summary-text">
                          {(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0) < 2 ? 'Light flow' : 
                           (analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0) < 3.5 ? 'Moderate flow' : 
                           'Heavy flow'}
                        </p>
                      </div>
                      <div className="summary-item">
                        <h4>Cycle Length</h4>
                        <p>Average cycle: <strong>{(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0).toFixed(0)} days</strong></p>
                        <p className="summary-text">
                          {(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0) < 21 ? 'Shorter than typical' : 
                           (analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0) > 35 ? 'Longer than typical' : 
                           'Within normal range'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="empty-state">
                  <TrendingUp size={64} />
                  <h3>No Trend Data Available</h3>
                  <p>Run an analysis to see trends</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="tab-content">
              {analysisMetrics ? (
                <div className="metrics-list">
                  {/* Calculated Metrics */}
                  <div className="metrics-section">
                    <h3>Cycle Metrics</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Avg Cycle Length"
                        value={`${(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0).toFixed(1)} days`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Cycle Length Std Dev"
                        value={`${(analysisMetrics?.StdCycleLength || analysisMetrics?.stdCycleLength || 0).toFixed(1)} days`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Irregular Cycles"
                        value={`${(analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0).toFixed(1)}%`}
                        status={(analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0) < 20 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Total Cycles"
                        value={analysisMetrics?.TotalCycles || analysisMetrics?.totalCycles || 0}
                        status="neutral"
                      />
                    </div>
                  </div>

                  {/* Menstrual Metrics */}
                  <div className="metrics-section">
                    <h3>Menstrual Metrics</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Avg Menses Length"
                        value={`${(analysisMetrics?.AvgMensesLength || analysisMetrics?.avgMensesLength || 0).toFixed(1)} days`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Avg Bleeding Intensity"
                        value={`${(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0).toFixed(1)}/5`}
                        status={(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0) <= 3 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Unusual Bleeding"
                        value={`${(analysisMetrics?.UnusualBleedingPercent || analysisMetrics?.unusualBleedingPercent || 0).toFixed(1)}%`}
                        status={(analysisMetrics?.UnusualBleedingPercent || analysisMetrics?.unusualBleedingPercent || 0) < 30 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>

                  {/* Ovulation Metrics */}
                  <div className="metrics-section">
                    <h3>Ovulation Metrics</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Avg Ovulation Day"
                        value={`Day ${(analysisMetrics?.AvgOvulationDay || analysisMetrics?.avgOvulationDay || 0).toFixed(1)}`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Ovulation Variability"
                        value={`${(analysisMetrics?.OvulationVariability || analysisMetrics?.ovulationVariability || 0).toFixed(1)} days`}
                        status={(analysisMetrics?.OvulationVariability || analysisMetrics?.ovulationVariability || 0) <= 2 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Avg Luteal Phase"
                        value={`${(analysisMetrics?.AvgLutealPhase || analysisMetrics?.avgLutealPhase || 0).toFixed(1)} days`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Short Luteal Phase"
                        value={`${(analysisMetrics?.ShortLutealPercent || analysisMetrics?.shortLutealPercent || 0).toFixed(1)}%`}
                        status={(analysisMetrics?.ShortLutealPercent || analysisMetrics?.shortLutealPercent || 0) < 20 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>

                  {/* Model Predictions */}
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

                  {/* Generate Report Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{ marginTop: '40px', textAlign: 'center' }}
                  >
                    <button
                      onClick={() => generatePDF(userProfile, analysisMetrics, modelPredictions)}
                      style={{
                        padding: '14px 32px',
                        background: 'linear-gradient(135deg, #b8a3ff, #ffaac5)',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(184, 163, 255, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontFamily: "'Times New Roman', Times, serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-4px) scale(1.02)';
                        e.target.style.boxShadow = '0 12px 32px rgba(184, 163, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0) scale(1)';
                        e.target.style.boxShadow = '0 8px 24px rgba(184, 163, 255, 0.3)';
                      }}
                    >
                      <Download size={20} />
                      Generate PDF Report
                    </button>
                  </motion.div>                </div>
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

// ============================================================================
// Chart Components
// ============================================================================

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

// ============================================================================
// Metric Display Component
// ============================================================================

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