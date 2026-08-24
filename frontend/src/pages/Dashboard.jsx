// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
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
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [description, setDescription] = useState('');
  const [myTicket, setMyTicket] = useState(null);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ----- Alert Modal State (ADDED) -----
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
  // -------------------------------------

  useEffect(() => {
    fetchDepartments();
    fetchMyTicket();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const response = await getDepartments();
      console.log('Departments response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments data received:', data);
        
        let departmentsArray = [];
        if (Array.isArray(data)) {
          departmentsArray = data;
        } else if (data.results && Array.isArray(data.results)) {
          departmentsArray = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          departmentsArray = data.data;
        } else {
          console.error('Unexpected departments data format:', data);
          setError('Unexpected data format from server');
          setDepartments([]);
          setLoading(false);
          return;
        }
        
        setDepartments(departmentsArray);
        setError('');
      } else if (response.status === 401) {
        setError('You must be logged in to view departments.');
        setDepartments([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        setError(errorData.detail || errorData.error || 'Failed to load departments');
        setDepartments([]);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setError('Network error: Could not connect to the server. Make sure Django is running on http://localhost:8000');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTicket = async () => {
    try {
      console.log('Fetching active ticket...');
      const response = await getMyActiveTicket();
      console.log('Ticket response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Active ticket data:', data);
        setMyTicket(data);
      } else if (response.status === 404) {
        console.log('No active ticket found (404)');
        setMyTicket(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching ticket:', errorData);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const handleJoinQueue = async (departmentId) => {
    setJoinLoading(true);
    try {
      console.log('Joining queue for department:', departmentId);
      const response = await joinQueue(departmentId, description);
      console.log('Join queue response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully joined queue:', data);
        setMyTicket(data);
        setShowJoinModal(false);
        setDescription('');
        await fetchDepartments();
        // 🔥 REPLACED alert() with custom modal
        showAlert('✅ Success', 'Successfully joined the queue!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Join queue error:', errorData);
        // 🔥 REPLACED alert() with custom modal
        showAlert('❌ Error', errorData.error || errorData.detail || 'Failed to join queue', 'error');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      // 🔥 REPLACED alert() with custom modal
      showAlert('❌ Error', 'Network error: Could not connect to the server', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    setModalLoading(true);
    try {
      console.log('Cancelling ticket:', ticketId);
      const response = await cancelTicket(ticketId);
      console.log('Cancel ticket response status:', response.status);
      
      if (response.ok) {
        setMyTicket(null);
        await fetchDepartments();
        // 🔥 REPLACED alert() with custom modal
        showAlert('✅ Success', 'Ticket cancelled successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cancel ticket error:', errorData);
        // 🔥 REPLACED alert() with custom modal
        showAlert('❌ Error', errorData.error || errorData.detail || 'Failed to cancel ticket', 'error');
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      // 🔥 REPLACED alert() with custom modal
      showAlert('❌ Error', 'Network error: Could not connect to the server', 'error');
    } finally {
      setModalLoading(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading departments...</div>;
  }

  const getTicketDepartmentName = () => {
    if (!myTicket) return 'Department';
    if (myTicket.department_name) return myTicket.department_name;
    if (myTicket.department && typeof myTicket.department === 'object' && myTicket.department.name) {
      return myTicket.department.name;
    }
    if (myTicket.department && typeof myTicket.department === 'string') return myTicket.department;
    if (myTicket.department && typeof myTicket.department === 'number') {
      const found = departments.find(d => d.id === myTicket.department);
      if (found) return found.name;
    }
    return 'Department';
  };

  const getEstWait = () => {
    if (!myTicket) return 0;
    return myTicket.est_wait || myTicket.estimated_wait || 0;
  };

  const getPosition = () => {
    if (!myTicket) return 0;
    return myTicket.position || myTicket.queue_position || 0;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>SQ</h1>
          <h2 style={styles.title}>SmartQueue</h2>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {user?.username || 'User'} • {user?.role || 'Student'}
          </span>
          <button onClick={logoutUser} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {myTicket && (
        <div style={styles.ticketSection}>
          <div style={styles.ticketCard}>
            <h3 style={styles.ticketTitle}>YOUR TICKET</h3>
            <p style={styles.ticketNumber}>{myTicket.ticket_number || 'Ticket'}</p>
            <p style={styles.ticketDepartment}>📍 {getTicketDepartmentName()}</p>
            <div style={styles.ticketDetails}>
              <div style={styles.ticketDetail}>
                <span style={styles.ticketLabel}>POSITION</span>
                <span style={styles.ticketValue}>#{getPosition()}</span>
              </div>
              <div style={styles.ticketDetail}>
                <span style={styles.ticketLabel}>EST. WAIT</span>
                <span style={styles.ticketValue}>{getEstWait()} min</span>
              </div>
            </div>
            <button 
              onClick={() => setShowCancelModal(true)}
              style={styles.cancelBtn}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel ticket'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.departmentsSection}>
        <h3 style={styles.sectionTitle}>Departments</h3>
        <p style={styles.sectionSubtitle}>Select a department to join its queue</p>
        
        {departments.length === 0 && !error ? (
          <div style={styles.noData}>No departments available. Please contact an administrator.</div>
        ) : (
          <div style={styles.departmentGrid}>
            {departments.map((dept) => (
              <div key={dept.id} style={styles.departmentCard}>
                <div style={styles.departmentHeader}>
                  <span style={styles.departmentCode}>{dept.name}</span>
                  <span style={dept.is_open ? styles.openBadge : styles.closedBadge}>
                    {dept.is_open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <h4 style={styles.departmentName}>{dept.name}</h4>
                <p style={styles.departmentDescription}>{dept.description}</p>
                <p style={styles.departmentLocation}>{dept.location}</p>
                <p style={styles.departmentHours}>{dept.hours}</p>
                
                <div style={styles.queueStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>WAITING</span>
                    <span style={styles.statValue}>{dept.waiting_count || 0}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>NOW SERVING</span>
                    <span style={styles.statValue}>{dept.now_serving || 0}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>EST. WAIT</span>
                    <span style={styles.statValue}>{dept.est_wait || 0} min</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setShowJoinModal(true);
                  }}
                  style={dept.is_open ? styles.joinBtn : styles.joinBtnDisabled}
                  disabled={!dept.is_open || joinLoading}
                >
                  {joinLoading ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showJoinModal && selectedDepartment && (
        <div style={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Join {selectedDepartment.name}</h3>
            <p style={styles.modalSubtitle}>
              Briefly describe what you need help with (optional).
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I need help with my student email..."
              style={styles.textarea}
              rows={3}
              disabled={joinLoading}
            />
            <div style={styles.modalActions}>
              <button 
                onClick={() => {
                  setShowJoinModal(false);
                  setDescription('');
                }}
                style={styles.modalCancelBtn}
                disabled={joinLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleJoinQueue(selectedDepartment.id)}
                style={styles.modalJoinBtn}
                disabled={joinLoading}
              >
                {joinLoading ? 'Joining...' : 'Join Queue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Ticket Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => handleCancelTicket(myTicket?.id)}
        title="Cancel Ticket"
        message="Cancel your ticket? You will lose your position in the queue. This cannot be undone."
        confirmText="Cancel Ticket"
        confirmColor="#e74c3c"
        loading={modalLoading}
        type="confirm"
      />

      {/* 🔥 Alert Modal (ADDED) */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        onConfirm={() => setShowAlertModal(false)}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        confirmColor={alertType === 'success' ? '#27ae60' : '#e74c3c'}
        type="alert"
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
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #ffeeba',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
    fontSize: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  header: {
    backgroundColor: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
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
  ticketSection: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#e8f0fe',
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '25px 35px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    minWidth: '280px',
    border: '2px solid #1a73e8',
  },
  ticketTitle: {
    color: '#666',
    fontSize: '14px',
    margin: '0 0 5px 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  ticketNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a73e8',
    margin: '5px 0',
  },
  ticketDepartment: {
    color: '#333',
    marginBottom: '15px',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  ticketDetails: {
    display: 'flex',
    justifyContent: 'space-around',
    margin: '15px 0',
  },
  ticketDetail: {
    textAlign: 'center',
  },
  ticketLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  ticketValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '14px',
  },
  departmentsSection: {
    padding: '20px 30px',
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '5px',
  },
  sectionSubtitle: {
    color: '#888',
    marginBottom: '20px',
  },
  departmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  departmentCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s ease',
  },
  departmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  departmentCode: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  openBadge: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  closedBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  departmentName: {
    margin: '5px 0',
    color: '#333',
  },
  departmentDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '5px 0',
  },
  departmentLocation: {
    fontSize: '13px',
    color: '#888',
    margin: '3px 0',
  },
  departmentHours: {
    fontSize: '13px',
    color: '#888',
    margin: '3px 0 15px 0',
  },
  queueStats: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  statItem: {
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#888',
    textTransform: 'uppercase',
  },
  statValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  joinBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  joinBtnDisabled: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#ccc',
    color: '#888',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '450px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 5px 0',
    color: '#333',
  },
  modalSubtitle: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalJoinBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Dashboard;