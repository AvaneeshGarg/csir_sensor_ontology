import React, { useState, useEffect } from 'react';
import Sidebar from './components/admin/Sidebar';
import Dashboard from './pages/admin/Dashboard';
import RealTime from './pages/admin/RealTime';
import History from './pages/admin/HistoryReport';
import Analysis from './pages/admin/Analysis';
import User from './pages/admin/Usermanagement';
import SensorActivity from './pages/admin/SensorActivity';
import Profile from './pages/admin/Profile';
import SensorMap from './pages/admin/SensorMap';
import SensorInformation from './pages/admin/SensorInformation';
import 'leaflet/dist/leaflet.css';
import logoImage from './assets/image (9).png';
import DataValidation from './pages/admin/DataValidation.jsx';

function generateSmartCaptcha() {
  const easyWords = [
    "OKOLO", "HEMLO", "SORTE", "AeVie", "N0one", "HiMa", "SiliLL", "AZDEDS", "Az@EF", "OCHNEP", "AAVIMA", "NiwYU7", "Slkuy6", "ewUI#4", "SIDY56", "Owdhi20", "xiah89", "d2zihz", "XeTu49", "ZORVE", "1nVio", "MAQUE5", "OblixX", "HY0MA", "qwil9A", "WEZX7",
    "2Heka#", "RUJ1T", "DovRIE", "3xUPA!", "SkaW29", "Niz8o", "VYUTQ2", "gAFne5", "Bi2lL", "MIxY09", "ZAH4f", "pLAz0R", "TwiN83", "RAkHu7", "4rchi$", "VUSEN", "K9AiWE", "epLo78", "N0rTa", "WimZe6", "OP32x!", "ZE91RA", "eWy7IH", "FLICK2",
  ];
  const word = easyWords[Math.floor(Math.random() * easyWords.length)];
  return { question: word, answer: word };
}

async function authPhpRequest(payload) {
  const res = await fetch('http://localhost/backend/ctrl2/ldauth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(payload).toString(),
    credentials: 'include'
  });
  return res.json();
}

// ---- Email & Password Validation Helpers ----
const validDomains = ['@gmail.com', '@lostdevs.io', '@nplindia.res.in'];

function isValidEmailDomain(email) {
  return validDomains.some(domain => email.endsWith(domain));
}

