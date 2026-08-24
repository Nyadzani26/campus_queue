// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    student_number: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_number: formData.student_number,
        password: formData.password,
        password2: formData.password2,
      });

      if (response.ok || response.status === 201) {
        setSuccess('🎉 Account registered successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        const data = await response.json();
        let msg = 'Registration failed.';
        if (data.username) msg = `Username: ${Array.isArray(data.username) ? data.username.join(' ') : data.username}`;
        else if (data.email) msg = `Email: ${Array.isArray(data.email) ? data.email.join(' ') : data.email}`;
        else if (data.student_number) msg = `Student Number: ${Array.isArray(data.student_number) ? data.student_number.join(' ') : data.student_number}`;
        else if (data.detail) msg = data.detail;
        setError(msg);
      }
    } catch (err) {
      setError('Network error connecting to registration service');
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

      {/* Main Form Container */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1.5rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', background: '#ffffff', color: '#1e293b', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', background: '#ffb800', color: '#001a33', fontWeight: 900, padding: '8px 16px', borderRadius: '10px', fontSize: '1.4rem', letterSpacing: '1px', marginBottom: '12px' }}>SPU</div>
            <h2 style={{ fontSize: '1.8rem', color: '#003366', fontWeight: 800 }}>Student Registration</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px' }}>Create your official SPU Smart Queue account</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.9rem', fontWeight: 600 }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Nyadzani"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Chauke"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Student Number</label>
              <input
                type="text"
                name="student_number"
                value={formData.student_number}
                onChange={handleChange}
                placeholder="e.g. 22109874"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose username"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Student Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@spu.ac.za"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Confirm Password</label>
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px', fontSize: '1rem', marginTop: '8px' }}>
              {loading ? 'Creating Account...' : 'Complete Registration →'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.2rem', fontSize: '0.9rem', color: '#64748b' }}>
            Already registered? <Link to="/login" style={{ color: '#0066cc', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
        © {new Date().getFullYear()} Sol Plaatje University • Smart Queue System
      </footer>
    </div>
  );
};

export default Register;