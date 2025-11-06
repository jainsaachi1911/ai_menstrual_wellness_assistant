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
  UserCircle
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
    <nav className={`sidebar-navbar ${isOpen ? 'open' : 'closed'}`}>
      <div 
        className="navbar-toggle" 
        onClick={toggle} 
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </div>

      <div className="navbar-brand">
        <span className="brand-text">Wellness</span>
      </div>

      <ul className="nav-list">
        <li>
          <Link 
            to="/home" 
            title="Home"
            className={isActive('/home') ? 'active' : ''}
          >
            <Home size={24} />
            <span className="nav-text">Home</span>
          </Link>
        </li>

        <li>
          <Link 
            to="/user" 
            title="User"
            className={isActive('/user') ? 'active' : ''}
          >
            <User size={24} />
            <span className="nav-text">User</span>
          </Link>
        </li>

        <li>
          <Link 
            to="/calendar" 
            title="Calendar"
            className={isActive('/calendar') ? 'active' : ''}
          >
            <CalendarDays size={24} />
            <span className="nav-text">Calendar</span>
          </Link>
        </li>

        <li>
          <Link 
            to="/analysis" 
            title="Analysis"
            className={isActive('/analysis') ? 'active' : ''}
          >
            <BarChart3 size={24} />
            <span className="nav-text">Analysis</span>
          </Link>
        </li>

        <li>
          <Link 
            to="/ai-chat" 
            title="AI Assistance"
            className={isActive('/ai-chat') ? 'active' : ''}
          >
            <MessageSquare size={24} />
            <span className="nav-text">AI Assistance</span>
          </Link>
        </li>
      </ul>

      {/* User Profile Section at Bottom */}
      <div className="navbar-profile">
        <div className="profile-info">
          <div className="profile-pic-nav">
            {userProfile.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" />
            ) : (
              <UserCircle size={28} />
            )}
          </div>
          <div className="profile-details">
            <span className="profile-name">
              {`${userProfile.firstName} ${userProfile.lastName}`.trim() || 'User'}
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </nav>
  );
}