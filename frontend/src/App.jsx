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
  <>
    <Home />
    {!chatOpen && (
      <button
        style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 2002, background: '#f8bbd0', color: '#c94f7c', border: 'none', borderRadius: 24, padding: '12px 24px', fontWeight: 600, fontSize: '1em', boxShadow: '0 2px 8px rgba(201,79,124,0.10)', cursor: 'pointer' }}
        onClick={onOpenChat}
      >
        Open Chat Assistant
      </button>
    )}
  </>
);

function App() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(true);
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  
  return (
    <div style={{ display: 'flex' }}>
      {!hideNavbar && <Navbar onToggle={(isOpen) => setNavOpen(isOpen)} />}
      <div style={{ 
        marginLeft: hideNavbar ? 0 : (navOpen ? 200 : 70), 
        padding: '40px 30px', 
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
