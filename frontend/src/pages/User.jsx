import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const User = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setEmail(user.email || '');
      // fetch profile from Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : {};
        const profile = data?.profile || {};
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
      } catch (_) {
        // ignore
      } finally {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth); // this only signs the user out; data in Firestore remains
    navigate('/login');
  };

  if (checking) return null;

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>Email:</strong> {email || '-'}</p>
      <p><strong>First name:</strong> {firstName || '-'}</p>
      <p><strong>Last name:</strong> {lastName || '-'}</p>
      <button type="button" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default User;
