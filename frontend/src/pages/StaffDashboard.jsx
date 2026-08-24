// frontend/src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
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
  }, []);

  const fetchStaffQueue = async () => {
    try {
      setLoading(true);
      console.log('Fetching staff queue...');
      
      const response = await getStaffQueue();
      console.log('Staff queue response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Staff queue data:', data);
        
        if (data.department) {
          setDepartment(data.department);
        } else {
          setError('No department information found. Please contact admin.');
        }
        
        setWaitingList(data.waiting_list || []);
        setNowServing(data.now_serving || null);
        setError('');
      } else if (response.status === 401) {
        setError('You must be logged in as staff to view this page.');
      } else if (response.status === 403) {
        setError('You do not have permission to view this page. No department assigned.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || 'Failed to load queue data');
      }
    } catch (error) {
      console.error('Error fetching staff queue:', error);
      setError('Network error: Could not connect to the server');
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
        setNowServing(data.ticket);
        setSuccessMessage(`📢 Calling ${data.ticket?.ticket_number || 'next customer'}`);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || 'No customers waiting');
      }
    } catch (error) {
      setError('Network error: Could not connect to the server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeTicket = async (ticketId) => {
    setModalLoading(true);
    try {
      const response = await serveTicket(ticketId);
      if (response.ok) {
        setSuccessMessage('✅ Ticket marked as served');
        setNowServing(null);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || 'Failed to serve ticket');
      }
    } catch (error) {
      setError('Network error: Could not connect to the server');
    } finally {
      setModalLoading(false);
      setShowServeModal(false);
    }
  };

  const handleNoShowTicket = async (ticketId) => {
    setModalLoading(true);
    try {
      const response = await noShowTicket(ticketId);
      if (response.ok) {
        setSuccessMessage('⏰ Ticket marked as missed');
        setNowServing(null);
        await fetchStaffQueue();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || 'Failed to mark as missed');
      }
    } catch (error) {
      setError('Network error: Could not connect to the server');
    } finally {
      setModalLoading(false);
      setShowMissedModal(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTodayDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper to get student name
  const getStudentName = (ticket) => {
    if (!ticket) return 'Customer';
    // Try different fields the backend might send
    if (ticket.customer_name) return ticket.customer_name;
    if (ticket.customer_username) return ticket.customer_username;
    if (ticket.customer && typeof ticket.customer === 'object') {
      return ticket.customer.full_name || ticket.customer.username || 'Customer';
    }
    return 'Customer';
  };

  // Helper to get description
  const getDescription = (ticket) => {
    if (!ticket) return 'No description provided';
    return ticket.note || ticket.description || 'No description provided';
  };

  // Helper to get estimated wait (in minutes)
  const getEstWait = (ticket) => {
    if (!ticket) return 0;
    // Try various field names
    return ticket.estimated_wait || ticket.est_wait || ticket.estimated_wait_minutes || 0;
  };

  if (loading) {
    return <div style={styles.loading}>Loading staff dashboard...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>{error}</div>
        <button onClick={fetchStaffQueue} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (!department) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>No department assigned to this staff account.</div>
        <button onClick={fetchStaffQueue} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>SQ</h1>
          <h2 style={styles.title}>SmartQueue</h2>
          <span style={styles.badge}>Staff</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {user?.username || 'Staff'} • {department.name}
          </span>
          <button onClick={logoutUser} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </header>

      <div style={styles.departmentHeader}>
        <div style={styles.departmentInfo}>
          <h1 style={styles.departmentName}>{department.name}</h1>
          <span style={department.is_open ? styles.openBadge : styles.closedBadge}>
            {department.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      <p style={styles.date}>{getTodayDate()}</p>

      {successMessage && <div style={styles.successBanner}>{successMessage}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{waitingList.length}</span>
          <span style={styles.statLabel}>WAITING</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{department.avg_wait || 0}</span>
          <span style={styles.statLabel}>AVG. WAIT (MIN)</span>
        </div>
        {nowServing && (
          <div style={styles.statCard}>
            <span style={styles.statValue}>{nowServing.ticket_number}</span>
            <span style={styles.statLabel}>NOW SERVING</span>
          </div>
        )}
      </div>

      {nowServing && (
        <div style={styles.nowServingSection}>
          <h3 style={styles.sectionTitle}>NOW SERVING</h3>
          <div style={styles.nowServingCard}>
            <div style={styles.nowServingInfo}>
              <span style={styles.nowServingTicket}>{nowServing.ticket_number}</span>
              <span style={styles.nowServingCustomer}>👤 {getStudentName(nowServing)}</span>
              <p style={styles.nowServingDescription}>📝 {getDescription(nowServing)}</p>
              <p style={styles.nowServingTime}>⏰ Joined: {formatTime(nowServing.created_at)}</p>
              <p style={styles.nowServingEstWait}>⏳ Est. Wait: {getEstWait(nowServing)} min</p>
            </div>
            <div style={styles.nowServingActions}>
              <button 
                onClick={() => setShowServeModal(true)}
                style={styles.serveBtn}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : '✅ Mark Served'}
              </button>
              <button 
                onClick={() => setShowMissedModal(true)}
                style={styles.noShowBtn}
                disabled={actionLoading}
                title="Customer didn't show up"
              >
                {actionLoading ? 'Processing...' : '⏰ Missed'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.callNextSection}>
        <button 
          onClick={handleCallNext}
          style={waitingList.length > 0 ? styles.callNextBtn : styles.callNextBtnDisabled}
          disabled={actionLoading || waitingList.length === 0}
        >
          {actionLoading ? 'Processing...' : '📞 Call Next Customer'}
        </button>
        {waitingList.length === 0 && !nowServing && (
          <p style={styles.emptyMessage}>No one is waiting right now</p>
        )}
      </div>

      <div style={styles.waitingListSection}>
        <h3 style={styles.sectionTitle}>Waiting List</h3>
        {waitingList.length === 0 ? (
          <div style={styles.emptyState}>No one is waiting right now</div>
        ) : (
          <div style={styles.waitingList}>
            {waitingList.map((ticket) => (
              <div key={ticket.id} style={styles.waitingItem}>
                <div style={styles.waitingItemLeft}>
                  <span style={styles.waitingTicketNumber}>{ticket.ticket_number}</span>
                  <span style={styles.waitingCustomerName}>👤 {getStudentName(ticket)}</span>
                </div>
                <div style={styles.waitingItemRight}>
                  <p style={styles.waitingDescription}>📝 {getDescription(ticket)}</p>
                  <span style={styles.waitingEstWait}>⏳ {getEstWait(ticket)} min</span>
                  <span style={styles.waitingTime}>⏰ {formatTime(ticket.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Serve Modal */}
      <Modal
        isOpen={showServeModal}
        onClose={() => setShowServeModal(false)}
        onConfirm={() => handleServeTicket(nowServing?.id)}
        title="Mark as Served"
        message={`Mark ticket ${nowServing?.ticket_number || ''} as served?`}
        confirmText="Yes, Mark Served"
        confirmColor="#27ae60"
        loading={modalLoading}
        type="confirm"
      />

      {/* Missed Modal */}
      <Modal
        isOpen={showMissedModal}
        onClose={() => setShowMissedModal(false)}
        onConfirm={() => handleNoShowTicket(nowServing?.id)}
        title="Mark as Missed"
        message={`Mark ticket ${nowServing?.ticket_number || ''} as missed (no-show)?`}
        confirmText="Yes, Mark Missed"
        confirmColor="#e67e22"
        loading={modalLoading}
        type="confirm"
      />
    </div>
  );
};

// ==================== STYLES ====================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: 'Arial, sans-serif',
    paddingBottom: '30px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '20px',
    color: '#555',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #f5c6cb',
    margin: '20px',
    borderRadius: '4px',
  },
  successBanner: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px 20px',
    textAlign: 'center',
    borderRadius: '4px',
    margin: '0 20px 15px 20px',
  },
  retryBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px auto',
    display: 'block',
  },
  header: {
    backgroundColor: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: '24px',
    margin: 0,
  },
  title: {
    color: '#333',
    fontSize: '18px',
    margin: 0,
  },
  badge: {
    backgroundColor: '#1a73e8',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#555',
  },
  signOutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  departmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    backgroundColor: 'white',
    margin: '20px 20px 0 20px',
    borderRadius: '8px 8px 0 0',
  },
  departmentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  departmentName: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
  },
  openBadge: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  closedBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  date: {
    padding: '10px 30px 0 30px',
    color: '#888',
    fontSize: '14px',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    padding: '20px 20px 0 20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '15px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: '5px',
  },
  nowServingSection: {
    padding: '20px',
  },
  sectionTitle: {
    color: '#555',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  nowServingCard: {
    backgroundColor: '#e8f0fe',
    borderRadius: '8px',
    padding: '20px',
    border: '2px solid #1a73e8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '15px',
  },
  nowServingInfo: {
    flex: 1,
  },
  nowServingTicket: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a73e8',
    display: 'block',
  },
  nowServingCustomer: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    display: 'block',
    marginTop: '5px',
  },
  nowServingDescription: {
    color: '#555',
    margin: '5px 0',
  },
  nowServingTime: {
    color: '#888',
    fontSize: '14px',
  },
  nowServingEstWait: {
    color: '#1a73e8',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '5px',
  },
  nowServingActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  serveBtn: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  noShowBtn: {
    padding: '10px 20px',
    backgroundColor: '#e67e22',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  callNextSection: {
    padding: '0 20px 20px 20px',
    textAlign: 'center',
  },
  callNextBtn: {
    padding: '14px 40px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    width: '100%',
    maxWidth: '400px',
  },
  callNextBtnDisabled: {
    padding: '14px 40px',
    backgroundColor: '#ccc',
    color: '#888',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    width: '100%',
    maxWidth: '400px',
    cursor: 'not-allowed',
  },
  emptyMessage: {
    color: '#888',
    marginTop: '10px',
  },
  waitingListSection: {
    padding: '0 20px',
  },
  waitingList: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  waitingItem: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  waitingItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  waitingTicketNumber: {
    fontWeight: 'bold',
    color: '#1a73e8',
    fontSize: '16px',
  },
  waitingCustomerName: {
    fontWeight: 'bold',
    color: '#333',
  },
  waitingItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  waitingDescription: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
  waitingEstWait: {
    color: '#e67e22',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  waitingTime: {
    color: '#888',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px',
    color: '#888',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
};

export default StaffDashboard;