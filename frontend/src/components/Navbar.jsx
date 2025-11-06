import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  LogIn,
  UserPlus,
  User,
  BarChart3,
  CalendarDays,
  Menu,
  X
} from 'lucide-react';
import './Navbar.css';

// Usage
// <Navbar />                // uncontrolled (internal toggle)
// <Navbar isOpen={true} handleToggle={fn} /> // controlled by parent

export default function Navbar({ isOpen: controlledIsOpen, handleToggle: controlledToggle }) {
  // If parent passes `isOpen` we treat it as controlled. Otherwise we manage internal state.
  const isControlled = typeof controlledIsOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  function toggle() {
    if (isControlled) {
      // call parent's handler if provided
      controlledToggle && controlledToggle(!controlledIsOpen);
    } else {
      setInternalOpen(v => !v);
    }
  }

  // Optional: ensure internal state mirrors a default collapse on mount for small screens
  useEffect(() => {
    if (!isControlled) {
      // Example: start collapsed on narrow screens
      if (window.innerWidth < 768) setInternalOpen(false);
    }
  }, [isControlled]);

  return (
    <nav className={`sidebar-navbar ${isOpen ? 'open' : 'closed'}`}>
      <div className="navbar-toggle" onClick={toggle} aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}>
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </div>

      <ul className="nav-list">
        <li>
          <Link to="/home" title="Home">
            <Home size={18} />
            <span className="nav-text">Home</span>
          </Link>
        </li>

        <li>
          <Link to="/login" title="Login">
            <LogIn size={18} />
            <span className="nav-text">Login</span>
          </Link>
        </li>

        <li>
          <Link to="/signup" title="Signup">
            <UserPlus size={18} />
            <span className="nav-text">Signup</span>
          </Link>
        </li>

        <li>
          <Link to="/user" title="User">
            <User size={18} />
            <span className="nav-text">User</span>
          </Link>
        </li>

        <li>
          <Link to="/calendar" title="Calendar">
            <CalendarDays size={18} />
            <span className="nav-text">Calendar</span>
          </Link>
        </li>

        <li>
          <Link to="/analysis" title="Analysis">
            <BarChart3 size={18} />
            <span className="nav-text">Analysis</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
