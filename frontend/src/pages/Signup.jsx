import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { saveUserProfile } from "../services/firestore";
import "../styles/Auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setFieldErrors({});

    const nextFieldErrors = {};
    if (!firstName.trim()) nextFieldErrors.firstName = "First name is required";
    if (!lastName.trim()) nextFieldErrors.lastName = "Last name is required";
    if (!email.trim()) nextFieldErrors.email = "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) nextFieldErrors.email = "Enter a valid email address";
    if (!password) nextFieldErrors.password = "Password is required";
    if (password && password.length < 6) nextFieldErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword) nextFieldErrors.confirmPassword = "Confirm your password";
    if (password && confirmPassword && password !== confirmPassword) nextFieldErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setLoading(false);
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await saveUserProfile(cred.user.uid, {
        email: cred.user.email,
        profile: { firstName: firstName.trim(), lastName: lastName.trim() },
      });
      navigate("/home");
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        setError("An account already exists with this email. Please log in instead.");
      } else if (err?.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err?.code === "auth/weak-password") {
        setError("Password is too weak (min 6 characters)");
      } else {
        setError(err.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
        <div className="auth-avatar" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="auth-title">Create your account</h2>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-row">
            <input
              className="auth-input"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          {fieldErrors.firstName && <p className="auth-error">{fieldErrors.firstName}</p>}
          {fieldErrors.lastName && <p className="auth-error">{fieldErrors.lastName}</p>}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email && <p className="auth-error">{fieldErrors.email}</p>}

          <input
            className="auth-input"
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}

          <input
            className="auth-input"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {fieldErrors.confirmPassword && <p className="auth-error">{fieldErrors.confirmPassword}</p>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-switch">
          <span>Already have an account?</span>
          <button type="button" onClick={() => navigate('/login')}>Log in</button>
        </div>
    </div>
  );
};

export default Signup;
