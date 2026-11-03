import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, otp }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Email verified successfully!');
        // Redirect to dashboard or login
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setMessage('Server error');
    }
  };

  return (
    <div>
      <h2>Verify Your Email</h2>
      <form onSubmit={handleVerify}>
        <label>Enter OTP sent to your email:</label>
        <input
          type="text"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          required
        />
        <button type="submit">Verify</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default VerifyEmail;
