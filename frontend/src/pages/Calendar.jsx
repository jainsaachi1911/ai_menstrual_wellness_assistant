import React, { useState, useEffect } from 'react';
import AnalysisForm from '../components/AnalysisForm';
import '../styles/AnalysisForm.css';

const Calendar = () => {
  const [navbarClosed, setNavbarClosed] = useState(false);

  useEffect(() => {
    const handleNavbarToggle = (e) => {
      setNavbarClosed(e.detail?.closed || false);
    };
    window.addEventListener('navbar-toggle', handleNavbarToggle);
    return () => window.removeEventListener('navbar-toggle', handleNavbarToggle);
  }, []);

  return (
    <div className={`calendar-page-container ${navbarClosed ? 'navbar-closed' : ''}`}>
      <AnalysisForm />
    </div>
  );
};

export default Calendar;