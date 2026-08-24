// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getDepartments, 
  getMyActiveTicket, 
  getMyTickets,
  joinQueue, 
  cancelTicket 
} from '../api';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [ticketHistory, setTicketHistory] = useState([]);
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

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  useEffect(() => {
    fetchDepartments();
    fetchMyTicket();
    fetchTicketHistory();
    const interval = setInterval(() => {
      fetchMyTicket();
      fetchDepartments();
      fetchTicketHistory();
    }, 8000);
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
      setError('Network error: Could not connect to backend server');
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

  const fetchTicketHistory = async () => {
    try {
      const response = await getMyTickets();
      if (response.ok) {
        const data = await response.json();
        setTicketHistory(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error('Error fetching ticket history:', err);
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
        fetchTicketHistory();
        showAlert('Ticket Issued', `Ticket ${data.ticket_code || data.number} issued. Position #${data.position} in line.`);
      } else {
        showAlert('Queue Request Failed', data.detail || 'Could not join queue.');
      }
    } catch (err) {
      showAlert('Network Error', 'Could not connect to the server');
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
        fetchTicketHistory();
        showAlert('Ticket Cancelled', 'Your ticket was cancelled.');
      } else {
        const data = await response.json();
        showAlert('Cancellation Error', data.detail || 'Failed to cancel ticket.');
      }
    } catch (err) {
      showAlert('Error', 'Network error while cancelling ticket.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fa', display: 'flex', flexDirection: 'column' }}>
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
                Logged in: <strong>{user?.first_name || user?.username}</strong>
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
            <p>Welcome, <strong>{user?.first_name} {user?.last_name}</strong> (Student Number: <strong>{user?.student_number || 'SPU Student'}</strong>)</p>
          </div>
          <div className="banner-badge">
            <span>System Active</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '14px', marginBottom: '1.8rem', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {/* Live Active Ticket Card */}
        {myTicket && (
          <section className="active-ticket-banner">
            <div className="ticket-header-row">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
                  ACTIVE TICKET
                </span>
                <h3 style={{ fontSize: '1.5rem', color: '#fff', margin: '4px 0 0', fontWeight: 800 }}>
                  {myTicket.department || 'Department Queue'}
                </h3>
              </div>
              <span className={`ticket-status-pill ${myTicket.status}`}>
                {myTicket.status_display || myTicket.status}
              </span>
            </div>

            <div className="ticket-grid-details">
              <div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 800 }}>Ticket Code</div>
                <div className="big-ticket-code">{myTicket.ticket_code || myTicket.number}</div>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Position in Line</span>
                <span className="ticket-meta-value">#{myTicket.position || 1}</span>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Estimated Wait</span>
                <span className="ticket-meta-value">{myTicket.estimated_wait_minutes || myTicket.estimated_wait || 5} min</span>
              </div>

              <div>
                <button onClick={() => setShowCancelModal(true)} className="btn-cancel-ticket">
                  Cancel Ticket
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Available Department Queues */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1.8rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#003366', fontWeight: '900' }}>Department Services</h2>
            <p style={{ color: '#64748b', fontSize: '1.02rem' }}>Select a service desk below to join today's queue.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Loading departments...</div>
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
                    <p className="dept-desc">{dept.description || 'Assisting students with inquiries and support.'}</p>
                    
                    <div className="dept-meta">
                      <div>Location: {dept.location || 'Central Campus'}</div>
                      <div>Hours: {dept.opens_at ? dept.opens_at.slice(0,5) : '08:00'} - {dept.closes_at ? dept.closes_at.slice(0,5) : '16:00'}</div>
                    </div>

                    <div className="dept-stats-row">
                      <div className="stat-chip">
                        <span className="chip-label">Waiting</span>
                        <span className="chip-val">{dept.waiting_count ?? 0}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="chip-label">Avg. Service</span>
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
                        {myTicket && myTicket.status !== 'CANCELLED' ? 'Active Ticket Present' : (dept.is_open ? 'Join Queue' : 'Queue Closed')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ticket History Section */}
        {ticketHistory.length > 0 && (
          <section>
            <div style={{ marginBottom: '1.4rem' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#003366', fontWeight: '900' }}>Ticket History</h2>
              <p style={{ color: '#64748b', fontSize: '0.98rem' }}>Previous tickets issued during this session.</p>
            </div>

            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Ticket Code</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Issued At</th>
                    <th>Closed At</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketHistory.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 900, color: '#0066cc' }}>{t.ticket_code || t.number}</td>
                      <td style={{ fontWeight: 700 }}>{t.department}</td>
                      <td>
                        <span className={`ticket-status-pill ${t.status}`}>
                          {t.status_display || t.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{t.created_at ? new Date(t.created_at).toLocaleString() : '-'}</td>
                      <td style={{ color: '#64748b' }}>{t.closed_at ? new Date(t.closed_at).toLocaleTimeString() : (t.served_at ? new Date(t.served_at).toLocaleTimeString() : '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Join Queue Modal */}
        <Modal 
          isOpen={showJoinModal} 
          onClose={() => setShowJoinModal(false)}
          title={`Join ${selectedDepartment?.name || 'Queue'}`}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.2rem' }}>
              Request a ticket for <strong>{selectedDepartment?.name}</strong>. Add an optional note for staff reference.
            </p>
            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>Reason for Visit (Optional)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Brief reason for your visit..."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'vertical', minHeight: '85px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowJoinModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleJoinQueue} disabled={joinLoading} className="btn-primary">
                {joinLoading ? 'Joining...' : 'Confirm Ticket Request'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Ticket"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Confirm cancellation of ticket <strong>{myTicket?.ticket_code}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Keep Ticket</button>
              <button onClick={handleCancelTicket} disabled={cancelLoading} className="btn-cancel-ticket" style={{ background: '#dc2626', color: '#fff' }}>
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
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
            <p style={{ color: '#1e293b', fontSize: '1rem', marginBottom: '1.5rem' }}>{alertMessage}</p>
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