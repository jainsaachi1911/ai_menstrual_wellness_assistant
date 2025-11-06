import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AnalysisForm from '../components/AnalysisForm';

const Home = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  if (checking) return null;

  return (
    <div>
      <h1>Home Page</h1>
      {/* Optional: show AnalysisForm on Home after auth */}
      <AnalysisForm />
    </div>
  );
};

export default Home;
