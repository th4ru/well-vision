import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('OTP sent! Check your email.');
        setTimeout(() => navigate('/reset-password'), 1500);
      } else {
        setMessage(data.message || 'Error sending OTP.');
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
          <h1>Forgot Password</h1>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send OTP</button>
            {message && <p>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
