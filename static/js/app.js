/* ═══════════════════════════════════════════════════════════════════════════
   SPU SmartQueue — Application Logic
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Polling Handles ──────────────────────────────────────────────────────────
let _studentTicketPoll  = null;
let _staffQueuePoll     = null;

// ─── Toast Notification System ────────────────────────────────────────────────
function showToast(message, type = 'default', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✓', error: '✕', warning: '⚠', default: 'ℹ' };

  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.default}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

// ─── Custom Confirm Dialog (replaces window.confirm) ─────────────────────────
function showConfirm(title, body, dangerLabel = 'Confirm') {
  return new Promise(resolve => {
    const overlay  = document.getElementById('confirm-overlay');
    const titleEl  = document.getElementById('confirm-title');
    const bodyEl   = document.getElementById('confirm-body');
    const okBtn    = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    titleEl.textContent   = title;
    bodyEl.textContent    = body;
    okBtn.textContent     = dangerLabel;
    overlay.style.display = 'flex';

    const cleanup = () => { overlay.style.display = 'none'; };

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onOverlay = (e) => { if (e.target === overlay) onCancel(); };

    okBtn.addEventListener('click', onOk, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });
    overlay.addEventListener('click', onOverlay, { once: true });
  });
}

// ─── Custom Prompt Dialog (replaces window.prompt) ───────────────────────────
function showPrompt(title, body, placeholder = '') {
  return new Promise(resolve => {
    const overlay    = document.getElementById('prompt-overlay');
    const titleEl    = document.getElementById('prompt-title');
    const bodyEl     = document.getElementById('prompt-body');
    const input      = document.getElementById('prompt-input');
    const okBtn      = document.getElementById('prompt-ok-btn');
    const cancelBtn  = document.getElementById('prompt-cancel-btn');

    titleEl.textContent    = title;
    bodyEl.textContent     = body;
    input.placeholder      = placeholder;
    input.value            = '';
    overlay.style.display  = 'flex';

    requestAnimationFrame(() => input.focus());

    const cleanup = () => { overlay.style.display = 'none'; };

    const onOk = () => { cleanup(); resolve(input.value.trim()); };
    const onCancel = () => { cleanup(); resolve(null); };
    const onKeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) onOk(); };

    okBtn.addEventListener('click', onOk, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });
    input.addEventListener('keydown', onKeydown);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { input.removeEventListener('keydown', onKeydown); onCancel(); }
    }, { once: true });
  });
}

// ─── Password Toggle ──────────────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}

// ─── Button Loading State ─────────────────────────────────────────────────────
function setButtonLoading(btn, loading) {
  const label   = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  if (!label || !spinner) return;
  label.style.display   = loading ? 'none' : '';
  spinner.style.display = loading ? 'inline-block' : 'none';
  btn.disabled = loading;
}

// ─── Section Visibility ───────────────────────────────────────────────────────
function showSection(name) {
  ['auth-section', 'student-section', 'staff-section', 'admin-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === `${name}-section`) ? '' : 'none';
  });
}

// ─── Auth Tab Switcher ────────────────────────────────────────────────────────
function showAuthTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').setAttribute('aria-selected',    String(tab === 'login'));
  document.getElementById('tab-register').setAttribute('aria-selected', String(tab === 'register'));
}

// ─── Navbar Update ────────────────────────────────────────────────────────────
function updateNavbar() {
  const user = api.user;
  if (!user) return;

  document.getElementById('main-nav').style.display = '';
  document.getElementById('nav-fullname').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  document.getElementById('nav-role').textContent     = user.role || '';
  document.getElementById('nav-avatar').textContent   = (user.first_name || user.username || '?')[0].toUpperCase();
}

function hideNavbar() {
  document.getElementById('main-nav').style.display = 'none';
}

// ─── Stop All Polling ─────────────────────────────────────────────────────────
function stopAllPolling() {
  if (_studentTicketPoll) { clearInterval(_studentTicketPoll); _studentTicketPoll = null; }
  if (_staffQueuePoll)    { clearInterval(_staffQueuePoll);    _staffQueuePoll    = null; }
}

// ─── Initialisation ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (api.isAuthenticated()) {
    routeByRole(api.user);
  } else {
    showSection('auth');
    hideNavbar();
  }

  // Set today's date as default for report picker
  const datePicker = document.getElementById('report-date');
  if (datePicker) {
    datePicker.value = new Date().toISOString().split('T')[0];
  }
});

// ─── Routing ──────────────────────────────────────────────────────────────────
function routeByRole(user) {
  updateNavbar();
  stopAllPolling();

  if (user.role === 'student') {
    showSection('student');
    loadStudentDashboard();
  } else if (user.role === 'staff') {
    showSection('staff');
    loadStaffDashboard();
  } else if (user.role === 'admin') {
    showSection('admin');
    loadReport();
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function login(event) {
  event.preventDefault();
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showFormError(errorEl, 'Please enter your username and password.');
    return;
  }

  hideFormError(errorEl);
  setButtonLoading(btn, true);

  try {
    const data = await api.login(username, password);
    routeByRole(data.user);
  } catch (err) {
    showFormError(errorEl, err.message || 'Invalid credentials. Please try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
async function register(event) {
  event.preventDefault();
  const btn = document.getElementById('register-btn');
  const errorEl = document.getElementById('register-error');

  const firstName    = document.getElementById('reg-firstname').value.trim();
  const lastName     = document.getElementById('reg-lastname').value.trim();
  const username     = document.getElementById('reg-username').value.trim();
  const email        = document.getElementById('reg-email').value.trim();
  const studentNum   = document.getElementById('reg-student-number').value.trim();
  const password     = document.getElementById('reg-password').value;

  if (!firstName || !lastName || !username || !email || !studentNum || !password) {
    showFormError(errorEl, 'Please fill in all fields.');
    return;
  }

  hideFormError(errorEl);
  setButtonLoading(btn, true);

  try {
    const data = await api.register(username, email, firstName, lastName, studentNum, password);
    showToast(`Welcome, ${data.user.first_name || data.user.username}!`, 'success');
    routeByRole(data.user);
  } catch (err) {
    const msg = parseApiError(err.message);
    showFormError(errorEl, msg);
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
async function logout() {
  stopAllPolling();
  try {
    await api.logout();
  } catch (_) { /* token already gone */ }
  hideNavbar();
  showSection('auth');
  showAuthTab('login');
  // Clear active ticket UI
  document.getElementById('active-ticket-banner').style.display = 'none';
}

