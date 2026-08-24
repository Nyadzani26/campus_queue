// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDepartments, getReportSummary } from '../api';

const AdminDashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
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
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await getReportSummary();
      if (response.ok) {
        const data = await response.json();
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
          }
          setLastUpdated(new Date());
          setError('');
          setToast({ message: '✅ Dashboard updated', type: 'success' });
          setTimeout(() => setToast(null), 3000);
          return;
        }
      }

      // Fallback to departments list if report endpoint fails
      const deptResponse = await getDepartments();
      if (deptResponse.ok) {
        const data = await deptResponse.json();
        const depts = Array.isArray(data) ? data : data.results || [];
        setDepartments(depts);
        setLastUpdated(new Date());
      } else {
        setError('Could not load operational data.');
      }
    } catch (err) {
      setError('Network error loading analytics.');
    } finally {
      setLoading(false);
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
              <span className="spu-brand-sub">Executive Analytics & Operations</span>
            </div>
          </div>
          <div className="spu-nav">
            <Link to="/" className="nav-link">Home</Link>
            <div className="user-auth-pill">
              <span className="user-greeting">
                🛡️ <strong>{user?.first_name || user?.username}</strong>
                <span className="role-tag-pill" style={{ background: '#ef4444', color: '#fff' }}>Admin</span>
              </span>
              <button onClick={logoutUser} className="btn-logout-sm">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <main className="admin-container">
        {/* Banner */}
        <div className="page-banner">
          <div className="page-banner-title">
            <h1>Executive Operations Suite</h1>
            <p>Real-time campus-wide queue performance and daily department reports.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Last synced: <strong>{lastUpdated.toLocaleTimeString()}</strong>
            </span>
            <button onClick={fetchAllData} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
              🔄 Manual Refresh
            </button>
          </div>
        </div>

        {toast && (
          <div style={{ background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5', color: toast.type === 'error' ? '#991b1b' : '#065f46', padding: '10px 16px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
            {toast.message}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600' }}>
            ❌ {error}
          </div>
        )}

        {/* Analytics Metric Cards Grid */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card waiting">
            <span className="stat-title">Tickets Issued Today</span>
            <div className="stat-number">{summary.total_issued}</div>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '700' }}>Total Student Demand</span>
          </div>

          <div className="admin-stat-card served">
            <span className="stat-title">Tickets Served</span>
            <div className="stat-number" style={{ color: '#059669' }}>{summary.total_served}</div>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>Completed Counter Consultations</span>
          </div>

          <div className="admin-stat-card waiting" style={{ borderTopColor: '#6366f1' }}>
            <span className="stat-title">Currently Waiting</span>
            <div className="stat-number" style={{ color: '#4f46e5' }}>{summary.total_waiting}</div>
            <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '700' }}>In Active Virtual Queues</span>
          </div>

          <div className="admin-stat-card noshow">
            <span className="stat-title">No-Shows</span>
            <div className="stat-number" style={{ color: '#d97706' }}>{summary.total_no_shows}</div>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700' }}>Missed Counter Calls</span>
          </div>

          <div className="admin-stat-card cancelled">
            <span className="stat-title">Cancelled</span>
            <div className="stat-number" style={{ color: '#dc2626' }}>{summary.total_cancelled}</div>
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '700' }}>Self-Cancelled Tickets</span>
          </div>
        </section>

        {/* Department Operational Table */}
        <section>
          <div style={{ marginBottom: '1.2rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#003366', fontWeight: '800' }}>Department Service Analytics</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Detailed daily breakdown across all active campus service desks.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading operational metrics...</div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Department Name</th>
                    <th>Issued</th>
                    <th>Served</th>
                    <th>Waiting</th>
                    <th>No-Show</th>
                    <th>Cancelled</th>
                    <th>Avg Wait</th>
                    <th>Avg Service</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, i) => (
                    <tr key={dept.department_code || dept.code || i}>
                      <td style={{ fontWeight: 800, color: '#0066cc' }}>{dept.department_code || dept.code}</td>
                      <td style={{ fontWeight: 700, color: '#003366' }}>{dept.department_name || dept.name}</td>
                      <td style={{ fontWeight: 700 }}>{dept.tickets_issued ?? dept.waiting_count ?? 0}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{dept.tickets_served ?? 0}</td>
                      <td style={{ color: '#2563eb', fontWeight: 700 }}>{dept.still_waiting ?? dept.waiting_count ?? 0}</td>
                      <td style={{ color: '#d97706' }}>{dept.no_shows ?? 0}</td>
                      <td style={{ color: '#dc2626' }}>{dept.tickets_cancelled ?? 0}</td>
                      <td>{dept.avg_wait_minutes ? `${dept.avg_wait_minutes}m` : '-'}</td>
                      <td>{dept.avg_service_minutes ? `${dept.avg_service_minutes}m` : '10m'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;