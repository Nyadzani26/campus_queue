// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await login(username, password);
      const data = await response.json();

      if (response.ok) {
        loginUser(data.token, data.user);
        setMessage('✅ Login successful!');
        
        const isSuperuser = data.user?.is_superuser === true;
        const isStaff = data.user?.is_staff === true || data.user?.role === 'Staff' || data.user?.role === 'staff';
        
        setTimeout(() => {
          if (isSuperuser) {
            navigate('/admin-dashboard');
          } else if (isStaff) {
            navigate('/staff-dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 400);
      } else {
        setMessage(`❌ ${data.detail || data.error || 'Invalid username or password'}`);
      }
    } catch (error) {
      setMessage('❌ Network error: Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #001a33 0%, #003366 100%)', color: '#fff' }}>
      {/* Top Header Bar */}
      <header className="spu-header" style={{ background: 'transparent', boxShadow: 'none' }}>
        <div className="spu-header-container">
          <div className="spu-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="spu-logo-badge">SPU</div>
            <div className="spu-title-group">
              <span className="spu-brand-title">Sol Plaatje University</span>
              <span className="spu-brand-sub">Smart Queue Management</span>
            </div>
          </div>
          <Link to="/" className="nav-link">← Back to Landing Page</Link>
        </div>
      </header>

      {/* Main Login Card Wrapper */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1.5rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', background: '#ffffff', color: '#1e293b', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', background: '#ffb800', color: '#001a33', fontWeight: 900, padding: '8px 16px', borderRadius: '10px', fontSize: '1.4rem', letterSpacing: '1px', marginBottom: '12px' }}>SPU</div>
            <h2 style={{ fontSize: '1.8rem', color: '#003366', fontWeight: 800 }}>Account Sign In</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px' }}>Access your student or staff queue portal</p>
          </div>

          {message && (
            <div style={{ background: message.includes('✅') ? '#ecfdf5' : '#fef2f2', border: `1px solid ${message.includes('✅') ? '#a7f3d0' : '#fecaca'}`, color: message.includes('✅') ? '#065f46' : '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.98rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.98rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', fontSize: '1.05rem', marginTop: '6px' }}>
              {loading ? 'Authenticating...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', fontSize: '0.92rem', color: '#64748b' }}>
            Don't have a student account? <Link to="/register" style={{ color: '#0066cc', fontWeight: 700, textDecoration: 'none' }}>Register Here</Link>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
        © {new Date().getFullYear()} Sol Plaatje University • Smart Queue System
      </footer>
    </div>
  );
};

export default Login;