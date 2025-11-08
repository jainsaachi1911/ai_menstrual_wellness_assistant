import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import User from './pages/User';
import Analysis from './pages/Analysis';
import Calendar from './pages/Calendar';
import AIChat from './pages/AIChat';
import Card from './pages/Card';
import Card2 from './pages/Card2';
import Card3 from './pages/Card3';
import TechReport from './pages/TechReport';
import './App.css';

// Protected Route Component
function ProtectedRoute({ element, isAuthenticated, isLoading }) {
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }
  return isAuthenticated ? element : <Navigate to="/login" />;
}

// Auth-only Route Component (Login/Signup only for non-authenticated users)
function AuthOnlyRoute({ element, isAuthenticated, isLoading }) {
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }
  return !isAuthenticated ? element : <Navigate to="/home" />;
}

function App() {
  const [navOpen, setNavOpen] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/home';

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ 
      display: 'flex',
      background: 'linear-gradient(135deg, #fef5f8 0%, #f8f0ff 25%, #fff0f8 50%, #f0f8ff 75%, #fef5ff 100%)',
      minHeight: '100vh'
    }}>
      {!hideNavbar && <Navbar onToggle={(isOpen) => setNavOpen(isOpen)} />}
      <div style={{ 
        width: '100%'
      }}>
        <Routes>
          {/* Auth-only routes (accessible only when NOT signed in) */}
          <Route path="/login" element={<AuthOnlyRoute element={<Login />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/signup" element={<AuthOnlyRoute element={<Signup />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          
          {/* Protected routes (accessible only when signed in) */}
          <Route path="/home" element={<ProtectedRoute element={<Home />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/user" element={<ProtectedRoute element={<User />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/calendar" element={<ProtectedRoute element={<Calendar />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/analysis" element={<ProtectedRoute element={<Analysis />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/ai-chat" element={<ProtectedRoute element={<AIChat />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/card1" element={<ProtectedRoute element={<Card />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/card2" element={<ProtectedRoute element={<Card2 />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/card3" element={<ProtectedRoute element={<Card3 />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          <Route path="/tech-report" element={<ProtectedRoute element={<TechReport />} isAuthenticated={isAuthenticated} isLoading={isLoading} />} />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/signup"} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
