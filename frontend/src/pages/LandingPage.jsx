// frontend/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../api';

const LandingPage = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepts();
  }, []);

  const fetchDepts = async () => {
    try {
      const res = await getDepartments();
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error('Failed to load departments:', e);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentImage = (code) => {
    switch (code?.toUpperCase()) {
      case 'ICT':
        return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80';
      case 'FIN':
        return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
      case 'ADM':
        return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80';
      case 'ACC':
        return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';
      case 'HEALTH':
      case 'WELL':
        return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80';
      default:
        return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80';
    }
  };

  const handleDashboardRedirect = () => {
    if (user?.is_superuser) navigate('/admin-dashboard');
    else if (user?.is_staff || user?.role === 'staff' || user?.role === 'Staff') navigate('/staff-dashboard');
    else navigate('/dashboard');
  };

  return (
    <div className="landing-wrapper">
      {/* Top Header / Navigation Bar */}
      <header className="spu-header">
        <div className="spu-header-container">
          <div className="spu-brand" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <div className="spu-logo-badge">SPU</div>
            <div className="spu-title-group">
              <span className="spu-brand-title">Sol Plaatje University</span>
              <span className="spu-brand-sub">Smart Queue Management</span>
            </div>
          </div>
          <nav className="spu-nav">
            <a href="#services" className="nav-link">Services</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#about" className="nav-link">About SPU</a>
            {user ? (
              <div className="user-auth-pill">
                <span className="user-greeting">👋 Hi, <strong>{user.first_name || user.username}</strong></span>
                <button onClick={handleDashboardRedirect} className="btn-dash">My Dashboard</button>
                <button onClick={logoutUser} className="btn-logout-sm">Logout</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login-outline">Sign In</Link>
                <Link to="/register" className="btn-register-solid">Register</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="spu-hero">
        <div className="spu-hero-overlay"></div>
        <div className="spu-hero-content">
          <div className="hero-text-block">
            <span className="hero-tag">🎓 SPU Campus Operations</span>
            <h1>Skip the Line. Save Your Time.</h1>
            <p>
              Welcome to the official Sol Plaatje University Smart Queue System. 
              Join campus queues virtually from anywhere, track estimated wait times in real-time, 
              and receive notifications when it’s your turn.
            </p>
            <div className="hero-cta-group">
              {user ? (
                <button onClick={handleDashboardRedirect} className="btn-hero-primary">
                  Go to Dashboard →
                </button>
              ) : (
                <>
                  <Link to="/register" className="btn-hero-primary">Get Started Now</Link>
                  <Link to="/login" className="btn-hero-secondary">Student / Staff Login</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-card-preview">
            <div className="hero-img-frame">
              <img 
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80" 
                alt="Sol Plaatje University Campus Life" 
                className="hero-img"
              />
              <div className="hero-badge-float">
                <span className="pulse-dot"></span>
                <span>{departments.length || 5} Departments Active Today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Bar */}
      <section className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <h3>⚡ 100%</h3>
            <p>Digital Queue Management</p>
          </div>
          <div className="stat-item">
            <h3>⏱️ &lt; 15 mins</h3>
            <p>Average Wait Time Saved</p>
          </div>
          <div className="stat-item">
            <h3>🏫 3 Campuses</h3>
            <p>Central, South & Luka Jantjie</p>
          </div>
          <div className="stat-item">
            <h3>📱 Real-Time</h3>
            <p>Live Queue Tracking</p>
          </div>
        </div>
      </section>

      {/* Services Listing Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <span className="section-badge">CAMPUS SERVICES</span>
          <h2>Active Service Queues</h2>
          <p>Select a department below to view operating hours and current queue status.</p>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading departments...</div>
        ) : (
          <div className="services-grid">
            {departments.map((dept) => (
              <div key={dept.id} className="service-card">
                <div className="card-img-wrapper">
                  <img 
                    src={getDepartmentImage(dept.code)} 
                    alt={dept.name} 
                    className="card-img"
                  />
                  <span className={`status-pill ${dept.is_open ? 'open' : 'closed'}`}>
                    {dept.is_open ? '🟢 Open Now' : '🔴 Closed'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="dept-code">{dept.code}</div>
                  <h3>{dept.name}</h3>
                  <p className="dept-desc">{dept.description || 'Assisting students with university inquiries and support.'}</p>
                  
                  <div className="dept-meta">
                    <div>📍 {dept.location || 'Central Campus'}</div>
                    <div>🕒 {dept.opens_at ? dept.opens_at.slice(0,5) : '08:00'} - {dept.closes_at ? dept.closes_at.slice(0,5) : '16:00'}</div>
                  </div>

                  <div className="dept-stats-row">
                    <div className="stat-chip">
                      <span className="chip-label">Waiting</span>
                      <span className="chip-val">{dept.waiting_count ?? 0}</span>
                    </div>
                    <div className="stat-chip">
                      <span className="chip-label">Avg. Service</span>
                      <span className="chip-val">{dept.avg_service_minutes || 10} min</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {user ? (
                      <Link to="/dashboard" className="btn-join-dept">Join Queue →</Link>
                    ) : (
                      <Link to="/login" className="btn-join-dept">Login to Join →</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-section">
        <div className="section-header">
          <span className="section-badge">SIMPLE & CONVENIENT</span>
          <h2>How Smart Queue Works</h2>
          <p>Get served in 3 simple steps without standing in long corridors.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Select & Register</h3>
            <p>Log in with your SPU student credentials and choose the department service you need help with.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Track Live Ticket</h3>
            <p>Get a digital ticket number (e.g. ICT-004) with estimated wait time and live updates on your phone.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Arrive When Called</h3>
            <p>Walk over to the service counter when your ticket is called and receive instant staff support!</p>
          </div>
        </div>
      </section>

      {/* SPU Campus Showcase */}
      <section id="about" className="about-spu-section">
        <div className="about-content">
          <div className="about-text">
            <span className="section-badge">SOL PLAATJE UNIVERSITY</span>
            <h2>Kimberley's Premier Institution</h2>
            <p>
              Established in 2013 in the historic diamond city of Kimberley, Sol Plaatje University is dedicated 
              to academic excellence, innovation, and seamless student support services across Northern Cape.
            </p>
            <ul className="about-list">
              <li>✅ Centralized digital student services</li>
              <li>✅ Reduced waiting times for NSFAS, Financial Aid & IT Support</li>
              <li>✅ Real-time staff queue dispatching</li>
            </ul>
          </div>
          <div className="about-gallery">
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80" 
              alt="Students on SPU Campus" 
              className="gallery-img main"
            />
            <img 
              src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=600&q=80" 
              alt="SPU Library" 
              className="gallery-img sub"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="spu-footer">
        <div className="footer-container">
          <div className="footer-col">
            <div className="spu-brand text-white">
              <div className="spu-logo-badge">SPU</div>
              <span className="spu-brand-title white">Sol Plaatje University</span>
            </div>
            <p className="footer-text">
              Chapel Street, Kimberley, 8301<br/>
              Northern Cape, South Africa<br/>
              General Enquiries: +27 (0)53 491 0000
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#services">Departments & Services</a></li>
              <li><a href="#how-it-works">How it Works</a></li>
              <li><Link to="/login">Student Login</Link></li>
              <li><Link to="/register">Register Account</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support Services</h4>
            <ul>
              <li>ICT Helpdesk: helpdesk@spu.ac.za</li>
              <li>Financial Aid: financialaid@spu.ac.za</li>
              <li>Admissions: admissions@spu.ac.za</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Sol Plaatje University Smart Queue System. Developed for Service Driven Systems.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
