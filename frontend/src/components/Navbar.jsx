import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  BarChart3,
  CalendarDays,
  MessageSquare,
  Menu,
  X,
  LogOut,
  UserCircle,
  Heart
} from 'lucide-react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './Navbar.css';

// Usage
// <Navbar />                // uncontrolled (internal toggle)
// <Navbar isOpen={true} handleToggle={fn} /> // controlled by parent

export default function Navbar({ isOpen: controlledIsOpen, handleToggle: controlledToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // If parent passes `isOpen` we treat it as controlled. Otherwise we manage internal state.
  const isControlled = typeof controlledIsOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = isControlled ? controlledIsOpen : internalOpen;
  
  // User profile data
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    profilePicture: null
  });

  function toggle() {
    const newState = isControlled ? !controlledIsOpen : !internalOpen;
    
    if (isControlled) {
      // call parent's handler if provided
      controlledToggle && controlledToggle(newState);
    } else {
      setInternalOpen(newState);
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('navbar-toggle', { 
      detail: { closed: !newState } 
    }));
  }

  // Optional: ensure internal state mirrors a default collapse on mount for small screens
  useEffect(() => {
    if (!isControlled) {
      // Example: start collapsed on narrow screens
      if (window.innerWidth < 768) setInternalOpen(false);
    }
  }, [isControlled]);

  // Dispatch initial navbar state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('navbar-toggle', { 
      detail: { closed: !isOpen } 
    }));
  }, [isOpen]);

  // Fetch user profile data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const profile = data?.profile || {};
            setUserProfile({
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              profilePicture: profile.profilePicture || null
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    });
    return () => unsub();
  }, []);

  // Listen for profile updates from User page
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      setUserProfile({
        firstName: e.detail.firstName || '',
        lastName: e.detail.lastName || '',
        profilePicture: e.detail.profilePicture || null
      });
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="top-navbar">
      <div className="navbar-container">
        {/* Left - Navigation Links */}
        <div className="nav-left">
          <Link to="/home" className={isActive('/home') ? 'nav-link active' : 'nav-link'}>
            Home
          </Link>
          <Link to="/calendar" className={isActive('/calendar') ? 'nav-link active' : 'nav-link'}>
            Calendar
          </Link>
          <Link to="/analysis" className={isActive('/analysis') ? 'nav-link active' : 'nav-link'}>
            Analysis
          </Link>
          <Link to="/card" className={isActive('/card') ? 'nav-link active' : 'nav-link'}>
            Learn
          </Link>
        </div>

        {/* Center - Logo/Brand */}
        <div className="nav-center">
          <Link to="/home" className="navbar-brand">
            <Heart size={24} className="brand-icon" />
            <span className="brand-text">LUNARA</span>
          </Link>
        </div>

        {/* Right - User Actions */}
        <div className="nav-right">
          <Link to="/ai-chat" className={isActive('/ai-chat') ? 'nav-link active' : 'nav-link'}>
            AI Chat
          </Link>
          <Link to="/user" className={`profile-link ${isActive('/user') ? 'active' : ''}`}>
            <div className="profile-photo-wrapper">
              {userProfile.profilePicture ? (
                <img 
                  src={userProfile.profilePicture} 
                  alt="Profile" 
                  className="navbar-profile-photo"
                />
              ) : (
                <UserCircle size={32} className="default-profile-icon" />
              )}
            </div>
          </Link>
          <button className="logout-btn-top" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}