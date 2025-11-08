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
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
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
  Legend,
  RadialLinearScale,
  Filler
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
const generatePDF = async (userProfile, analysisMetrics, modelPredictions, cycles) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Set pastel pink background for all pages
    const addBackgroundColor = () => {
      pdf.setFillColor(255, 238, 245); // Light pastel pink
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    // Add background to first page
    addBackgroundColor();

    // Helper function to check and add page
    const checkPageBreak = (spaceNeeded = 25) => {
      if (yPosition + spaceNeeded > pageHeight - margin) {
        pdf.addPage();
        addBackgroundColor();
        yPosition = margin;
      }
    };

    // Helper function to add section
    const addSection = (title, content) => {
      checkPageBreak(30);
      pdf.setFont('Times New Roman', 'bold');
      pdf.setFontSize(14);
      pdf.text(title, margin, yPosition);
      yPosition += 10;

      pdf.setFont('Times New Roman', 'normal');
      pdf.setFontSize(10);
      content.forEach(line => {
        checkPageBreak(8);
        pdf.text(line, margin + 5, yPosition);
        yPosition += 7;
      });
      yPosition += 5;
    };

    // TITLE PAGE
    pdf.setFont('Times New Roman', 'bold');
    pdf.setFontSize(28);
    pdf.text('Menstrual Wellness', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    pdf.text('Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    pdf.setFont('Times New Roman', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // SECTION 0: USER INFORMATION
    const userContent = [];
    if (userProfile) {
      if (userProfile.firstName) userContent.push(`First Name: ${userProfile.firstName}`);
      if (userProfile.lastName) userContent.push(`Last Name: ${userProfile.lastName}`);
      if (userProfile.name) userContent.push(`Full Name: ${userProfile.name}`);
      if (userProfile.email) userContent.push(`Email: ${userProfile.email}`);
      if (userProfile.phone) userContent.push(`Phone: ${userProfile.phone}`);
      if (userProfile.age) userContent.push(`Age: ${userProfile.age} years`);
      if (userProfile.bmi) userContent.push(`BMI: ${userProfile.bmi.toFixed(1)}`);
      if (userProfile.height) userContent.push(`Height: ${userProfile.height} cm`);
      if (userProfile.weight) userContent.push(`Weight: ${userProfile.weight} kg`);
      if (userProfile.ageAtFirstMenstruation) userContent.push(`Age at First Menstruation: ${userProfile.ageAtFirstMenstruation} years`);
      if (userProfile.numberPregnancies !== undefined) userContent.push(`Number of Pregnancies: ${userProfile.numberPregnancies}`);
      if (userProfile.numberAbortions !== undefined) userContent.push(`Number of Abortions: ${userProfile.numberAbortions}`);
      if (userProfile.currentlyBreastfeeding !== undefined) userContent.push(`Currently Breastfeeding: ${userProfile.currentlyBreastfeeding ? 'Yes' : 'No'}`);
      if (userProfile.medicalHistory) userContent.push(`Medical History: ${userProfile.medicalHistory}`);
      if (userProfile.medications) userContent.push(`Current Medications: ${userProfile.medications}`);
      if (userProfile.allergies) userContent.push(`Allergies: ${userProfile.allergies}`);
    }
    if (userContent.length > 0) {
      addSection('USER INFORMATION', userContent);
    }

    // SECTION 1: WELLNESS OVERVIEW
    const overviewContent = [];
    if (modelPredictions?.prwi_score) {
      const wellnessScore = (100 - (modelPredictions.prwi_score.prwi_score || 0)).toFixed(0);
      overviewContent.push(`Wellness Score: ${wellnessScore}%`);
      overviewContent.push(`Interpretation: ${modelPredictions.prwi_score.interpretation}`);
    }
    if (overviewContent.length > 0) {
      addSection('1. WELLNESS OVERVIEW', overviewContent);
    }

    // SECTION 2: CYCLE METRICS (All from Metrics tab)
    const cycleContent = [];
    if (analysisMetrics) {
      cycleContent.push(`Average Cycle Length: ${(analysisMetrics?.AvgCycleLength || analysisMetrics?.avgCycleLength || 0).toFixed(1)} days`);
      cycleContent.push(`Cycle Length Std Dev: ${(analysisMetrics?.StdCycleLength || analysisMetrics?.stdCycleLength || 0).toFixed(1)} days`);
      cycleContent.push(`Irregular Cycles: ${(analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0).toFixed(1)}%`);
      cycleContent.push(`Regularity: ${(100 - (analysisMetrics?.IrregularCyclesPercent || analysisMetrics?.irregularCyclesPercent || 0)).toFixed(0)}%`);
      cycleContent.push(`Total Cycles Tracked: ${analysisMetrics?.TotalCycles || analysisMetrics?.totalCycles || 0}`);
    }
    if (cycleContent.length > 0) {
      addSection('2. CYCLE METRICS', cycleContent);
    }

    // SECTION 3: BLEEDING METRICS
    const bleedingContent = [];
    if (analysisMetrics) {
      bleedingContent.push(`Average Menses Length: ${(analysisMetrics?.AvgMensesLength || analysisMetrics?.avgMensesLength || 0).toFixed(1)} days`);
      bleedingContent.push(`Average Bleeding Intensity: ${(analysisMetrics?.AvgBleedingIntensity || analysisMetrics?.avgBleedingIntensity || 0).toFixed(1)}/5`);
      bleedingContent.push(`Unusual Bleeding: ${(analysisMetrics?.UnusualBleedingPercent || analysisMetrics?.unusualBleedingPercent || 0).toFixed(1)}%`);
    }
    if (bleedingContent.length > 0) {
      addSection('3. BLEEDING METRICS', bleedingContent);
    }

    // SECTION 4: OVULATION & LUTEAL PHASE
    const ovulationContent = [];
    if (analysisMetrics) {
      ovulationContent.push(`Average Ovulation Day: Day ${(analysisMetrics?.AvgOvulationDay || analysisMetrics?.avgOvulationDay || 0).toFixed(1)}`);
      ovulationContent.push(`Ovulation Variability: ${(analysisMetrics?.OvulationVariability || analysisMetrics?.ovulationVariability || 0).toFixed(1)} days`);
      ovulationContent.push(`Average Luteal Phase: ${(analysisMetrics?.AvgLutealPhase || analysisMetrics?.avgLutealPhase || 0).toFixed(1)} days`);
      ovulationContent.push(`Short Luteal Phase: ${(analysisMetrics?.ShortLutealPercent || analysisMetrics?.shortLutealPercent || 0).toFixed(1)}%`);
    }
    if (ovulationContent.length > 0) {
      addSection('4. OVULATION & LUTEAL PHASE', ovulationContent);
    }

    // SECTION 5: SYMPTOM ANALYSIS (From Trends tab)
    const symptomContent = [];
    if (cycles && cycles.length > 0) {
      let totalCramps = 0, totalFatigue = 0, totalBackPain = 0;
      let headacheCount = 0, bloatingCount = 0, nauseaCount = 0, acneCount = 0;

      cycles.forEach((cycle) => {
        const symptoms = cycle.symptoms || {};
        totalCramps += symptoms.cramps || 0;
        totalFatigue += symptoms.fatigue || 0;
        totalBackPain += symptoms.backPain || 0;
        if (symptoms.headache) headacheCount++;
        if (symptoms.bloating) bloatingCount++;
        if (symptoms.nausea) nauseaCount++;
        if (symptoms.acne) acneCount++;
      });

      const cycleCount = cycles.length;
      symptomContent.push('Intensity-Based Symptoms:');
      symptomContent.push(`  • Average Cramps: ${(totalCramps / cycleCount).toFixed(1)}/5`);
      symptomContent.push(`  • Average Fatigue: ${(totalFatigue / cycleCount).toFixed(1)}/5`);
      symptomContent.push(`  • Average Back Pain: ${(totalBackPain / cycleCount).toFixed(1)}/5`);
      symptomContent.push('');
      symptomContent.push('Toggle Symptoms Frequency:');
      symptomContent.push(`  • Headache: ${((headacheCount / cycleCount) * 100).toFixed(0)}%`);
      symptomContent.push(`  • Bloating: ${((bloatingCount / cycleCount) * 100).toFixed(0)}%`);
      symptomContent.push(`  • Nausea: ${((nauseaCount / cycleCount) * 100).toFixed(0)}%`);
      symptomContent.push(`  • Acne: ${((acneCount / cycleCount) * 100).toFixed(0)}%`);
    }
    if (symptomContent.length > 0) {
      addSection('5. SYMPTOM ANALYSIS', symptomContent);
    }

    // SECTION 6: HEALTH ASSESSMENT
    const assessmentContent = [];
    if (modelPredictions?.risk_assessment) {
      assessmentContent.push(`Risk Level: ${modelPredictions.risk_assessment.risk_level}`);
      const probs = modelPredictions.risk_assessment.probabilities || {};
      assessmentContent.push(`  • Low Risk: ${((probs.low || 0) * 100).toFixed(1)}%`);
      assessmentContent.push(`  • Medium Risk: ${((probs.medium || 0) * 100).toFixed(1)}%`);
      assessmentContent.push(`  • High Risk: ${((probs.high || 0) * 100).toFixed(1)}%`);
      assessmentContent.push(`Assessment: ${modelPredictions.risk_assessment.interpretation}`);
    }
    if (assessmentContent.length > 0) {
      addSection('6. HEALTH ASSESSMENT', assessmentContent);
    }

    // SECTION 7: HEALTH PATTERN
    const patternContent = [];
    if (modelPredictions?.clusterdev) {
      patternContent.push(`Health Pattern Cluster: ${modelPredictions.clusterdev.cluster}`);
      patternContent.push(`Deviation Score: ${modelPredictions.clusterdev.deviation_score?.toFixed(1)}%`);
      patternContent.push(`Pattern Analysis: ${modelPredictions.clusterdev.interpretation}`);
    }
    if (patternContent.length > 0) {
      addSection('7. HEALTH PATTERN', patternContent);
    }

    // FOOTER
    checkPageBreak(15);
    pdf.setFont('Times New Roman', 'italic');
    pdf.setFontSize(9);
    pdf.text('This comprehensive report is generated by AI Menstrual Wellness Assistant', pageWidth / 2, pageHeight - 10, { align: 'center' });

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
                    data-chart="cycle-trend"
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
                    data-chart="menses-duration"
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

                  {/* Symptom Intensity Trends */}
                  <motion.div 
                    className="chart-card large"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    data-chart="symptom-intensity"
                  >
                    <h3>Symptom Intensity Trends</h3>
                    <div className="chart-wrapper">
                      <SymptomIntensityChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Symptom Frequency Overview & Radar Chart */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    data-chart="symptom-frequency"
                  >
                    <h3>Symptom Frequency</h3>
                    <div className="chart-wrapper">
                      <SymptomFrequencyChart cycles={cycles} />
                    </div>
                  </motion.div>

                  {/* Symptom Severity Radar */}
                  <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    data-chart="symptom-radar"
                  >
                    <h3>Symptom Severity Profile</h3>
                    <div className="chart-wrapper">
                      <SymptomRadarChart cycles={cycles} />
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
                      onClick={() => generatePDF(userProfile, analysisMetrics, modelPredictions, cycles)}
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

// ============================================================================
// Symptom Chart Components
// ============================================================================

const SymptomIntensityChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  // Extract intensity-based symptoms: cramps, fatigue, backPain
  const labels = [];
  const crampsData = [];
  const fatigueData = [];
  const backPainData = [];

  cycles.forEach((cycle, index) => {
    labels.push(`Cycle ${index + 1}`);
    
    const symptoms = cycle.symptoms || {};
    crampsData.push(symptoms.cramps || 0);
    fatigueData.push(symptoms.fatigue || 0);
    backPainData.push(symptoms.backPain || 0);
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Cramps',
        data: crampsData,
        borderColor: '#ff6b8a',
        backgroundColor: 'rgba(255, 107, 138, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff6b8a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Fatigue',
        data: fatigueData,
        borderColor: '#ffb899',
        backgroundColor: 'rgba(255, 184, 153, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffb899',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Back Pain',
        data: backPainData,
        borderColor: '#ff93a3',
        backgroundColor: 'rgba(255, 147, 163, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff93a3',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
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

  // Count occurrence of toggle symptoms: headache, bloating, nausea, acne
  const symptomCounts = {
    headache: 0,
    bloating: 0,
    nausea: 0,
    acne: 0
  };

  cycles.forEach((cycle) => {
    const symptoms = cycle.symptoms || {};
    if (symptoms.headache) symptomCounts.headache++;
    if (symptoms.bloating) symptomCounts.bloating++;
    if (symptoms.nausea) symptomCounts.nausea++;
    if (symptoms.acne) symptomCounts.acne++;
  });

  const totalCycles = cycles.length;
  const frequencyPercentages = {
    headache: (symptomCounts.headache / totalCycles) * 100,
    bloating: (symptomCounts.bloating / totalCycles) * 100,
    nausea: (symptomCounts.nausea / totalCycles) * 100,
    acne: (symptomCounts.acne / totalCycles) * 100
  };

  const data = {
    labels: ['Headache', 'Bloating', 'Nausea', 'Acne'],
    datasets: [{
      label: 'Frequency (%)',
      data: [frequencyPercentages.headache, frequencyPercentages.bloating, frequencyPercentages.nausea, frequencyPercentages.acne],
      backgroundColor: [
        'rgba(184, 163, 255, 0.6)',
        'rgba(153, 213, 255, 0.6)',
        'rgba(157, 230, 186, 0.6)',
        'rgba(255, 184, 153, 0.6)'
      ],
      borderColor: [
        '#b8a3ff',
        '#99d5ff',
        '#9de6ba',
        '#ffb899'
      ],
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      y: {
        grid: { display: false },
      }
    }
  };

  return <Line data={data} options={options} />;
};

const SymptomRadarChart = ({ cycles }) => {
  if (!cycles || cycles.length === 0) return null;

  // Calculate average intensity for all symptoms
  let totalCramps = 0;
  let totalFatigue = 0;
  let totalBackPain = 0;
  let totalHeadache = 0;
  let totalBloating = 0;
  let totalNausea = 0;
  let totalAcne = 0;
  let headacheCount = 0;
  let bloatingCount = 0;
  let nauseaCount = 0;
  let acneCount = 0;

  cycles.forEach((cycle) => {
    const symptoms = cycle.symptoms || {};
    
    // Intensity symptoms
    totalCramps += symptoms.cramps || 0;
    totalFatigue += symptoms.fatigue || 0;
    totalBackPain += symptoms.backPain || 0;
    
    // Toggle symptoms (count as 5 if present, 0 if not)
    if (symptoms.headache) {
      totalHeadache += 5;
      headacheCount++;
    }
    if (symptoms.bloating) {
      totalBloating += 5;
      bloatingCount++;
    }
    if (symptoms.nausea) {
      totalNausea += 5;
      nauseaCount++;
    }
    if (symptoms.acne) {
      totalAcne += 5;
      acneCount++;
    }
  });

  const cycleCount = cycles.length;
  const avgCramps = (totalCramps / cycleCount);
  const avgFatigue = (totalFatigue / cycleCount);
  const avgBackPain = (totalBackPain / cycleCount);
  const avgHeadache = (totalHeadache / cycleCount);
  const avgBloating = (totalBloating / cycleCount);
  const avgNausea = (totalNausea / cycleCount);
  const avgAcne = (totalAcne / cycleCount);

  const data = {
    labels: ['Cramps', 'Fatigue', 'Back Pain', 'Headache', 'Bloating', 'Nausea', 'Acne'],
    datasets: [{
      label: 'Average Severity',
      data: [avgCramps, avgFatigue, avgBackPain, avgHeadache, avgBloating, avgNausea, avgAcne],
      borderColor: '#b8a3ff',
      backgroundColor: 'rgba(184, 163, 255, 0.25)',
      borderWidth: 2.5,
      pointBackgroundColor: '#b8a3ff',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        ticks: { stepSize: 1 }
      }
    }
  };

  return <Radar data={data} options={options} />;
};

export default Analysis;