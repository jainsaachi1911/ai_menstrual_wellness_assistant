import React, { Component } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatSidebar from './components/ChatSidebar';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo here if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 2000, background: '#222', color: '#fff', padding: 24 }}>
          <h2>Something went wrong in Chat.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import User from './pages/User';
import Analysis from './pages/Analysis';
import Calendar from './pages/Calendar';
import './App.css';

const HomeWithChatButton = ({ onOpenChat, chatOpen }) => (
  <Home onOpenChat={onOpenChat} />
);

function App() {
  const [chatOpen, setChatOpen] = React.useState(false);
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
        marginLeft: hideNavbar ? 0 : (navOpen ? 200 : 70), 
        padding: isHomePage ? '0' : '40px 30px', 
        width: '100%',
        transition: 'margin-left 0.3s ease'
      }}>
        <Routes>
          <Route path="/home" element={<HomeWithChatButton onOpenChat={() => setChatOpen(true)} chatOpen={chatOpen} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user" element={<User />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/" element={<Navigate to="/signup" />} />
        </Routes>
      </div>
      <ErrorBoundary>
        <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
