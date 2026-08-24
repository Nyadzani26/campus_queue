// frontend/src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getStaffQueue, 
  callNextTicket, 
  serveTicket, 
  noShowTicket,
} from '../api';
import Modal from '../components/Modal';

const StaffDashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [waitingList, setWaitingList] = useState([]);
  const [nowServing, setNowServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showServeModal, setShowServeModal] = useState(false);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchStaffQueue();
    const interval = setInterval(fetchStaffQueue, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchStaffQueue = async () => {
    try {
      const response = await getStaffQueue();
      if (response.ok) {
        const data = await response.json();
        setDepartment(data.department || null);
        setWaitingList(data.waiting_list || []);
        setNowServing(data.now_serving || null);
        setError('');
      } else if (response.status === 403) {
        setError('Your account is not assigned to a department. Please contact the system administrator.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to load queue snapshot');
      }
    } catch (err) {
      setError('Network error: Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const response = await callNextTicket();
      if (response.ok) {
        const data = await response.json();
        const calledTicket = data.ticket || data;
        setNowServing(calledTicket);
        setSuccessMessage(`Called ticket ${calledTicket?.ticket_code || 'next customer'}`);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'No customers currently waiting in queue.');
      }
    } catch (err) {
      setError('Network error calling next ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeTicket = async (ticketId) => {
    setModalLoading(true);
    const targetId = ticketId || nowServing?.id;
    if (!targetId) {
      setError('No active ticket ID found.');
      setModalLoading(false);
      setShowServeModal(false);
      return;
    }
    try {
      const response = await serveTicket(targetId);
      if (response.ok) {
        setSuccessMessage('Ticket marked as served.');
        setNowServing(null);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to complete service.');
      }
    } catch (err) {
      setError('Network error while completing service.');
    } finally {
      setModalLoading(false);
      setShowServeModal(false);
    }
  };

  const handleNoShowTicket = async (ticketId) => {
    setModalLoading(true);
    const targetId = ticketId || nowServing?.id;
    if (!targetId) {
      setError('No active ticket ID found.');
      setModalLoading(false);
      setShowMissedModal(false);
      return;
    }
    try {
      const response = await noShowTicket(targetId);
      if (response.ok) {
        setSuccessMessage('Ticket marked as No-Show.');
        setNowServing(null);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to update ticket status.');
      }
    } catch (err) {
      setError('Network error marking no-show.');
    } finally {
      setModalLoading(false);
      setShowMissedModal(false);
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
              <span className="spu-brand-sub">Staff Counter Terminal</span>
            </div>
          </div>
          <div className="spu-nav">
            <Link to="/" className="nav-link">Home</Link>
            <div className="user-auth-pill">
              <span className="user-greeting">
                Logged in: <strong>{user?.first_name || user?.username}</strong>
                <span className="role-tag-pill">Staff</span>
              </span>
              <button onClick={logoutUser} className="btn-logout-sm">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Staff Container */}
      <main className="staff-container">
        {/* Banner */}
        <div className="page-banner">
          <div className="page-banner-title">
            <h1>{department?.name || 'Department Service Counter'}</h1>
            <p>Assigned Staff: <strong>{user?.first_name} {user?.last_name}</strong> ({user?.email})</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="banner-badge">
              <span>Waiting: <strong>{waitingList.length}</strong></span>
            </div>
            <button onClick={handleCallNext} disabled={actionLoading || nowServing} className="btn-primary" style={{ padding: '10px 24px', fontSize: '1rem', background: nowServing ? '#94a3b8' : '#003366' }}>
              {actionLoading ? 'Calling...' : (nowServing ? 'Serving Active Ticket' : 'Call Next Customer')}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600' }}>
            {successMessage}
          </div>
        )}

        {/* Now Serving Spotlight Card */}
        {nowServing && (
          <section className="active-ticket-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', marginBottom: '2.5rem' }}>
            <div className="ticket-header-row">
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 800 }}>
                  NOW SERVING AT COUNTER
                </span>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '4px 0 0' }}>
                  {nowServing.customer_name || nowServing.student_name || 'Student Customer'}
                </h2>
              </div>
              <span className="ticket-status-pill SERVING">
                SERVING
              </span>
            </div>

            <div className="ticket-grid-details">
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>Ticket Code</div>
                <div className="big-ticket-code" style={{ color: '#fde047' }}>{nowServing.ticket_code}</div>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Student ID</span>
                <span className="ticket-meta-value">{nowServing.student_number || 'N/A'}</span>
              </div>

              <div className="ticket-meta-box">
                <span className="ticket-meta-label">Student Note</span>
                <span className="ticket-meta-value" style={{ fontSize: '1rem' }}>{nowServing.note || 'No note provided'}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowServeModal(true)} className="btn-action-success" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
                  Complete Service
                </button>
                <button onClick={() => setShowMissedModal(true)} className="btn-action-warning" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
                  Mark No-Show
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Waiting List Table */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#003366', fontWeight: 800 }}>Waiting Queue ({waitingList.length})</h2>
            <button onClick={fetchStaffQueue} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>
              Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading waiting tickets...</div>
          ) : waitingList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <h3>No Students Waiting</h3>
              <p>The queue for this department is currently empty.</p>
            </div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Ticket Code</th>
                    <th>Student Name</th>
                    <th>Student Number</th>
                    <th>Note / Query</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingList.map((ticket, index) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 800, color: '#003366' }}>#{index + 1}</td>
                      <td style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0066cc' }}>{ticket.ticket_code}</td>
                      <td style={{ fontWeight: 600 }}>{ticket.customer_name || ticket.student_name || 'Student'}</td>
                      <td style={{ color: '#64748b' }}>{ticket.student_number || 'N/A'}</td>
                      <td style={{ color: '#475569', maxWidth: '240px' }}>{ticket.note || '-'}</td>
                      <td>
                        <span className="ticket-status-pill WAITING">WAITING</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Complete Modal */}
        <Modal isOpen={showServeModal} onClose={() => setShowServeModal(false)} title="Complete Customer Service">
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Mark service for ticket <strong>{nowServing?.ticket_code}</strong> ({nowServing?.customer_name}) as completed?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowServeModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleServeTicket(nowServing?.id)} disabled={modalLoading} className="btn-action-success">
                {modalLoading ? 'Saving...' : 'Confirm Completed'}
              </button>
            </div>
          </div>
        </Modal>

        {/* No Show Modal */}
        <Modal isOpen={showMissedModal} onClose={() => setShowMissedModal(false)} title="Mark as No-Show">
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Customer for ticket <strong>{nowServing?.ticket_code}</strong> did not respond to call?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMissedModal(false)} style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleNoShowTicket(nowServing?.id)} disabled={modalLoading} className="btn-action-warning">
                {modalLoading ? 'Saving...' : 'Mark Missed'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default StaffDashboard;