function isStrongPassword(password) {
  // Minimum 8 chars, 1 upper, 1 lower, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

const CSIRSensorSyncPortal = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    emailId: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    captcha: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [captcha, setCaptcha] = useState(generateSmartCaptcha());
  const [captchaVerified, setCaptchaVerified] = useState(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // New: validation state
  const [emailDomainError, setEmailDomainError] = useState('');
  const [passwordStrengthError, setPasswordStrengthError] = useState('');

  const carouselImages = [
    "https://candela-ptb.de/wp-content/uploads/2021/01/NPL2.jpg",
    "https://www.nplindia.org/wp-content/uploads/2021/11/9.png",
    "https://www.nplindia.org/wp-content/uploads/2023/04/DSC_2975-scaled.jpg",
    "https://i.ytimg.com/vi/3593ek-BlB0/maxresdefault.jpg"
  ];



  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // --- Enhanced Input Change Handler ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === "captcha") setCaptchaVerified(null);

    // --- Email domain validation (register only) ---
    if (authMode === 'register' && name === "emailId") {
      if (value && !isValidEmailDomain(value)) {
        setEmailDomainError('Allowed domains: @gmail.com, @lostdevs.io, @nplindia.res.in');
      } else {
        setEmailDomainError('');
      }
    }

    // --- Password strength validation (register only) ---
    if (authMode === 'register' && name === "password") {
      if (value && !isStrongPassword(value)) {
        setPasswordStrengthError(
          'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.'
        );
      } else {
        setPasswordStrengthError('');
      }
    }
  };

  const handleCaptchaVerify = () => {
    if (formData.captcha.trim().toUpperCase() === captcha.answer.toUpperCase()) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
    }
  };

  const handlePlayCaptchaAudio = () => {
    window.speechSynthesis.cancel();
    let question = captcha.question.split('').join(' ');
    const utterance = new window.SpeechSynthesisUtterance("Captcha. " + question);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // ---- Enhanced Submit Handler with Validations ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.captcha.trim().toUpperCase() !== captcha.answer.toUpperCase()) {
      setError('Invalid captcha. Please try again.');
      setCaptcha(generateSmartCaptcha());
      setFormData({ ...formData, captcha: '' });
      setCaptchaVerified(null);
      window.speechSynthesis.cancel();
      return;
    }

    // Registration-specific validations
    if (authMode === 'register') {
      if (!formData.emailId || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      // --- Email domain check
      if (!isValidEmailDomain(formData.emailId)) {
        setError('Allowed email domains: @gmail.com, @lostdevs.io, @nplindia.res.in');
        return;
      }
      // --- Password strength check
      if (!isStrongPassword(formData.password)) {
        setError('Password must be min 8 chars and contain uppercase, lowercase, number, special character.');
        return;
      }
      // --- Confirm password check
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      // --- Clear inline errors
      setEmailDomainError('');
      setPasswordStrengthError('');

      const data = await authPhpRequest({
        action: 'register',
        email: formData.emailId,
        password: formData.password,
        fullName: formData.fullName
      });
      if (data.success) {
        setSuccessMessage('User created successfully. Please log in.');
        setAuthMode('login');
        setFormData({
          emailId: formData.emailId,
          password: '',
          fullName: '',
          confirmPassword: '',
          captcha: ''
        });
        setCaptcha(generateSmartCaptcha());
        setCaptchaVerified(null);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
      return;
    }

    // Login flow (unchanged)
    if (authMode === 'login') {
      if (!formData.emailId || !formData.password) {
        setError('Please fill in all required fields.');
        return;
      }
      const data = await authPhpRequest({
        action: 'login',
        email: formData.emailId,
        password: formData.password
      });
      if (data.success) {
        onAuthSuccess(data.role === "admin" ? "admin" : "user", {
          email: data.email,
          name: data.name || "User"
        });
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    }
  };

  // FORGOT PASSWORD LOGIC (unchanged)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setForgotLoading(true);
    const res = await authPhpRequest({
      action: 'forgot',
      email: forgotEmail
    });
    if (res.success) {
      setForgotMsg("Password reset link sent. Check your email.");
    } else {
      setForgotMsg(res.error || "Error sending reset link.");
    }
    setForgotLoading(false);
  };

  return (
    <>
      <style>{`
        .csir-forgot-modal {
          position: fixed; z-index: 2000; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;
        }
        .csir-forgot-box {
          background: #fff; border-radius: 10px; max-width: 340px; width: 90vw; box-shadow: 0 0 32px #1e3a8a22;
          padding: 32px 24px 20px 24px; display: flex; flex-direction: column; align-items: center;
        }
        .csir-forgot-box h3 { color: #1e40af; font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
        .csir-forgot-box label { font-size: 15px; color: #444; margin-bottom: 6px; display: block; }
        .csir-forgot-box input {
          border: 1px solid #d1d5db; border-radius: 4px; padding: 7px 12px; width: 100%; font-size: 15px; margin-bottom: 12px;
        }
        .csir-forgot-box button {
          width: 100%; border-radius: 4px; border: none; background: #1e40af; color: white; font-size: 15px; font-weight: 600; padding: 10px; margin-top: 8px;
        }
        .csir-forgot-close {
          position: absolute; right: 20px; top: 15px; background: none; border: none; font-size: 22px; color: #888; cursor: pointer;
        }
        .csir-forgot-msg { font-size: 14px; color: #059669; margin-top: 7px; text-align: center; }
        .csir-forgot-err { color: #dc2626; }
      `}</style>
      {/* ---- your existing style block for csir-container etc remains below this! ---- */}
      <style>{`
        .csir-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fb923c 0%, #f97316 50%, #1e3a8a 100%);
          display: flex;
          flex-direction: row;
          font-family: Arial, sans-serif;
        }
        .csir-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .csir-header {
          background: #7c84b0;
          padding: 16px 32px;
          display: flex;
          align-items: center;
        }
        .csir-logo-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .csir-logo {
          width: 64px; height: 64px; border-radius: 50%;
          border: 2px solid white; overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        .csir-logo-img { width: 100%; height: 100%; object-fit: cover; }
        .csir-header-text { color: white; }
        .csir-header-hindi {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .csir-header-eng {
          font-size: 24px;
          font-weight: bold;
        }
        .csir-main-content {
          flex: 1;
          background: white;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .csir-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 48px;
          height: 48px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .csir-nav-btn-left { left: 16px; }
        .csir-nav-btn-right { right: 16px; }
        .csir-img-container { width: 100%; height: 80%; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .csir-img-wrapper { width: 100%; height: 100%; max-width: 800px; position: relative; overflow: hidden; }
        .csir-building-img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); transition: opacity 1s; }
        .csir-carousel-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
        .csir-carousel-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: background 0.3s; }
        .csir-active-dot { background: white; }
        .csir-right {
          width: 384px;
          min-width: 320px;
          background: linear-gradient(to bottom, #1e40af, #1e3a8a);
          display: flex; flex-direction: column;
        }
        .csir-portal-header { text-align: center; padding: 32px 0; }
        .csir-portal-title { color: white; font-size: 24px; font-weight: bold; margin: 0; }
        .csir-form-container { flex: 1; padding: 0 32px; }
        .csir-form-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 8px; padding: 24px; }
        .csir-form-title { color: white; font-size: 20px; font-weight: bold; text-align: center; margin: 0 0 24px 0; }
        .csir-error-message { background-color: rgba(220,53,69,0.8); color: white; padding: 10px; border-radius: 4px; margin-bottom: 16px; text-align: center; font-size: 14px; }
        .csir-success-message { background-color: rgba(34,197,94,0.92); color: white; padding: 10px; border-radius: 4px; margin-bottom: 16px; text-align: center; font-size: 14px; }
        .csir-form-group { margin-bottom: 16px; }
        .csir-label { color: white; font-size: 14px; display: block; margin-bottom: 4px; }
        .csir-required { color: #fca5a5; }
        .csir-input, .csir-captcha-input { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; color: white; font-size: 14px; outline: none; }
        .csir-captcha-container { display: flex; gap: 8px; align-items: flex-end; }
        .csir-captcha-display { background: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .csir-captcha-actions-row { display: flex; flex-direction: row; align-items: center; gap: 8px; margin-top: 6px; justify-content: space-between; }
        .csir-captcha-actions-left { display: flex; align-items: center; gap: 8px; }
        .csir-captcha-actions-right { display: flex; align-items: center; gap: 8px; }
        .csir-captcha-text { color: black; font-family: monospace; font-size: 18px; user-select: none; }
        .csir-refresh-btn, .csir-audio-btn { background: #fb923c; border: none; cursor: pointer; color: #fff; font-size: 20px; outline: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .csir-audio-btn { background: #1e40af; }
        .csir-verify-btn { font-size: 12px; color: #93c5fd; background: none; border: none; cursor: pointer; transition: color 0.3s; }
        .csir-submit-btn { width: 100%; background: #2563eb; color: white; padding: 12px; border-radius: 4px; font-weight: 600; font-size: 16px; border: none; cursor: pointer; margin-top: 24px; transition: background-color 0.3s; }
        .csir-action-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .csir-action-btn { width: 100%; background: #3b82f6; color: white; padding: 8px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.3s; }
        .csir-footer { height: 32px; }

        @media (max-width: 900px) {
          .csir-container { flex-direction: column; }
          .csir-left, .csir-right { width: 100% !important; min-width: 0 !important; }
          .csir-header { padding: 12px 10px; }
          .csir-portal-header { padding: 20px 0 8px 0; }
          .csir-portal-title { font-size: 20px; }
          .csir-main-content { min-height: 240px; }
          .csir-form-container { padding: 0 10px; }
          .csir-form-card { padding: 12px; }
          .csir-form-title { font-size: 16px; margin-bottom: 16px; }
          .csir-building-img { border-radius: 4px; }
          .csir-img-container { padding: 8px; }
          .csir-img-wrapper { max-width: 100%; }
        }
      `}</style>

      <div className="csir-container">
        <div className="csir-left">
          <div className="csir-header">
            <div className="csir-logo-container">
              <div className="csir-logo">
                <img src={logoImage} alt="CSIR-NPL Logo" className="csir-logo-img" />
              </div>
              <div className="csir-header-text">
                <div className="csir-header-hindi">सीएसआईआर-राष्ट्रीय भौतिक प्रयोगशाला</div>
                <div className="csir-header-eng">CSIR-National Physical Laboratory</div>
              </div>
            </div>
          </div>
          <div className="csir-main-content">
            <button
              className="csir-nav-btn csir-nav-btn-left"
              onMouseEnter={e => e.target.style.background = 'rgba(0,0,0,0.7)'}
              onMouseLeave={e => e.target.style.background = 'rgba(0,0,0,0.5)'}
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? carouselImages.length - 1 : prev - 1)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="csir-nav-btn csir-nav-btn-right"
              onMouseEnter={e => e.target.style.background = 'rgba(0,0,0,0.7)'}
              onMouseLeave={e => e.target.style.background = 'rgba(0,0,0,0.5)'}
              onClick={() => setCurrentImageIndex(prev => prev === carouselImages.length - 1 ? 0 : prev + 1)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="csir-img-container">
              <div className="csir-img-wrapper">
                <img
                  src={carouselImages[currentImageIndex]}
                  alt="CSIR-NPL"
                  className="csir-building-img"
                />
                <div className="csir-carousel-dots">
                  {carouselImages.map((_, index) => (
                    <div
                      key={index}
                      className={`csir-carousel-dot${index === currentImageIndex ? ' csir-active-dot' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="csir-right">
          <div className="csir-portal-header">
            <h1 className="csir-portal-title">SensorSync Portal</h1>
          </div>
          <div className="csir-form-container">
            <div className="csir-form-card">
              <h2 className="csir-form-title">{authMode === 'login' ? 'LOGIN' : 'REGISTER'}</h2>
              {error && <div className="csir-error-message">{error}</div>}
              {successMessage && <div className="csir-success-message">{successMessage}</div>}
              <form onSubmit={handleSubmit}>
                <div className="csir-form-group">
                  <label htmlFor="emailId" className="csir-label">
                    Email ID <span className="csir-required">*</span>
                  </label>
                  <input
                    id="emailId"
                    type="email"
                    name="emailId"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    className="csir-input"
                    required
                  />
                  {/* Show email domain error only on Register */}
                  {authMode === 'register' && emailDomainError && (
                    <div style={{ color: '#fde047', fontSize: '13px', marginTop: '2px' }}>
                      {emailDomainError}
                    </div>
                  )}
                </div>
                {authMode === 'register' && (
                  <div className="csir-form-group">
                    <label htmlFor="fullName" className="csir-label">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="csir-input"
                    />
                  </div>
                )}
                <div className="csir-form-group">
                  <label htmlFor="password" className="csir-label">
                    {authMode === 'register' ? 'Create Password' : 'Password'} <span className="csir-required">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="csir-input"
                    required
                  />
                  {/* Show password strength error only on Register */}
                  {authMode === 'register' && passwordStrengthError && (
                    <div style={{ color: '#fde047', fontSize: '13px', marginTop: '2px' }}>
                      {passwordStrengthError}
                    </div>
                  )}
                </div>
                {authMode === 'register' && (
                  <div className="csir-form-group">
                    <label htmlFor="confirmPassword" className="csir-label">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="csir-input"
                    />
                  </div>
                )}
                <div className="csir-form-group">
                  <label htmlFor="captcha" className="csir-label">
                    Captcha <span className="csir-required">*</span>
                  </label>
                  <div className="csir-captcha-container">
                    <input
                      id="captcha"
                      type="text"
                      name="captcha"
                      value={formData.captcha}
                      onChange={handleInputChange}
                      className="csir-captcha-input"
                      required
                    />
                    <div className="csir-captcha-display">
                      <span className="csir-captcha-text">{captcha.question}</span>
                    </div>
                  </div>
                  <div className="csir-captcha-actions-row">
                    <div className="csir-captcha-actions-left">
                      <button
                        type="button"
                        className="csir-verify-btn"
                        onClick={handleCaptchaVerify}
                        onMouseEnter={e => e.target.style.color = 'white'}
                        onMouseLeave={e => e.target.style.color = '#93c5fd'}
                      >
                        VERIFY
                      </button>
                      {captchaVerified === true && (
                        <div style={{ color: 'lightgreen', fontSize: '13px', marginLeft: '10px' }}>
                          Captcha correct!
                        </div>
                      )}
                      {captchaVerified === false && (
                        <div style={{ color: 'salmon', fontSize: '13px', marginLeft: '10px' }}>
                          Wrong captcha, try again.
                        </div>
                      )}
                    </div>
                    <div className="csir-captcha-actions-right">
                      <button
                        type="button"
                        aria-label="Play audio captcha"
                        title="Play audio captcha"
                        onClick={handlePlayCaptchaAudio}
                        className="csir-audio-btn"
                      >
                        <span role="img" aria-label="audio">🔊</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Refresh captcha"
                        title="Refresh captcha"
                        onClick={() => {
                          window.speechSynthesis.cancel();
                          setCaptcha(generateSmartCaptcha());
                          setFormData({ ...formData, captcha: '' });
                          setCaptchaVerified(null);
                        }}
                        className="csir-refresh-btn"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="csir-submit-btn"
                  onMouseEnter={e => e.target.style.background = '#1d4ed8'}
                  onMouseLeave={e => e.target.style.background = '#2563eb'}
                >
                  {authMode === 'register' ? 'CREATE ACCOUNT' : 'LOGIN'}
                </button>
                <div className="csir-action-buttons">
                  {authMode === 'login' && (
                    <button
                      type="button"
                      className="csir-action-btn"
                      onClick={() => setShowForgotModal(true)}
                    >
                      FORGOT PASSWORD
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setError('');
                      setSuccessMessage('');
                      setFormData({
                        emailId: authMode === 'register' ? formData.emailId : '',
                        password: '',
                        fullName: '',
                        confirmPassword: '',
                        captcha: ''
                      });
                      setCaptcha(generateSmartCaptcha());
                      setCaptchaVerified(null);
                      setEmailDomainError('');
                      setPasswordStrengthError('');
                    }}
                    className="csir-action-btn"
                  >
                    {authMode === 'login' ? 'NEW? REGISTER NOW' : 'ALREADY HAVE AN ACCOUNT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="csir-footer"></div>
        </div>
      </div>
      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="csir-forgot-modal">
          <form className="csir-forgot-box" onSubmit={handleForgotPassword}>
            <button type="button" className="csir-forgot-close" onClick={() => { setShowForgotModal(false); setForgotMsg(''); setForgotEmail(''); }}>&times;</button>
            <h3>Forgot Password</h3>
            <label htmlFor="forgot-email">Enter your registered Email ID</label>
            <input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
            <button type="submit" disabled={forgotLoading}>{forgotLoading ? "Sending..." : "Send Reset Link"}</button>
            {forgotMsg && (
              <div className={`csir-forgot-msg${forgotMsg.startsWith("Error") ? " csir-forgot-err" : ""}`}>{forgotMsg}</div>
            )}
          </form>
        </div>
      )}
    </>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleAuthSuccess = (role, userData) => {

    setUserRole(role);
    setUser(userData);

    // ✅ Store user in localStorage for Profile.jsx
    localStorage.setItem('user', JSON.stringify({
      email: userData.email,
      role: role,
      id: userData.id || null,
      name: userData.name || ''
    }));

    setCurrentView('dashboard');
    setActiveSection('dashboard');
  };
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.email) {
      setUser(storedUser);
      setUserRole(storedUser.role);
      setCurrentView('dashboard');
    }
  }, []);


  const handleLogout = async () => {

    await authPhpRequest({ action: 'logout' });
    setUser(null);
    setUserRole(null);
    setCurrentView('landing');
    setActiveSection('dashboard');

    // ⬅️ Remove user from localStorage
    localStorage.removeItem('user');

  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'realtime':
        return <RealTime />;
      case 'history':
        return <History />;
      case 'map':
        return <SensorMap />;
      case 'analysis':
        return <Analysis />;
      case 'data validation':
        return <DataValidation />;
      case 'user':
        return userRole === 'admin' ? <User /> : <Dashboard />;
      case 'sensoractivity':
        return userRole === 'admin' ? <SensorActivity /> : <Dashboard />;
      case 'sensorinfo':
        return userRole === 'admin' ? <SensorInformation /> : <Dashboard />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  if (currentView === 'landing') {
    return <CSIRSensorSyncPortal onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userRole={userRole}
        user={user}
        onLogout={handleLogout}
      />
      <div
        style={{
          marginLeft: '200px',
          padding: '20px',
          width: 'calc(100% - 200px)',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
