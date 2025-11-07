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
      
      if (profile?.analysisMetrics) {
        setAnalysisMetrics(profile.analysisMetrics);
        await runModelPredictions(profile.analysisMetrics);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const calculateMetricsFromBackend = async () => {
    if (!user || !userProfile) return;
    
    setCalculating(true);
    try {
      const profile = userProfile.profile || {};
      
      const userData = {
        age: parseFloat(profile.Age) || 25,
        bmi: parseFloat(profile.BMI) || 22.0,
        numberPregnancies: parseInt(profile.Numberpreg) || 0,
        numberAbortions: parseInt(profile.Abortions) || 0,
        ageAtFirstMenstruation: parseFloat(profile.AgeM) || 13,
        currentlyBreastfeeding: profile.Breastfeeding || false
      };
      
      const cyclesData = cycles.map(cycle => ({
        startDate: cycle.startDate?.toDate ? cycle.startDate.toDate().toISOString() : cycle.startDate,
        endDate: cycle.endDate?.toDate ? cycle.endDate.toDate().toISOString() : cycle.endDate,
        intensity: cycle.intensity || 3
      }));
      
      if (cyclesData.length < 2) {
        alert('Need at least 2 complete cycles to calculate metrics');
        setCalculating(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/calculate-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: userData, cycles: cyclesData })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        const calculatedMetrics = data.calculated_metrics;
        await saveAnalysisMetrics(user.uid, calculatedMetrics);
        setAnalysisMetrics(calculatedMetrics);
        
        if (data.model_predictions && !data.model_predictions.error) {
          setModelPredictions(data.model_predictions);
          await saveAnalysisToDatabase(calculatedMetrics, data.model_predictions);
        }
        
        const updatedAnalyses = await getAnalyses(user.uid);
        setAnalysisHistory(updatedAnalyses);
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
      alert('Error calculating metrics. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const runModelPredictions = async (metrics) => {
    if (!metrics) return;
    
    try {
      const features = {
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
        Numberpreg: metrics.numberPregnancies,
        Abortions: metrics.numberAbortions,
        AgeM: metrics.ageAtFirstMenstruation,
        Breastfeeding: metrics.currentlyBreastfeeding ? 1 : 0
      };

      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: features, models: ['all'] })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        setModelPredictions(data.results);
        return data.results;
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
              {analysisMetrics ? (
                <div className="overview-grid">
                  {/* Overall Health Score Card - Using PRWI Wellness Score */}
                  <motion.div 
                    className="score-card featured"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="card-header">
                      <Award size={24} />
                      <h3>Overall Health Score</h3>
                    </div>
                    <div className="score-display">
                      <div className="score-circle">
                        <svg viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                          <circle 
                            cx="60" cy="60" r="54" fill="none" 
                            stroke={modelPredictions?.prwi_score?.prwi_score >= 80 ? '#10B981' : modelPredictions?.prwi_score?.prwi_score >= 60 ? '#F59E0B' : '#EF4444'}
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 54 * (modelPredictions?.prwi_score?.prwi_score || 0) / 100} ${2 * Math.PI * 54}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="score-value">{modelPredictions?.prwi_score?.prwi_score?.toFixed(0) || '--'}</div>
                      </div>
                      <div className="score-label">
                        {modelPredictions?.prwi_score?.prwi_score >= 80 ? 'Excellent' : modelPredictions?.prwi_score?.prwi_score >= 60 ? 'Good' : modelPredictions?.prwi_score?.prwi_score ? 'Needs Attention' : 'Run Analysis'}
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Metrics */}
                  <motion.div 
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="metric-icon cycle">
                      <Calendar size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">{analysisMetrics.avgCycleLength}</div>
                      <div className="metric-label">Avg Cycle Length (days)</div>
                      <div className={`metric-status ${analysisMetrics.avgCycleLength >= 21 && analysisMetrics.avgCycleLength <= 35 ? 'good' : 'warning'}`}>
                        {analysisMetrics.avgCycleLength >= 21 && analysisMetrics.avgCycleLength <= 35 ? 'Normal Range' : 'Outside Range'}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="metric-icon regularity">
                      <Activity size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">{(100 - analysisMetrics.irregularCyclesPercent).toFixed(0)}%</div>
                      <div className="metric-label">Cycle Regularity</div>
                      <div className={`metric-status ${analysisMetrics.irregularCyclesPercent < 20 ? 'good' : 'warning'}`}>
                        {analysisMetrics.irregularCyclesPercent < 20 ? 'Highly Regular' : 'Variable'}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="metric-icon flow">
                      <Droplet size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">{analysisMetrics.avgBleedingIntensity.toFixed(1)}/5</div>
                      <div className="metric-label">Avg Flow Intensity</div>
                      <div className={`metric-status ${analysisMetrics.avgBleedingIntensity >= 2 && analysisMetrics.avgBleedingIntensity <= 4 ? 'good' : 'warning'}`}>
                        {analysisMetrics.avgBleedingIntensity >= 2 && analysisMetrics.avgBleedingIntensity <= 4 ? 'Normal' : 'Atypical'}
                      </div>
                    </div>
                  </motion.div>

                  {/* Cluster Pattern Card */}
                  {modelPredictions?.clusterdev && !modelPredictions.clusterdev.error && (
                    <motion.div 
                      className="metric-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="metric-icon" style={{ background: 'linear-gradient(135deg, var(--pastel-peach), var(--pastel-purple))' }}>
                        <PieChart size={24} />
                      </div>
                      <div className="metric-info">
                        <div className="metric-value">Group {modelPredictions.clusterdev.cluster}</div>
                        <div className="metric-label">Health Pattern</div>
                        <div className="metric-status good">
                          {(100 - modelPredictions.clusterdev.deviation_score).toFixed(0)}% Similar
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : null}

              {/* AI Insights Section */}
              {modelPredictions ? (
                <div className="insights-grid" style={{ marginTop: '30px' }}>
                  {/* Risk Assessment */}
                  {modelPredictions.risk_assessment && !modelPredictions.risk_assessment.error && (
                    <motion.div 
                      className="insight-card risk"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="card-badge">Risk Assessment</div>
                      <div className="card-body">
                        <div className="insight-header">
                          <Shield size={32} />
                          <div className={`risk-level ${modelPredictions.risk_assessment.risk_level?.toLowerCase()}`}>
                            {modelPredictions.risk_assessment.risk_level} Risk
                          </div>
                        </div>
                        <div className="insight-chart">
                          <RiskChart probabilities={modelPredictions.risk_assessment.probabilities} />
                        </div>
                        <div className="insight-text">
                          <p>{modelPredictions.risk_assessment.interpretation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Pattern Analysis - Cluster Data */}
                  {modelPredictions.clusterdev && !modelPredictions.clusterdev.error && (
                    <motion.div 
                      className="insight-card pattern"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="card-badge">Health Pattern Cluster</div>
                      <div className="card-body">
                        <div className="insight-header">
                          <PieChart size={32} />
                          <div className="cluster-label">Group {modelPredictions.clusterdev.cluster}</div>
                        </div>
                        <div className="pattern-stats">
                          <div className="stat-item">
                            <span className="stat-label">Similarity</span>
                            <span className="stat-value">{(100 - modelPredictions.clusterdev.deviation_score).toFixed(1)}%</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Deviation Score</span>
                            <span className="stat-value">{modelPredictions.clusterdev.deviation_score?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="insight-text">
                          <p>{modelPredictions.clusterdev.interpretation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
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
                  {/* Cycle Metrics */}
                  <div className="metrics-section">
                    <h3>Cycle Metrics</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Average Cycle Length"
                        value={`${analysisMetrics.avgCycleLength} days`}
                        status={analysisMetrics.avgCycleLength >= 21 && analysisMetrics.avgCycleLength <= 35 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Cycle Variability (Std Dev)"
                        value={`${analysisMetrics.stdCycleLength.toFixed(1)} days`}
                        status={analysisMetrics.stdCycleLength < 3 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Irregular Cycles"
                        value={`${analysisMetrics.irregularCyclesPercent.toFixed(1)}%`}
                        status={analysisMetrics.irregularCyclesPercent < 20 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Total Cycles Tracked"
                        value={analysisMetrics.totalCycles}
                        status="neutral"
                      />
                    </div>
                  </div>

                  {/* Flow/Bleeding Metrics */}
                  <div className="metrics-section">
                    <h3>Flow & Bleeding Metrics</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Average Menses Duration"
                        value={`${analysisMetrics.avgMensesLength.toFixed(1)} days`}
                        status={analysisMetrics.avgMensesLength >= 3 && analysisMetrics.avgMensesLength <= 7 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Average Bleeding Intensity"
                        value={`${analysisMetrics.avgBleedingIntensity.toFixed(1)}/5`}
                        status={analysisMetrics.avgBleedingIntensity >= 2 && analysisMetrics.avgBleedingIntensity <= 4 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Unusual Bleeding Events"
                        value={`${analysisMetrics.unusualBleedingPercent.toFixed(1)}%`}
                        status={analysisMetrics.unusualBleedingPercent < 30 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>

                  {/* Ovulation & Luteal Phase Metrics */}
                  <div className="metrics-section">
                    <h3>Ovulation & Luteal Phase</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Average Ovulation Day"
                        value={`Day ${analysisMetrics.avgOvulationDay.toFixed(1)}`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Ovulation Variability"
                        value={`${analysisMetrics.ovulationVariability.toFixed(1)} days`}
                        status={analysisMetrics.ovulationVariability < 3 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Average Luteal Phase"
                        value={`${analysisMetrics.avgLutealPhase} days`}
                        status={analysisMetrics.avgLutealPhase >= 12 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Short Luteal Phase"
                        value={`${analysisMetrics.shortLutealPercent.toFixed(1)}%`}
                        status={analysisMetrics.shortLutealPercent < 20 ? 'good' : 'warning'}
                      />
                    </div>
                  </div>

                  {/* Personal Health Data */}
                  <div className="metrics-section">
                    <h3>Personal Health Information</h3>
                    <div className="metrics-row">
                      <MetricItem 
                        label="Age"
                        value={`${analysisMetrics.age} years`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="BMI (Body Mass Index)"
                        value={analysisMetrics.bmi.toFixed(1)}
                        status={analysisMetrics.bmi >= 18.5 && analysisMetrics.bmi <= 24.9 ? 'good' : 'warning'}
                      />
                      <MetricItem 
                        label="Age at First Menstruation"
                        value={`${analysisMetrics.ageAtFirstMenstruation} years`}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Number of Pregnancies"
                        value={analysisMetrics.numberPregnancies}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Number of Abortions"
                        value={analysisMetrics.numberAbortions}
                        status="neutral"
                      />
                      <MetricItem 
                        label="Currently Breastfeeding"
                        value={analysisMetrics.currentlyBreastfeeding ? 'Yes' : 'No'}
                        status="neutral"
                      />
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