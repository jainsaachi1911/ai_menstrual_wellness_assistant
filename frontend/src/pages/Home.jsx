import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar, MessageCircle, Activity, Shield, Bot, TrendingUp, Heart, Sparkles, Flower2, Moon, Sun, Star, Zap, Droplet, CloudRain } from 'lucide-react';
import '../styles/Home.css';

const Home = ({ onOpenChat }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [firstName, setFirstName] = useState('');
  const featureCardsRef = useRef([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
      } else {
        // Fetch user's first name from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const profile = snap.data()?.profile || {};
            setFirstName(profile.firstName || 'Friend');
          } else {
            setFirstName('Friend');
          }
        } catch (error) {
          setFirstName('Friend');
        }
        setChecking(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  // Handle feature card animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const currentCards = featureCardsRef.current;
    currentCards.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => {
      currentCards.forEach(card => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  if (checking) return null;

  return (
    <div className="home-container">
      {/* Decorative gradient orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      <div className="gradient-orb orb-4"></div>

      {/* Main content */}
      <div className="home-content">
        {/* GROUP 1: Header with Icons */}
        <div className="header-group">
          <div className="heading-wrapper">
            <h1 className="home-main-heading">
              Nurture Your Wellness,
              <br />
              Embrace Your Journey
            </h1>
            
            <p className="home-subheading">
              Your trusted companion for personalized menstrual health insights and AI-powered cycle tracking
            </p>
            
            {/* Decorative floating icons */}
            <Heart className="floating-icon icon-1" size={28} />
            <Sparkles className="floating-icon icon-2" size={24} />
            <Flower2 className="floating-icon icon-3" size={30} />
            <Moon className="floating-icon icon-4" size={26} />
            <Sun className="floating-icon icon-5" size={28} />
            <Heart className="floating-icon icon-6" size={22} />
            <Star className="floating-icon icon-7" size={26} />
            <Zap className="floating-icon icon-8" size={24} />
            <Droplet className="floating-icon icon-9" size={28} />
            <CloudRain className="floating-icon icon-10" size={26} />
          </div>
        </div>

        {/* GROUP 2: Welcome & Action Buttons */}
        <div className="welcome-actions-group">
          <p className="home-greeting">
            Welcome, <span className="user-name">{firstName}</span>
          </p>
          
          <div className="home-action-buttons">
            <button 
              className="home-btn btn-primary"
              onClick={() => navigate('/calendar')}
            >
              <Calendar size={22} />
              <span>Track Period</span>
            </button>
            
            <button 
              className="home-btn btn-secondary"
              onClick={onOpenChat}
            >
              <MessageCircle size={22} />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* GROUP 3: Features */}
        <div className="features-group">
          <h2 className="features-heading">Comprehensive Health Tracking</h2>
          <p className="features-subheading">Everything you need to understand and manage your menstrual wellness</p>
        </div>
        
        <div className="feature-cards">
          <div 
            className="feature-card" 
            ref={el => featureCardsRef.current[0] = el}
          >
            <div className="feature-icon icon-pink">
              <Activity size={32} strokeWidth={2} />
            </div>
            <h3 className="feature-title">Personalized PWRI Score</h3>
            <p className="feature-description">
              Get your unique wellness risk index based on your health data
            </p>
          </div>

          <div 
            className="feature-card" 
            ref={el => featureCardsRef.current[1] = el}
          >
            <div className="feature-icon icon-purple">
              <Shield size={32} strokeWidth={2} />
            </div>
            <h3 className="feature-title">Risk Assessment</h3>
            <p className="feature-description">
              Advanced analysis to identify potential health concerns early
            </p>
          </div>

          <div 
            className="feature-card" 
            ref={el => featureCardsRef.current[2] = el}
          >
            <div className="feature-icon icon-blue">
              <Bot size={32} strokeWidth={2} />
            </div>
            <h3 className="feature-title">AI Guiding Assistance</h3>
            <p className="feature-description">
              24/7 AI support for your menstrual health questions
            </p>
          </div>

          <div 
            className="feature-card" 
            ref={el => featureCardsRef.current[3] = el}
          >
            <div className="feature-icon icon-peach">
              <TrendingUp size={32} strokeWidth={2} />
            </div>
            <h3 className="feature-title">Lifestyle Analysis</h3>
            <p className="feature-description">
              Track patterns and get personalized lifestyle recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
