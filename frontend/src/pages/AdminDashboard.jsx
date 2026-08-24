// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments, getReportSummary } from '../api';

const AdminDashboard = () => {
  const { user, logoutUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState({
    total_issued: 0,
    total_served: 0,
    total_cancelled: 0,
    total_no_shows: 0,
    total_waiting: 0,
  });

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('Admin: Fetching data...');
      
      let response = await getReportSummary();
      console.log('Admin: Report summary status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin: Report data:', data);
        
        if (data.departments && Array.isArray(data.departments)) {
          setDepartments(data.departments);
          if (data.totals) {
            setSummary({
              total_issued: data.totals.tickets_issued || 0,
              total_served: data.totals.tickets_served || 0,
              total_cancelled: data.totals.tickets_cancelled || 0,
              total_no_shows: data.totals.no_shows || 0,
              total_waiting: data.totals.still_waiting || 0,
            });
          } else {
            calculateSummary(data.departments);
          }
          setLastUpdated(new Date());
          setError('');
          setToast({ message: '✅ Data refreshed successfully!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
          setLoading(false);
          return;
        }
      }
      
      // Fallback
      console.log('Admin: Falling back to departments...');
      const deptResponse = await getDepartments();
      if (deptResponse.ok) {
        const data = await deptResponse.json();
        const depts = Array.isArray(data) ? data : data.results || [];
        setDepartments(depts);
        calculateSummary(depts);
        setLastUpdated(new Date());
        setError('Showing department data (queue stats may be limited)');
        setToast({ message: '⚠️ Using department list only', type: 'warning' });
        setTimeout(() => setToast(null), 3000);
      } else {
        setError('Could not load data. Please check your connection.');
      }
    } catch (error) {
      console.error('Admin: Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const total_issued = data.reduce((sum, d) => sum + (d.tickets_issued || d.issued_count || 0), 0);
    const total_served = data.reduce((sum, d) => sum + (d.tickets_served || d.served_count || 0), 0);
    const total_cancelled = data.reduce((sum, d) => sum + (d.tickets_cancelled || d.cancelled_count || 0), 0);
    const total_no_shows = data.reduce((sum, d) => sum + (d.no_shows || d.no_show_count || 0), 0);
    const total_waiting = data.reduce((sum, d) => sum + (d.still_waiting || d.waiting_count || 0), 0);
    
    setSummary({
      total_issued,
      total_served,
      total_cancelled,
      total_no_shows,
      total_waiting,
    });
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

  if (loading) {
    return <div style={styles.loading}>Loading admin dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>SQ</h1>
          <h2 style={styles.title}>SmartQueue</h2>
          <span style={styles.badge}>Admin</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {user?.username || 'Admin'} • Superuser
          </span>
          <button onClick={logoutUser} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.welcomeSection}>
        <h1 style={styles.welcomeTitle}>📊 Daily Report</h1>
        <p style={styles.welcomeSubtitle}>Queue performance across all departments</p>
        <p style={styles.date}>{getTodayDate()}</p>
        <p style={styles.lastUpdated}>🔄 Last updated: {lastUpdated.toLocaleTimeString()}</p>
        <p style={styles.totalTickets}>🎫 Total tickets today: {summary.total_issued}</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.total_issued}</span>
          <span style={styles.statLabel}>TOTAL ISSUED</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.total_served}</span>
          <span style={styles.statLabel}>✅ SERVED</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.total_cancelled}</span>
          <span style={styles.statLabel}>❌ CANCELLED</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.total_no_shows}</span>
          <span style={styles.statLabel}>⏰ MISSED</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.total_waiting}</span>
          <span style={styles.statLabel}>⏳ WAITING</span>
        </div>
      </div>

      <div style={styles.tableSection}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>DEPARTMENT</th>
              <th style={styles.th}>📋 ISSUED</th>
              <th style={styles.th}>✅ SERVED</th>
              <th style={styles.th}>❌ CANCELLED</th>
              <th style={styles.th}>⏰ MISSED</th>
              <th style={styles.th}>⏳ WAITING</th>
              <th style={styles.th}>AVG SERVICE</th>
              <th style={styles.th}>AVG WAIT</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No data available. Create some tickets to see data here.
                </td>
              </tr>
            ) : (
              departments.map((dept, index) => (
                <tr key={index}>
                  <td style={styles.td}>
                    <strong>{dept.department_name || dept.name || 'Unknown'}</strong>
                    <span style={styles.deptCode}> {dept.department_code || dept.code || ''}</span>
                  </td>
                  <td style={styles.td}>{dept.tickets_issued || dept.issued_count || 0}</td>
                  <td style={styles.td}>{dept.tickets_served || dept.served_count || 0}</td>
                  <td style={styles.td}>{dept.tickets_cancelled || dept.cancelled_count || 0}</td>
                  <td style={styles.td}>{dept.no_shows || dept.no_show_count || 0}</td>
                  <td style={styles.td}>{dept.still_waiting || dept.waiting_count || 0}</td>
                  <td style={styles.td}>{dept.avg_service_minutes || dept.avg_service || '—'}</td>
                  <td style={styles.td}>{dept.avg_wait_minutes || dept.avg_wait || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={styles.totalsRow}>
              <td style={styles.td}><strong>📊 Totals</strong></td>
              <td style={styles.td}><strong>{summary.total_issued}</strong></td>
              <td style={styles.td}><strong>{summary.total_served}</strong></td>
              <td style={styles.td}><strong>{summary.total_cancelled}</strong></td>
              <td style={styles.td}><strong>{summary.total_no_shows}</strong></td>
              <td style={styles.td}><strong>{summary.total_waiting}</strong></td>
              <td style={styles.td}>—</td>
              <td style={styles.td}>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={styles.refreshSection}>
        <button onClick={fetchAllData} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: toast.type === 'success' ? '#d4edda' : '#fff3cd',
          color: toast.type === 'success' ? '#155724' : '#856404',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 999,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {toast.message}
        </div>
      )}
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
    backgroundColor: '#e74c3c',
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
  welcomeSection: {
    padding: '20px 30px',
    backgroundColor: 'white',
    margin: '20px 20px 0 20px',
    borderRadius: '8px 8px 0 0',
  },
  welcomeTitle: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
  },
  welcomeSubtitle: {
    color: '#666',
    margin: '5px 0',
  },
  date: {
    color: '#888',
    fontSize: '14px',
    margin: '5px 0 0 0',
  },
  lastUpdated: {
    color: '#999',
    fontSize: '12px',
    margin: '5px 0 0 0',
  },
  totalTickets: {
    color: '#1a73e8',
    fontSize: '14px',
    margin: '5px 0 0 0',
    fontWeight: 'bold',
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
  tableSection: {
    padding: '0 20px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px',
    borderCollapse: 'collapse',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '2px solid #eee',
    color: '#555',
    fontWeight: 'bold',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  td: {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    color: '#333',
  },
  deptCode: {
    color: '#888',
    fontSize: '12px',
    marginLeft: '5px',
  },
  totalsRow: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  refreshSection: {
    textAlign: 'center',
    padding: '20px',
  },
  refreshBtn: {
    padding: '10px 30px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default AdminDashboard;