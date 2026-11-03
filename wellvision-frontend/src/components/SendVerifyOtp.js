import React, { useState, useContext } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SendVerifyOtp() {
  const [message, setMessage] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/send-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('OTP sent. Please check your email.');
        setTimeout(() => navigate('/verify-email'), 2000);
      } else {
        setMessage(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-left"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/vision.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      <div className="login-right">
        <div className="login-box">
          <h1>Email Verification</h1>
          <p>Click the button to receive an OTP to verify your account.</p>
          <button onClick={handleSendOtp}>Send OTP</button>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default SendVerifyOtp;
