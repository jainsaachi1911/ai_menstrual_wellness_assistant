import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import User from './pages/User';
import Analysis from './pages/Analysis';
import Calendar from './pages/Calendar';
import AIChat from './pages/AIChat';
import './App.css';

function App() {
  const [navOpen, setNavOpen] = React.useState(true);
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/home';

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
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user" element={<User />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/" element={<Navigate to="/signup" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
