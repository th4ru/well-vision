import React, { useState, useContext } from 'react';
import './Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',  // important for cookies
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        loginUser(data.user); // store user in context

        // ✅ Redirect based on role (case-insensitive check)
        if (data.user.role && data.user.role.toLowerCase() === 'admin') {
          navigate('/admin/dashboard'); // admin dashboard
        } else {
          navigate('/dashboard'); // normal dashboard
        }
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Fallback authentication for development/testing
      if (email === 'admin@example.com' && password === 'Admin123') {
        const mockAdminUser = {
          _id: 'admin-id-placeholder',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          occupation: 'Administrator'
        };
        loginUser(mockAdminUser);
        navigate('/admin/dashboard');
        return;
      } else if (email === 'user@wellvision.com' && password === 'user123') {
        const mockUser = {
          _id: '63701cc1f03239b7f700001e',
          name: 'Test User',
          email: 'user@wellvision.com',
          role: 'user',
          occupation: 'Customer'
        };
        loginUser(mockUser);
        navigate('/dashboard');
        return;
      }
      
      setMessage('Server error. Try admin@example.com / Admin123 for admin access.');
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
          <h1>Login</h1>
          <h3>WELL VISION</h3>
          <form onSubmit={handleSubmit}>
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

            <button type="submit">SUBMIT</button>

            {message && <p className="message">{message}</p>}

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px' }}>
                Forgot Password?
              </Link>
              <br />
              <span style={{ fontSize: '13px' }}>
                Don't have an account?{' '}
                <Link to="/register">
                  <strong>Register</strong>
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
