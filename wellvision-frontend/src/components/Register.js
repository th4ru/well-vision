import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
  credentials: 'include',
});


      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Registration successful. Please verify your email.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div
        className="register-left"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/vision.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      <div className="register-right">
        <div className="register-box">
          <h1>Register</h1>
          <h3>WELL VISION</h3>
          <form onSubmit={handleRegister}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'SUBMIT'}
            </button>
            {message && <p>{message}</p>}
            <p style={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link to="/" style={{ color: '#000', fontWeight: 'bold' }}>
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
