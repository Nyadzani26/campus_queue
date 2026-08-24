// frontend/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../api';
import { 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  ShieldCheck,
  User,
  LogOut
} from 'lucide-react';

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
      {/* Top Header */}
      <header className="spu-header">
        <div className="spu-header-container">
          <div className="spu-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="spu-logo-badge">SPU</div>
            <div className="spu-title-group">
              <span className="spu-brand-title">Sol Plaatje University</span>
              <span className="spu-brand-sub">Campus Queue System</span>
            </div>
          </div>
          <nav className="spu-nav">
            <a href="#services" className="nav-link">Services</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#about" className="nav-link">About SPU</a>
            {user ? (
              <div className="user-auth-pill">
                <span className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Logged in as <strong>{user.first_name || user.username}</strong>
                </span>
                <button onClick={handleDashboardRedirect} className="btn-dash">Dashboard</button>
                <button onClick={logoutUser} className="btn-logout-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LogOut size={14} /> Logout
                </button>
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
        <div className="spu-hero-content">
          <div className="hero-text-block">
            <span className="hero-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Sol Plaatje University Student Services
            </span>
            <h1>Virtual Queue Management</h1>
            <p>
              Join department service queues online from anywhere on campus, track your estimated wait time in real-time, and receive updates when staff are ready to assist you.
            </p>
            <div className="hero-cta-group">
              {user ? (
                <button onClick={handleDashboardRedirect} className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Go to Student Dashboard <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <Link to="/register" className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Register Account <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn-hero-secondary">Sign In</Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-card-preview">
            <div className="hero-img-frame">
              <img 
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80" 
                alt="Sol Plaatje University Campus" 
                className="hero-img"
              />
              <div className="hero-badge-float">
                <span className="pulse-dot"></span>
                <span>{departments.length || 5} Departments Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stats-container">
          <div className="stat-item">
            <h3>Digital</h3>
            <p>Online Queue Tickets</p>
          </div>
          <div className="stat-item">
            <h3>Real-Time</h3>
            <p>Live Wait Estimates</p>
          </div>
          <div className="stat-item">
            <h3>3 Campuses</h3>
            <p>Central, South & Luka Jantjie</p>
          </div>
          <div className="stat-item">
            <h3>Multi-Desk</h3>
            <p>Academic & Student Support</p>
          </div>
        </div>
      </section>

      {/* Services Listing Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <span className="section-badge">Student Services</span>
          <h2>Active Department Queues</h2>
          <p>Select a department service below to view operating hours and join the queue.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading departments...</div>
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
                    {dept.is_open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="dept-code">{dept.code}</div>
                  <h3>{dept.name}</h3>
                  <p className="dept-desc">{dept.description || 'Assisting students with university inquiries and support.'}</p>
                  
                  <div className="dept-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="#64748b" /> Location: {dept.location || 'Central Campus'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="#64748b" /> Hours: {dept.opens_at ? dept.opens_at.slice(0,5) : '08:00'} - {dept.closes_at ? dept.closes_at.slice(0,5) : '16:00'}
                    </div>
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
                      <Link to="/dashboard" className="btn-join-dept" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        Join Queue <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link to="/login" className="btn-join-dept" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        Sign In to Join <ArrowRight size={16} />
                      </Link>
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
          <span className="section-badge">Process</span>
          <h2>How to Use the Service</h2>
          <p>Follow these steps to access department services efficiently.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Sign In & Select Service</h3>
            <p>Log in with your student account credentials and choose the department you need to visit.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Receive Ticket</h3>
            <p>Get your digital ticket number with estimated wait times updated in real-time.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Report to Counter</h3>
            <p>Arrive at the department counter when your ticket number is called by staff.</p>
          </div>
        </div>
      </section>

      {/* About SPU Section */}
      <section id="about" className="about-spu-section">
        <div className="about-content">
          <div className="about-text">
            <span className="section-badge">Sol Plaatje University</span>
            <h2>Kimberley Campus Operations</h2>
            <p>
              Sol Plaatje University provides centralized student administration services across campuses in Kimberley, Northern Cape.
            </p>
            <ul className="about-list">
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#0066cc" /> Integrated digital student queue management
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#0066cc" /> Support for Financial Aid, NSFAS, ICT Helpdesk, and Registration
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#0066cc" /> Real-time counter dispatching for staff
              </li>
            </ul>
          </div>
          <div className="about-gallery">
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80" 
              alt="SPU Students" 
              className="gallery-img"
            />
            <img 
              src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=600&q=80" 
              alt="SPU Campus Library" 
              className="gallery-img"
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
            <h4>Navigation</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#how-it-works">How it Works</a></li>
              <li><Link to="/login">Student Login</Link></li>
              <li><Link to="/register">Register Account</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support Enquiries</h4>
            <ul>
              <li>ICT Helpdesk: helpdesk@spu.ac.za</li>
              <li>Financial Aid: financialaid@spu.ac.za</li>
              <li>Admissions: admissions@spu.ac.za</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Sol Plaatje University. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