// ─── Form Error Helpers ───────────────────────────────────────────────────────
function showFormError(el, msg) {
  el.textContent = msg;
  el.style.display = '';
}

function hideFormError(el) {
  el.style.display = 'none';
  el.textContent = '';
}

function parseApiError(raw) {
  try {
    const obj = JSON.parse(raw);
    const msgs = [];
    for (const [key, val] of Object.entries(obj)) {
      const label = key === 'detail' ? '' : `${key}: `;
      const text  = Array.isArray(val) ? val.join(' ') : String(val);
      msgs.push(`${label}${text}`);
    }
    return msgs.join('\n');
  } catch {
    return raw || 'Something went wrong. Please try again.';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function loadStudentDashboard() {
  loadDepartments();
  loadActiveTicket();
  // Poll active ticket every 4 seconds
  _studentTicketPoll = setInterval(loadActiveTicket, 4000);
}

// ─── Departments List ─────────────────────────────────────────────────────────
async function loadDepartments() {
  const grid = document.getElementById('departments-grid');
  grid.innerHTML = `<div class="loading-grid">${'<div class="skeleton-card"></div>'.repeat(5)}</div>`;

  try {
    const data = await api.getDepartments();
    const depts = data.results || data;

    if (!depts.length) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🏛</span><p>No departments are set up yet.</p></div>`;
      return;
    }

    grid.innerHTML = '';
    depts.forEach(dept => {
      grid.appendChild(buildDeptCard(dept));
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">✕</span><p>Failed to load departments. <button class="btn btn-outline btn-sm" onclick="loadDepartments()">Retry</button></p></div>`;
    showToast('Could not load departments.', 'error');
  }
}

function buildDeptCard(dept) {
  const queueStatus   = dept.queue_status || 'unknown';
  const waitingCount  = dept.waiting_count ?? '—';
  const nowServing    = dept.now_serving   || '—';
  const estWait       = dept.estimated_wait_minutes != null
                        ? `${Math.round(dept.estimated_wait_minutes)} min`
                        : '—';

  const badgeClass = queueStatus === 'open'   ? 'dept-badge-open'
                   : queueStatus === 'paused' ? 'dept-badge-paused'
                   : 'dept-badge-closed';

  const isOpen    = queueStatus === 'open';
  const isClosed  = !isOpen;

  const card = document.createElement('div');
  card.className = 'dept-card';
  card.innerHTML = `
    <div class="dept-card-header">
      <div class="dept-icon">${dept.code}</div>
      <span class="status-badge ${badgeClass}">${queueStatus}</span>
    </div>
    <div>
      <div class="dept-name">${escHtml(dept.name)}</div>
      <div class="dept-desc">${escHtml(dept.description || '')}</div>
    </div>
    <div class="dept-meta">
      ${dept.location ? `<div class="dept-meta-row">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${escHtml(dept.location)}
      </div>` : ''}
      <div class="dept-meta-row">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${formatTime(dept.opens_at)} – ${formatTime(dept.closes_at)}
      </div>
    </div>
    <div class="dept-stats">
      <div class="dept-stat">
        <span class="dept-stat-value">${waitingCount}</span>
        <span class="dept-stat-label">Waiting</span>
      </div>
      <div class="dept-stat">
        <span class="dept-stat-value">${nowServing}</span>
        <span class="dept-stat-label">Now Serving</span>
      </div>
      <div class="dept-stat">
        <span class="dept-stat-value">${estWait}</span>
        <span class="dept-stat-label">Est. Wait</span>
      </div>
    </div>
    <div class="dept-actions">
      <button
        class="btn btn-primary btn-full"
        id="join-btn-${dept.id}"
        onclick="joinQueue(${dept.id}, '${escHtml(dept.name)}')"
        ${isClosed ? 'disabled' : ''}
      >
        ${isClosed ? 'Queue Closed' : 'Join Queue'}
      </button>
    </div>
  `;
  return card;
}

// ─── Join Queue ───────────────────────────────────────────────────────────────
async function joinQueue(deptId, deptName) {
  const note = await showPrompt(
    `Join ${deptName}`,
    'Briefly describe what you need help with (optional).',
    'e.g. I need help with my student email...'
  );

  if (note === null) return; // user cancelled

  try {
    const ticket = await api.joinDepartment(deptId, note || '');
    showToast(`You're in the queue! Ticket: ${ticket.ticket_code}`, 'success', 5000);
    loadActiveTicket();
    loadDepartments(); // refresh waiting counts
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('active ticket')) {
      showToast('You already have an active ticket. Cancel it before joining another queue.', 'warning', 6000);
    } else {
      showToast(err.message || 'Could not join queue.', 'error');
    }
  }
}

// ─── Active Ticket ────────────────────────────────────────────────────────────
async function loadActiveTicket() {
  try {
    const ticket = await api.getActiveTicket();
    renderActiveTicket(ticket);
  } catch (_) {
    renderActiveTicket(null);
  }
}

function renderActiveTicket(ticket) {
  const banner = document.getElementById('active-ticket-banner');

  if (!ticket) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = '';

  document.getElementById('ticket-code-display').textContent = ticket.ticket_code || '—';
  document.getElementById('ticket-dept-display').textContent = ticket.department || '';
  document.getElementById('ticket-position').textContent     = ticket.position != null ? `#${ticket.position}` : '—';
  document.getElementById('ticket-wait').textContent         = ticket.estimated_wait_minutes != null
                                                               ? `${Math.round(ticket.estimated_wait_minutes)} min` : '—';

  const badge = document.getElementById('ticket-status-badge');
  const status = (ticket.status || 'waiting').toLowerCase();
  badge.textContent = statusLabel(status);
  badge.className   = `status-badge status-${status}`;

  // Hide cancel button if ticket is past waiting/called
  const cancelBtn = document.getElementById('cancel-ticket-btn');
  cancelBtn.style.display = ['waiting', 'called'].includes(status) ? '' : 'none';
  cancelBtn.dataset.ticketId = ticket.id;
}

// ─── Cancel Ticket ────────────────────────────────────────────────────────────
async function cancelCurrentTicket() {
  const btn = document.getElementById('cancel-ticket-btn');
  const ticketId = btn.dataset.ticketId;
  if (!ticketId) return;

  const confirmed = await showConfirm(
    'Cancel your ticket?',
    'You will lose your position in the queue. This cannot be undone.',
    'Cancel ticket'
  );
  if (!confirmed) return;

  try {
    await api.cancelTicket(ticketId);
    showToast('Your ticket has been cancelled.', 'default');
    renderActiveTicket(null);
    loadDepartments();
  } catch (err) {
    showToast(err.message || 'Could not cancel ticket.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function loadStaffDashboard() {
  loadQueueStatus();
  _staffQueuePoll = setInterval(loadQueueStatus, 3000);
}

async function loadQueueStatus() {
  try {
    const data = await api.getStaffQueue();
    renderStaffQueue(data);
  } catch (err) {
    if (err.message && err.message.includes('No department')) {
      showToast('Your account is not assigned to a department. Please contact an administrator.', 'warning', 8000);
      stopAllPolling();
    }
  }
}

function renderStaffQueue(data) {
  // Header
  document.getElementById('staff-dept-title').textContent = data.department_name || 'Queue Dashboard';
  document.getElementById('staff-dept-sub').textContent   = `${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  // Queue status
  const status     = (data.status || 'unknown').toLowerCase();
  const statusDot  = document.getElementById('queue-status-dot');
  const statusLabel_el = document.getElementById('queue-status-label');
  statusDot.className  = `status-dot ${status}`;
  statusLabel_el.textContent = statusLabel(status);

  // Stats
  document.getElementById('stat-waiting').textContent  = data.waiting_count ?? '—';
  document.getElementById('stat-avg-wait').textContent = data.average_service_minutes != null
                                                         ? Math.round(data.average_service_minutes) : '—';

  // Now Serving
  const now     = data.now_serving;
  const stat3   = document.getElementById('stat-now-serving');
  const panel   = document.getElementById('serving-panel');

  if (now) {
    stat3.textContent = now.ticket_code || '—';
    panel.style.display = '';
    document.getElementById('serving-code').textContent    = now.ticket_code || '—';
    document.getElementById('serving-student').textContent = now.student_name || '—';
    document.getElementById('serving-note').textContent    = now.note || '';
    document.getElementById('serve-btn').dataset.ticketId  = now.id;
    document.getElementById('noshow-btn').dataset.ticketId = now.id;
  } else {
    stat3.textContent   = '—';
    panel.style.display = 'none';
  }

  // Waiting list
  renderWaitingList(data.waiting_tickets || []);
}

function renderWaitingList(tickets) {
  const list = document.getElementById('waiting-list');

  if (!tickets.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">✓</span><p>No one is waiting right now</p></div>`;
    return;
  }

  list.innerHTML = '';
  tickets.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'waiting-item';
    item.innerHTML = `
      <div class="waiting-pos ${i === 0 ? 'pos-1' : ''}">${i + 1}</div>
      <span class="waiting-ticket-code">${escHtml(t.ticket_code || '')}</span>
      <span class="waiting-student">${escHtml(t.student_name || '—')}</span>
      ${t.note ? `<span class="waiting-note">${escHtml(t.note)}</span>` : ''}
      <span class="waiting-time">${relativeTime(t.created_at)}</span>
    `;
    list.appendChild(item);
  });
}

