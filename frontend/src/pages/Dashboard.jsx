// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDepartments, 
  getMyActiveTicket, 
  joinQueue, 
  cancelTicket 
} from '../api';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [note, setNote] = useState('');
  const [myTicket, setMyTicket] = useState(null);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const showAlert = (title, message, type = 'success') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  useEffect(() => {
    fetchDepartments();
    fetchMyTicket();
    const interval = setInterval(() => {
      fetchMyTicket();
      fetchDepartments();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : (data.results || []));
        setError('');
      } else {
        setError('Failed to load departments');
      }
    } catch (err) {
      setError('Network error: Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTicket = async () => {
    try {
      const response = await getMyActiveTicket();
      if (response.ok) {
        const data = await response.json();
        setMyTicket(data);
      } else if (response.status === 404) {
        setMyTicket(null);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
    }
  };

  const handleJoinQueue = async () => {
    if (!selectedDepartment) return;
    setJoinLoading(true);
    try {
      const response = await joinQueue(selectedDepartment.id, note);
      const data = await response.json();
      if (response.ok || response.status === 201) {
        setMyTicket(data);
        setShowJoinModal(false);
        setNote('');
        showAlert('🎉 Queue Joined!', `You have been issued ticket ${data.ticket_code || data.number}. Position #${data.position}`);
      } else {
        showAlert('Unable to Join Queue', data.detail || 'Could not join queue.', 'error');
      }
    } catch (err) {
      showAlert('Network Error', 'Could not connect to the server', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!myTicket) return;
    setCancelLoading(true);
    try {
      const response = await cancelTicket(myTicket.id);
      if (response.ok) {
        setMyTicket(null);
        setShowCancelModal(false);
        showAlert('Ticket Cancelled', 'Your ticket was successfully cancelled.', 'success');
      } else {
        const data = await response.json();
        showAlert('Cancellation Failed', data.detail || 'Failed to cancel ticket.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Network error while cancelling ticket.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fa' }}>
      {/* Top Header */}
      <header className="spu-header">
        <div className="spu-header-container">
          <div className="spu-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="spu-logo-badge">SPU</div>
            <div className="spu-title-group">
              <span className="spu-brand-title">Sol Plaatje University</span>
              <span className="spu-brand-sub">Student Portal Dashboard</span>
            </div>
          </div>
          <div className="spu-nav">
            <Link to="/" className="nav-link">Home</Link>
            <div className="user-auth-pill">
              <span className="user-greeting">
                👋 <strong>{user?.first_name || user?.username}</strong>
                <span className="role-tag-pill">{user?.role || 'Student'}</span>
              </span>
              <button onClick={logoutUser} className="btn-logout-sm">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-container">
        {/* Page Banner */}
        <div className="page-banner">
          <div className="page-banner-title">
            <h1>Student Service Hub</h1>
            <p>Welcome back, {user?.first_name || user?.username} ({user?.student_number || 'SPU Student'}). View your live ticket status or join a department queue.</p>
          </div>
          <div className="banner-badge">
            <span>🟢 Campus Queues Active</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600' }}>
            ❌ {error}
          </div>
        )}

        {/* Live Ticket Card */}
        {myTicket && (
          <div className="active-ticket-banner">
            <div className="ticket-header-row">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
                  YOUR ACTIVE DIGITAL TICKET
                </span>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '2px 0 0' }}>
                  {myTicket.department || 'Department Queue'}
                </h3>
              </div>
              <span className={`ticket-status-pill ${myTicket.status}`}>
                {myTicket.status_display || myTicket.status}
              </span>
            </div>

            <div className="ticket-grid-details">
              <div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>Ticket Code</div>
                <div className="big-ticket-code">{myTicket.ticket_code || myTicket.number}</div>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Queue Position</span>
                <span className="ticket-meta-value">#{myTicket.position || 1} in line</span>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Est. Wait Time</span>
                <span className="ticket-meta-value">⏱️ ~{myTicket.estimated_wait_minutes || myTicket.estimated_wait || 5} mins</span>
              </div>

              <div>
                <button onClick={() => setShowCancelModal(true)} className="btn-cancel-ticket">
                  Cancel Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Departments Grid */}
        <section style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#003366', fontWeight: '800' }}>Available Department Queues</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Select a service counter below to join today's virtual queue.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Loading active queues...</div>
          ) : (
            <div className="services-grid">
              {departments.map((dept) => (
                <div key={dept.id} className="service-card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="dept-code">{dept.code}</span>
                      <span className={`status-pill ${dept.is_open ? 'open' : 'closed'}`}>
                        {dept.is_open ? '🟢 Open' : '🔴 Closed'}
                      </span>
                    </div>
                    <h3>{dept.name}</h3>
                    <p className="dept-desc">{dept.description || 'Student support & administrative service desk.'}</p>
                    
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
                        <span className="chip-label">Est. Wait</span>
                        <span className="chip-val">{dept.avg_service_minutes || 10}m</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button 
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowJoinModal(true);
                        }}
                        disabled={!dept.is_open || (myTicket && myTicket.status !== 'CANCELLED')}
                        className="btn-join-dept"
                        style={{
                          opacity: (!dept.is_open || (myTicket && myTicket.status !== 'CANCELLED')) ? 0.5 : 1,
                          cursor: (!dept.is_open || (myTicket && myTicket.status !== 'CANCELLED')) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {myTicket && myTicket.status !== 'CANCELLED' ? 'Already in Queue' : (dept.is_open ? 'Join Queue →' : 'Queue Closed')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Join Queue Modal */}
        <Modal 
          isOpen={showJoinModal} 
          onClose={() => setShowJoinModal(false)}
          title={`Join ${selectedDepartment?.name || 'Queue'}`}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1rem' }}>
              You are joining the virtual queue for <strong>{selectedDepartment?.name}</strong>. Provide an optional note for staff.
            </p>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>Reason for Visit (Optional)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. NSFAS allowance query, IT password reset..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJoinModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleJoinQueue} disabled={joinLoading} className="btn-primary">
                {joinLoading ? 'Joining...' : 'Confirm & Join'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Your Ticket?"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to cancel ticket <strong>{myTicket?.ticket_code}</strong>? You will lose your position in line.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Keep Ticket</button>
              <button onClick={handleCancelTicket} disabled={cancelLoading} className="btn-cancel-ticket" style={{ background: '#dc2626', color: '#fff' }}>
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Ticket'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Alert Dialog Modal */}
        <Modal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          title={alertTitle}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: alertType === 'error' ? '#991b1b' : '#1e293b', fontSize: '1rem', marginBottom: '1.5rem' }}>{alertMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlertModal(false)} className="btn-primary">OK</button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Dashboard;