import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { User as UserIcon, LogOut, Edit3, Save, Trash2, X, Settings, HelpCircle, FileText } from 'lucide-react';
import '../styles/User.css';

// 9 predefined profile images
const PROFILE_IMAGES = [
  '/profile/1.jpg',
  '/profile/2.jpg',
  '/profile/3.jpg',
  '/profile/4.jpg',
  '/profile/5.jpg',
  '/profile/6.jpg',
  '/profile/7.jpg',
  '/profile/8.jpg',
  '/profile/9.jpg'
];

const User = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [navbarClosed, setNavbarClosed] = useState(false);

  // Listen for navbar state changes
  useEffect(() => {
    const handleNavbarToggle = (e) => {
      setNavbarClosed(e.detail.closed);
    };
    window.addEventListener('navbar-toggle', handleNavbarToggle);
    return () => window.removeEventListener('navbar-toggle', handleNavbarToggle);
  }, []);

  // User data
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    profilePicture: null, // No default image
    Age: '',
    BMI: '',
    Numberpreg: '',
    Abortions: '',
    AgeM: '',
    Breastfeeding: false
  });

  const [editData, setEditData] = useState({ ...userData });

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
        
        const loadedData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          profilePicture: profile.profilePicture || null,
          Age: profile.Age || '',
          BMI: profile.BMI || '',
          Numberpreg: profile.Numberpreg || '',
          Abortions: profile.Abortions || '',
          AgeM: profile.AgeM || '',
          Breastfeeding: profile.Breastfeeding || false
        };
        
        setUserData(loadedData);
        setEditData(loadedData);
      } catch (_) {
        // ignore
      } finally {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (user) {
        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', user.uid));
        // Delete authentication account
        await deleteUser(user);
        navigate('/signup');
      }
    } catch (error) {
      alert('Failed to delete account. Please try again or re-authenticate.');
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditData({ ...userData });
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditData({ ...userData });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            profile: editData,
            updatedAt: new Date()
          },
          { merge: true }
        );
        setUserData(editData);
        setIsEditMode(false);
        
        // Dispatch event to notify Navbar of profile picture change
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: {
            profilePicture: editData.profilePicture,
            firstName: editData.firstName,
            lastName: editData.lastName
          }
        }));
      }
    } catch (error) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const selectAvatar = (imagePath) => {
    setEditData(prev => ({ ...prev, profilePicture: imagePath }));
    setShowAvatarModal(false);
  };

  const deleteProfilePicture = () => {
    setEditData(prev => ({ ...prev, profilePicture: null }));
  };

  if (checking) return null;

  const displayData = isEditMode ? editData : userData;
  const fullName = `${displayData.firstName} ${displayData.lastName}`.trim() || 'User';

  return (
    <div className={`user-profile-container ${navbarClosed ? 'navbar-closed' : ''}`}>
      <div className="profile-card">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture-wrapper">
            <div 
              className="profile-picture-circle"
              onClick={() => isEditMode && setShowAvatarModal(true)}
              style={{ cursor: isEditMode ? 'pointer' : 'default' }}
            >
              {displayData.profilePicture ? (
                <img 
                  src={displayData.profilePicture} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <div className="default-avatar">
                  <UserIcon size={80} strokeWidth={1.5} />
                </div>
              )}
              {isEditMode && (
                <div className="edit-overlay">
                  <Edit3 size={20} />
                </div>
              )}
            </div>
            {isEditMode && displayData.profilePicture && (
              <button className="delete-picture-btn" onClick={deleteProfilePicture}>
                <Trash2 size={16} />
                Remove Picture
              </button>
            )}
          </div>
        </div>

        {/* User Info Section */}
        <div className="user-info-section">
          {isEditMode ? (
            <div className="name-edit-group">
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="First Name"
                className="name-input"
              />
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Last Name"
                className="name-input"
              />
            </div>
          ) : (
            <h1 className="user-name">{fullName}</h1>
          )}
          <p className="user-email">{email}</p>
        </div>

        {/* Health Information Section */}
        <div className="health-info-section">
          <h4 className="section-title">Health Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Age">Age</label>
              {isEditMode ? (
                <input
                  type="number"
                  id="Age"
                  value={editData.Age}
                  onChange={(e) => handleInputChange('Age', e.target.value)}
                  className="form-input"
                  placeholder="Enter age"
                />
              ) : (
                <div className="form-value">{displayData.Age || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="BMI">BMI</label>
              {isEditMode ? (
                <input
                  type="number"
                  step="0.1"
                  id="BMI"
                  value={editData.BMI}
                  onChange={(e) => handleInputChange('BMI', e.target.value)}
                  className="form-input"
                  placeholder="Enter BMI"
                />
              ) : (
                <div className="form-value">{displayData.BMI || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="Numberpreg">Number of Pregnancies</label>
              {isEditMode ? (
                <input
                  type="number"
                  id="Numberpreg"
                  value={editData.Numberpreg}
                  onChange={(e) => handleInputChange('Numberpreg', e.target.value)}
                  className="form-input"
                  placeholder="Enter number"
                />
              ) : (
                <div className="form-value">{displayData.Numberpreg || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="Abortions">Number of Abortions</label>
              {isEditMode ? (
                <input
                  type="number"
                  id="Abortions"
                  value={editData.Abortions}
                  onChange={(e) => handleInputChange('Abortions', e.target.value)}
                  className="form-input"
                  placeholder="Enter number"
                />
              ) : (
                <div className="form-value">{displayData.Abortions || '-'}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="AgeM">Age at First Menstruation</label>
              {isEditMode ? (
                <input
                  type="number"
                  id="AgeM"
                  value={editData.AgeM}
                  onChange={(e) => handleInputChange('AgeM', e.target.value)}
                  className="form-input"
                  placeholder="Enter age"
                />
              ) : (
                <div className="form-value">{displayData.AgeM || '-'}</div>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="Breastfeeding">
                Currently Breastfeeding
              </label>
              {isEditMode ? (
                <input
                  type="checkbox"
                  id="Breastfeeding"
                  checked={editData.Breastfeeding}
                  onChange={(e) => handleInputChange('Breastfeeding', e.target.checked)}
                  className="form-checkbox"
                />
              ) : (
                <div className="form-value">{displayData.Breastfeeding ? 'Yes' : 'No'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {isEditMode ? (
            <>
              <button className="btn btn-save" onClick={handleSave} disabled={saving}>
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-cancel" onClick={handleCancel}>
                <X size={20} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-edit" onClick={handleEdit}>
                <Edit3 size={20} />
                Edit Profile
              </button>
              <button className="btn btn-logout" onClick={handleLogout}>
                <LogOut size={20} />
                Logout
              </button>
              <button className="btn btn-delete" onClick={handleDeleteAccount}>
                <Trash2 size={20} />
                Delete Account
              </button>
            </>
          )}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <button className="quick-link" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className="quick-link" onClick={() => setShowHelpModal(true)}>
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
          <button className="quick-link" onClick={() => setShowTermsModal(true)}>
            <FileText size={16} />
            <span>Terms & Conditions</span>
          </button>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Profile Picture</h3>
              <button className="close-btn" onClick={() => setShowAvatarModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="avatar-grid">
              {PROFILE_IMAGES.map((imagePath, index) => (
                <div
                  key={index}
                  className={`avatar-option ${editData.profilePicture === imagePath ? 'selected' : ''}`}
                  onClick={() => selectAvatar(imagePath)}
                >
                  <img 
                    src={imagePath} 
                    alt={`Profile ${index + 1}`} 
                    className="avatar-image-option"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={() => setShowSettingsModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <div className="settings-section">
                <h4>Account Preferences</h4>
                <div className="settings-item">
                  <label>Email Notifications</label>
                  <p className="settings-desc">Receive updates about your menstrual health analysis</p>
                  <input type="checkbox" defaultChecked className="settings-toggle" />
                </div>
                <div className="settings-item">
                  <label>Cycle Reminders</label>
                  <p className="settings-desc">Get notified before your expected period date</p>
                  <input type="checkbox" defaultChecked className="settings-toggle" />
                </div>
                <div className="settings-item">
                  <label>Health Insights</label>
                  <p className="settings-desc">Receive personalized health recommendations</p>
                  <input type="checkbox" defaultChecked className="settings-toggle" />
                </div>
              </div>
              <div className="settings-section">
                <h4>Privacy</h4>
                <div className="settings-item">
                  <label>Data Privacy</label>
                  <p className="settings-desc">Your health data is encrypted and secure. We never share your information with third parties.</p>
                </div>
              </div>
              <div className="settings-section">
                <h4>About</h4>
                <div className="settings-item">
                  <p className="settings-desc">AI Menstrual Wellness Assistant v1.0</p>
                  <p className="settings-desc">© 2025 All rights reserved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Help & Support</h3>
              <button className="close-btn" onClick={() => setShowHelpModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <div className="help-section">
                <h4>Getting Started</h4>
                <p>Welcome to your AI Menstrual Wellness Assistant! Here's how to use the platform:</p>
                <ul>
                  <li><strong>Profile Setup:</strong> Complete your profile with accurate health information for personalized insights.</li>
                  <li><strong>Track Cycles:</strong> Use the calendar to log your menstrual cycles and symptoms.</li>
                  <li><strong>Health Analysis:</strong> Get AI-powered analysis of your menstrual health patterns.</li>
                  <li><strong>Chat Assistant:</strong> Ask questions and get instant support from our AI assistant.</li>
                </ul>
              </div>
              <div className="help-section">
                <h4>Frequently Asked Questions</h4>
                <div className="faq-item">
                  <strong>Q: How is my data protected?</strong>
                  <p>A: All your health data is encrypted and stored securely. We follow strict privacy guidelines and never share your information.</p>
                </div>
                <div className="faq-item">
                  <strong>Q: How accurate is the AI analysis?</strong>
                  <p>A: Our AI model is trained on extensive medical data and provides insights based on your tracked patterns. However, always consult healthcare professionals for medical advice.</p>
                </div>
                <div className="faq-item">
                  <strong>Q: Can I export my data?</strong>
                  <p>A: Yes, you can download your health data from the Analysis section at any time.</p>
                </div>
              </div>
              <div className="help-section">
                <h4>Contact Support</h4>
                <p>Need more help? Reach out to our support team:</p>
                <p><strong>Email:</strong> support@menstrualwellness.com</p>
                <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terms & Conditions</h3>
              <button className="close-btn" onClick={() => setShowTermsModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <div className="terms-section">
                <p className="terms-date">Last Updated: November 6, 2025</p>
                
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using the AI Menstrual Wellness Assistant platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our service.</p>
                
                <h4>2. Use of Service</h4>
                <p>This platform is designed to help you track and analyze your menstrual health patterns. The AI-powered insights are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment.</p>
                
                <h4>3. User Responsibilities</h4>
                <p>You are responsible for:</p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>Providing accurate and complete health information</li>
                  <li>Using the platform in accordance with applicable laws</li>
                  <li>Not sharing sensitive health data with unauthorized parties</li>
                </ul>
                
                <h4>4. Privacy & Data Protection</h4>
                <p>We are committed to protecting your privacy. Your health data is encrypted and stored securely. We collect and process your data in accordance with applicable privacy laws and our Privacy Policy.</p>
                
                <h4>5. Medical Disclaimer</h4>
                <p>The information and analysis provided by this platform are not intended to substitute professional medical advice. Always seek the advice of your physician or qualified health provider with any questions regarding your health.</p>
                
                <h4>6. Limitation of Liability</h4>
                <p>We strive to provide accurate and helpful insights, but we do not guarantee the accuracy, completeness, or reliability of any information provided. We shall not be liable for any damages arising from the use of this platform.</p>
                
                <h4>7. Changes to Terms</h4>
                <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.</p>
                
                <h4>8. Contact Information</h4>
                <p>For questions about these Terms & Conditions, please contact us at legal@menstrualwellness.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
