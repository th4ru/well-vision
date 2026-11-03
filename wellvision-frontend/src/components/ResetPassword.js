import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successful.');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage(data.message || 'Invalid or expired OTP');
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
          <h1>Reset Password</h1>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit">Reset</button>
            {message && <p>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
