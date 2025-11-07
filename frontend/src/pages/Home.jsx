import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar, Shield, TrendingUp, Heart, BarChart3, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
      } else {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const profile = snap.data()?.profile || {};
            setFirstName(profile.firstName || 'there');
          } else {
            setFirstName('there');
          }
        } catch (error) {
          setFirstName('there');
        }
        setChecking(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Decorative 3D Elements */}
        <div className="decoration-3d decoration-1"></div>
        <div className="decoration-3d decoration-2"></div>
        <div className="decoration-3d decoration-3"></div>
        <div className="decoration-3d decoration-4"></div>

        <div className="hero-content">
          <h1 className="hero-main-title">
            Track and manage
            <br />
            your wellness today
          </h1>
          
          <p className="hero-description">
            Monitor your menstrual health, understand your body patterns, and get AI-powered insights for better wellness. Track symptoms, predict cycles, and take control of your health journey.
          </p>
          
          <button className="hero-cta-btn" onClick={() => navigate('/calendar')}>
            Let's start
          </button>
        </div>
      </section>

      {/* Horizontal Band Section */}
      <section className="brand-band">
        <div className="brand-container">
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>AI Health Insights</span>
          </div>
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>Cycle Tracking</span>
          </div>
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>Risk Assessment</span>
          </div>
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>Wellness Analytics</span>
          </div>
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>Personalized Care</span>
          </div>
          <div className="brand-item">
            <div className="brand-dot"></div>
            <span>Smart Predictions</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Comprehensive Health Tracking</h2>
        <p className="section-description">
          Everything you need to understand and manage your menstrual wellness with advanced AI technology
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon pink">
              <Shield size={40} />
            </div>
            <h3 className="feature-title">Smart Risk Assessment</h3>
            <p className="feature-text">
              AI-powered analysis identifies potential health concerns early, giving you peace of mind
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <TrendingUp size={40} />
            </div>
            <h3 className="feature-title">Cycle Predictions</h3>
            <p className="feature-text">
              Accurate predictions for your next period based on your unique patterns and history
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue">
              <BarChart3 size={40} />
            </div>
            <h3 className="feature-title">Detailed Analytics</h3>
            <p className="feature-text">
              Comprehensive insights into your cycle patterns, symptoms, and overall wellness trends
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon peach">
              <Sparkles size={40} />
            </div>
            <h3 className="feature-title">Personalized Care</h3>
            <p className="feature-text">
              Customized recommendations and insights tailored specifically to your health profile
            </p>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="collections-section">
        <h2 className="collections-title">Health Collections</h2>
        <p className="collections-description">
          Explore comprehensive health insights and tracking tools designed specifically for your wellness journey.
        </p>
        
        <div className="collections-grid">
          <div className="collection-card" onClick={() => navigate('/card1')}>
            <img src="/card-photo/Picture1.png" alt="Health Collection 1" className="collection-image" />
          </div>
          
          <div className="collection-card" onClick={() => navigate('/card2')}>
            <img src="/card-photo/Picture2.png" alt="Health Collection 2" className="collection-image" />
          </div>
          
          <div className="collection-card" onClick={() => navigate('/card3')}>
            <img src="/card-photo/Picture3.png" alt="Health Collection 3" className="collection-image" />
          </div>
          
          <div className="collection-card" onClick={() => navigate('/card4')}>
            <img src="/card-photo/Picture4.png" alt="Health Collection 4" className="collection-image" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
