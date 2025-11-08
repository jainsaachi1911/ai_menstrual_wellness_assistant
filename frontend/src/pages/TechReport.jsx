import React, { useState } from 'react';
import '../styles/TechReport.css';

const TechReport = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const technologies = [
    {
      category: 'Frontend',
      items: [
        {
          name: 'React 19.1.1',
          why: 'Modern UI library for building interactive user interfaces with component-based architecture',
          features: ['Hooks for state management', 'Virtual DOM for performance', 'Reusable components']
        },
        {
          name: 'Vite 7.1.7',
          why: 'Fast build tool and development server for rapid development and optimized production builds',
          features: ['Lightning-fast HMR', 'Optimized build output', 'Native ES modules support']
        },
        {
          name: 'React Router',
          why: 'Client-side routing for seamless navigation between different pages without full page reloads',
          features: ['Dynamic routing', 'Nested routes', 'Route protection']
        },
        {
          name: 'Firebase SDK 11.0.2',
          why: 'Backend-as-a-Service for authentication, real-time database, and storage',
          features: ['Email/Password Auth', 'Firestore real-time DB', 'Cloud Storage']
        }
      ]
    },
    {
      category: 'Backend',
      items: [
        {
          name: 'Python 3.11',
          why: 'Powerful language for data processing and machine learning model implementation',
          features: ['Rich ecosystem', 'Easy to learn', 'Excellent for ML/AI']
        },
        {
          name: 'Flask 3.0.0',
          why: 'Lightweight web framework for building REST APIs with minimal overhead',
          features: ['Micro-framework', 'Easy to scale', 'CORS support']
        },
        {
          name: 'XGBoost',
          why: 'Gradient boosting library for risk assessment model with high accuracy',
          features: ['Fast training', 'Handles missing data', 'Feature importance']
        },
        {
          name: 'CatBoost',
          why: 'Specialized for categorical features in PRWI (Pregnancy Risk Wellness Index) model',
          features: ['Categorical feature support', 'Fast inference', 'Robust predictions']
        },
        {
          name: 'Scikit-learn',
          why: 'Machine learning library for cluster deviation model and data preprocessing',
          features: ['RandomForest models', 'Gaussian Mixture Models', 'Data scaling']
        }
      ]
    },
    {
      category: 'Database & Cloud',
      items: [
        {
          name: 'Firebase Firestore',
          why: 'NoSQL real-time database for storing user profiles, cycles, and analysis data',
          features: ['Real-time sync', 'Offline support', 'Automatic scaling']
        },
        {
          name: 'Google Cloud Run',
          why: 'Serverless platform for deploying Flask backend without managing infrastructure',
          features: ['Auto-scaling', 'Pay-per-use', 'Container-based']
        },
        {
          name: 'Firebase Storage',
          why: 'Cloud storage for user profile pictures and documents',
          features: ['Secure access', 'CDN integration', 'Automatic backups']
        }
      ]
    },
    {
      category: 'AI & LLM',
      items: [
        {
          name: 'Groq API',
          why: 'Fast LLM inference for real-time AI chat responses about menstrual health',
          features: ['Low latency', 'High throughput', 'Cost-effective']
        },
        {
          name: 'llama-3.3-70b',
          why: 'Open-source language model for health education and Q&A',
          features: ['70B parameters', 'Multilingual', 'Health-aware training']
        },
        {
          name: 'OpenAI SDK',
          why: 'Client library for communicating with Groq API using OpenAI-compatible interface',
          features: ['Easy integration', 'Streaming support', 'Error handling']
        }
      ]
    }
  ];

  const features = [
    {
      title: 'User Authentication',
      description: 'Secure email/password authentication with Firebase Auth'
    },
    {
      title: 'Cycle Tracking',
      description: 'Track menstrual cycles with start date, end date, and intensity levels'
    },
    {
      title: 'AI Analysis',
      description: '3 ML models for risk assessment, cluster analysis, and wellness index'
    },
    {
      title: 'Health Predictions',
      description: 'Predict next period and provide personalized health insights'
    },
    {
      title: 'AI Chat Assistant',
      description: 'Real-time chat with AI for menstrual health education and Q&A'
    },
    {
      title: 'Educational Content',
      description: 'Comprehensive cards about menstrual health, hygiene, and wellness'
    }
  ];

  const futureWork = [
    {
      title: 'Doctor Integration',
      description: 'Share reports with healthcare providers securely for better medical consultation'
    },
    {
      title: 'Medication Tracking',
      description: 'Track medications and their effects on menstrual cycle patterns'
    },
    {
      title: 'Nutrition Tracking',
      description: 'Monitor dietary intake and its correlation with cycle health'
    }
  ];

  return (
    <div className="tech-report-container">
      {/* QR Code Section */}
      <div className="qr-section">
        <div className="qr-box">
          <div className="qr-placeholder">
            <svg viewBox="0 0 100 100" className="qr-icon">
              <rect x="10" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"/>
              <rect x="60" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"/>
              <rect x="10" y="60" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="75" cy="75" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>QR Code</p>
            <small>Scan to View Paper</small>
          </div>
        </div>
        <a href="https://github.com/jainsaachi1911/ai_menstrual_wellness_assistant" target="_blank" rel="noopener noreferrer" className="qr-github-btn">
          <span>🔗</span> View on GitHub
        </a>
      </div>

      {/* Main Content */}
      <div className="report-content">
        {/* Header */}
        <div className="report-header">
          <h1>AI Menstrual Wellness Assistant</h1>
          <p className="subtitle">Technology Stack & Project Overview</p>
        </div>

        {/* Introduction */}
        <section className="section introduction-section">
          <h2>Project Introduction</h2>
          <p>
            The AI Menstrual Wellness Assistant is a comprehensive healthcare platform designed to empower women 
            with personalized menstrual health insights using advanced machine learning and artificial intelligence. 
            The application combines cycle tracking, predictive analytics, and AI-powered health education to provide 
            a holistic approach to menstrual wellness.
          </p>
          <p>
            Built with modern web technologies and powered by three specialized ML models, the platform analyzes 
            menstrual patterns, assesses health risks, and provides real-time AI-driven health guidance through an 
            intelligent chatbot.
          </p>
        </section>

        {/* Technologies Section */}
        <section className="section technologies-section">
          <h2>Technology Stack</h2>
          <div className="tech-categories">
            {technologies.map((tech, idx) => (
              <div key={idx} className="tech-category">
                <button 
                  className={`category-header ${expandedSection === tech.category ? 'expanded' : ''}`}
                  onClick={() => toggleSection(tech.category)}
                >
                  <span className="category-title">{tech.category}</span>
                  <span className="expand-icon">▼</span>
                </button>
                {expandedSection === tech.category && (
                  <div className="category-content">
                    {tech.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="tech-item">
                        <h4>{item.name}</h4>
                        <div className="tech-why">
                          <strong>Why:</strong> {item.why}
                        </div>
                        <div className="tech-features">
                          <strong>Features:</strong>
                          <ul>
                            {item.features.map((feature, fIdx) => (
                              <li key={fIdx}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="section features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ML Models Section */}
        <section className="section models-section">
          <h2>Machine Learning Models</h2>
          <div className="models-grid">
            <div className="model-card">
              <h3>Risk Assessment Model</h3>
              <p className="model-tech">XGBoost</p>
              <p>Analyzes 17 features to assess menstrual health risk levels (Low, Medium, High)</p>
            </div>
            <div className="model-card">
              <h3>Cluster Deviation Model</h3>
              <p className="model-tech">RandomForest + GMM</p>
              <p>Identifies cycle pattern clusters and detects deviations from normal patterns</p>
            </div>
            <div className="model-card">
              <h3>PRWI Score Model</h3>
              <p className="model-tech">CatBoost Ensemble</p>
              <p>Pregnancy Risk Wellness Index - comprehensive wellness scoring system</p>
            </div>
          </div>
        </section>

        {/* Future Work Section */}
        <section className="section future-section">
          <h2>Future Enhancements</h2>
          <ul className="future-list">
            {futureWork.map((item, idx) => (
              <li key={idx}>
                <strong>{item.title}:</strong> {item.description}
              </li>
            ))}
          </ul>
        </section>


      </div>
    </div>
  );
};

export default TechReport;