// ─── Staff Actions ────────────────────────────────────────────────────────────
async function callNext() {
  const btn = document.getElementById('call-next-btn');
  btn.disabled = true;
  try {
    const ticket = await api.callNextTicket();
    showToast(`Calling ${ticket.ticket_code}`, 'success');
    await loadQueueStatus();
  } catch (err) {
    showToast(err.message || 'No tickets to call.', 'warning');
  } finally {
    btn.disabled = false;
  }
}

async function serveCurrentTicket() {
  const btn = document.getElementById('serve-btn');
  const ticketId = btn.dataset.ticketId;
  if (!ticketId) return;
  btn.disabled = true;
  try {
    await api.serveTicket(ticketId);
    showToast('Ticket marked as served.', 'success');
    await loadQueueStatus();
  } catch (err) {
    showToast(err.message || 'Could not mark as served.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function markCurrentNoShow() {
  const btn = document.getElementById('noshow-btn');
  const ticketId = btn.dataset.ticketId;
  if (!ticketId) return;

  const confirmed = await showConfirm('Mark as No Show?', 'The customer will lose their place in the queue.', 'Mark No Show');
  if (!confirmed) return;

  btn.disabled = true;
  try {
    await api.markNoShow(ticketId);
    showToast('Marked as no show.', 'default');
    await loadQueueStatus();
  } catch (err) {
    showToast(err.message || 'Could not update ticket.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function toggleQueueStatus() {
  const btn = document.getElementById('toggle-queue-btn');
  btn.disabled = true;

  const currentLabel = document.getElementById('queue-status-label').textContent.toLowerCase();
  let newStatus;

  if (currentLabel === 'open')   newStatus = 'paused';
  else if (currentLabel === 'paused') newStatus = 'open';
  else newStatus = 'open';

  const confirmed = await showConfirm(
    `${newStatus === 'open' ? 'Open' : 'Pause'} Queue?`,
    `Queue will be set to "${newStatus}".`,
    'Confirm'
  );

  if (!confirmed) { btn.disabled = false; return; }

  try {
    await api.updateQueueStatus(newStatus);
    showToast(`Queue is now ${newStatus}.`, 'success');
    await loadQueueStatus();
  } catch (err) {
    showToast(err.message || 'Could not update queue status.', 'error');
  } finally {
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

async function loadReport() {
  const wrap   = document.getElementById('report-table-wrap');
  const picker = document.getElementById('report-date');
  const date   = picker ? picker.value : null;

  wrap.innerHTML = '<div class="loading-state">Loading report…</div>';

  try {
    const data = await api.getReportSummary(date);
    renderReport(data);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">✕</span><p>Failed to load report. <button class="btn btn-outline btn-sm" onclick="loadReport()">Retry</button></p></div>`;
    showToast('Could not load report.', 'error');
  }
}

function renderReport(data) {
  const wrap = document.getElementById('report-table-wrap');
  const depts = data.departments || [];

  if (!depts.length) {
    wrap.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📊</span><p>No data for this date.</p></div>`;
    return;
  }

  const rows = depts.map(d => `
    <tr>
      <td>
        <span class="report-dept-name">${escHtml(d.department_name || '—')}</span>
        <span class="report-dept-code">${escHtml(d.department_code || '')}</span>
      </td>
      <td>${d.tickets_issued ?? 0}</td>
      <td>${d.tickets_served ?? 0}</td>
      <td>${d.tickets_cancelled ?? 0}</td>
      <td>${d.no_shows ?? 0}</td>
      <td>${d.still_waiting ?? 0}</td>
      <td>${d.avg_service_minutes != null ? `${Math.round(d.avg_service_minutes)} min` : '—'}</td>
      <td>${d.avg_wait_minutes != null ? `${Math.round(d.avg_wait_minutes)} min` : '—'}</td>
    </tr>
  `).join('');

  const tot = data.totals || {};

  wrap.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Department</th>
          <th>Issued</th>
          <th>Served</th>
          <th>Cancelled</th>
          <th>No Shows</th>
          <th>Waiting</th>
          <th>Avg Service</th>
          <th>Avg Wait</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td>Totals</td>
          <td>${tot.tickets_issued ?? 0}</td>
          <td>${tot.tickets_served ?? 0}</td>
          <td>${tot.tickets_cancelled ?? 0}</td>
          <td>${tot.no_shows ?? 0}</td>
          <td>${tot.still_waiting ?? 0}</td>
          <td>—</td>
          <td>—</td>
        </tr>
      </tfoot>
    </table>
  `;
}

// ─── Utility Functions ────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(status) {
  const labels = {
    open: 'Open', paused: 'Paused', closed: 'Closed',
    waiting: 'Waiting', called: 'Called', serving: 'Serving',
    served: 'Served', cancelled: 'Cancelled', no_show: 'No Show', unknown: '—',
  };
  return labels[status] || status;
}

function formatTime(t) {
  if (!t) return '—';
  // t is HH:MM:SS or HH:MM
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  return `${Math.floor(diff / 60)}h ago`;
}
