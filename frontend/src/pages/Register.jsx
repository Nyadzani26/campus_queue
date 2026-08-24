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
    setLoading(true);

    // Check if passwords match
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Check student number
    if (!formData.student_number) {
      setError('Student number is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_number: formData.student_number,
        password: '********',
        password2: '********',
      });

      const response = await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_number: formData.student_number,
        password: formData.password,
        password2: formData.password2,
      });

      console.log('Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        // Redirect to login page
        navigate('/');
      } else {
        const data = await response.json();
        console.error('Registration error response:', data);
        
        // Parse Django's error messages
        let errorMessage = '';
        if (typeof data === 'object' && data !== null) {
          // Django REST Framework error format
          if (data.first_name) {
            errorMessage = `First Name: ${Array.isArray(data.first_name) ? data.first_name.join(', ') : data.first_name}`;
          } else if (data.last_name) {
            errorMessage = `Last Name: ${Array.isArray(data.last_name) ? data.last_name.join(', ') : data.last_name}`;
          } else if (data.student_number) {
            errorMessage = `Student Number: ${Array.isArray(data.student_number) ? data.student_number.join(', ') : data.student_number}`;
          } else if (data.username) {
            errorMessage = `Username: ${Array.isArray(data.username) ? data.username.join(', ') : data.username}`;
          } else if (data.email) {
            errorMessage = `Email: ${Array.isArray(data.email) ? data.email.join(', ') : data.email}`;
          } else if (data.password) {
            errorMessage = `Password: ${Array.isArray(data.password) ? data.password.join(', ') : data.password}`;
          } else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) 
              ? data.non_field_errors.join(', ') 
              : data.non_field_errors;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else {
            // Try to extract any error message from the response
            errorMessage = JSON.stringify(data);
          }
        } else {
          errorMessage = 'Registration failed. Please check your details.';
        }
        setError(errorMessage || 'Registration failed. Please check your details.');
      }
    } catch (error) {
      console.error('Network error during registration:', error);
      setError('Network error. Could not connect to the server. Please make sure Django is running on http://localhost:8000');
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
          <p style={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              placeholder="Choose a username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your email address"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your first name"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your last name"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Student Number</label>
            <input
              type="text"
              name="student_number"
              value={formData.student_number}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your student number"
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Min 8 characters"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              style={styles.input}
              placeholder="Confirm your password"
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/" style={styles.link}>Sign in</Link>
        </p>

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
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    color: '#1a73e8',
    fontSize: '32px',
    margin: '0',
  },
  title: {
    color: '#333',
    margin: '5px 0',
  },
  subtitle: {
    color: '#888',
    margin: '5px 0 0 0',
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
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: '10px',
    marginBottom: '0',
    padding: '10px',
    backgroundColor: '#fde8e8',
    borderRadius: '4px',
    fontSize: '14px',
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
  university: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '12px',
    color: '#888',
  },
};

export default Register;