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

      // 🔥 LOG EVERYTHING
      console.log('===== LOGIN RESPONSE =====');
      console.log('Full response:', data);
      console.log('Token:', data.token);
      console.log('User object:', data.user);
      console.log('All user fields:', Object.keys(data.user || {}));
      console.log('is_superuser:', data.user?.is_superuser);
      console.log('is_staff:', data.user?.is_staff);
      console.log('role:', data.user?.role);
      console.log('department:', data.user?.department);
      console.log('===========================');

      if (response.ok) {
        loginUser(data.token, data.user);
        setMessage('✅ Login successful!');
        
        // 🔥 SIMPLIFIED CHECKS
        const isSuperuser = data.user?.is_superuser === true;
        const isStaff = data.user?.is_staff === true || data.user?.role === 'Staff' || data.user?.role === 'staff';
        
        console.log('Is superuser?', isSuperuser);
        console.log('Is staff?', isStaff);
        
        setTimeout(() => {
          if (isSuperuser) {
            console.log('🔴 REDIRECTING TO: /admin-dashboard');
            navigate('/admin-dashboard');
          } else if (isStaff) {
            console.log('🔵 REDIRECTING TO: /staff-dashboard');
            navigate('/staff-dashboard');
          } else {
            console.log('🟢 REDIRECTING TO: /dashboard');
            navigate('/dashboard');
          }
        }, 500);
      } else {
        setMessage(`❌ ${data.error || 'Invalid credentials'}`);
      }
    } catch (error) {
      setMessage('❌ Network error: Could not connect to the server');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>SQ</h1>
          <h2 style={styles.title}>SmartQueue</h2>
          <p style={styles.subtitle}>Skip the line. Not the service.</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Your username"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Your password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {message && (
            <p style={message.includes('✅') ? styles.success : styles.error}>
              {message}
            </p>
          )}
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>

        <div style={styles.features}>
          <p>• Join queues from anywhere on campus</p>
          <p>• Real-time position and wait estimates</p>
          <p>• Five departments, one platform</p>
        </div>

        <p style={styles.university}>SOL PLAATJE UNIVERSITY • KIMBERLEY</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    color: '#1a73e8',
    fontSize: '36px',
    margin: '0',
  },
  title: {
    color: '#333',
    margin: '5px 0',
  },
  subtitle: {
    color: '#666',
    margin: '5px 0 0 0',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginTop: '15px',
    marginBottom: '0',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '15px',
    marginBottom: '0',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
  },
  link: {
    color: '#1a73e8',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  features: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    color: '#555',
    fontSize: '14px',
  },
  university: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '12px',
    color: '#888',
  },
};

export default Login;