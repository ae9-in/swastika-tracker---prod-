import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Phone, MapPin, MessageSquare, ArrowRight, History, Calendar, User, Clock, FileText, UserCheck, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, statusOrder } from '../services/api';
import PageHeader from '../components/common/PageHeader';

export default function AffiliateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [remark, setRemark] = useState('');
  const [targetStatus, setTargetStatus] = useState('');

  // Follow-up scheduling state
  const [employees, setEmployees] = useState([]);
  const [followUp, setFollowUp] = useState({ title: '', dueDate: '', priority: 'medium', assignedTo: '' });
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState('');
  const [followUpError, setFollowUpError] = useState('');

  const loadDetail = useCallback(async () => {
    const res = await api.affiliates.getById(token, id);
    setRecord(res.affiliate);
    setHistory(res.history);
    setTargetStatus(res.affiliate.status);
  }, [id, token]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.auth.listEmployees(token);
      setEmployees(res.data || []);
    } catch {
      // Non-critical — just leave empty
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;
    loadDetail().catch((err) => {
      if (mounted) setError(err.message);
    });
    loadEmployees();
    return () => { mounted = false; };
  }, [loadDetail, loadEmployees]);

  const nextStatus = useMemo(() => {
    if (!record) return null;
    const currentIndex = statusOrder.indexOf(record.status);
    if (currentIndex < 0 || currentIndex === statusOrder.length - 1) return null;
    return statusOrder[currentIndex + 1];
  }, [record]);

  async function updateStatus(customStatus) {
    const finalStatus = customStatus || targetStatus;
    if (!finalStatus || finalStatus === record.status) return;
    setSaving(true);
    setError('');
    try {
      await api.affiliates.transitionStatus(token, id, { newStatus: finalStatus, remark });
      await loadDetail();
      setRemark('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleScheduleFollowUp(e) {
    e.preventDefault();
    if (!followUp.title || !followUp.dueDate) {
      setFollowUpError('Title and due date are required.');
      return;
    }
    setSchedulingFollowUp(true);
    setFollowUpError('');
    setFollowUpSuccess('');
    try {
      await api.reminders.create(token, {
        affiliateId: id,
        title: followUp.title,
        dueDate: followUp.dueDate,
        priority: followUp.priority,
        assignedTo: followUp.assignedTo || undefined,
      });
      const assignedName = employees.find(e => e.id === followUp.assignedTo)?.name;
      setFollowUpSuccess(
        followUp.assignedTo
          ? `✅ Follow-up scheduled & ${assignedName} has been notified!`
          : `✅ Follow-up scheduled successfully.`
      );
      setFollowUp({ title: '', dueDate: '', priority: 'medium', assignedTo: '' });
    } catch (err) {
      setFollowUpError(err.message);
    } finally {
      setSchedulingFollowUp(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to permanently delete this affiliate? This action cannot be undone.')) return;

    setSaving(true);
    setError('');
    try {
      await api.affiliates.remove(token, id);
      navigate('/app/affiliates', { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const handleWhatsApp = (phone) => {
    window.open(`https://wa.me/91${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const headerActions = useMemo(() => {
    if (!record) return [];

    const actions = [
      { label: 'Edit Affiliate', to: `/app/affiliates/${record.id}/edit` },
      { label: 'View All Reminders', to: '/app/reminders', variant: 'secondary' },
    ];

    if (user?.role === 'admin') {
      actions.push({ label: 'Delete Affiliate', onClick: handleDelete, variant: 'secondary', style: { color: '#ff4d4f' } });
    }

    return actions;
  }, [record, user, handleDelete]);

  if (error && !record) return <p className="error-banner">{error}</p>;
  if (!record) return <p className="loading-state">Loading affiliate profile...</p>;

  // Format today's date as YYYY-MM-DD for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="screen-stack">
      <PageHeader
        title={record.name}
        subtitle="Complete lifecycle and interaction history."
        actions={headerActions}
      />

      {/* Visual Status Pipeline */}
      <section className="pipeline-board">
        <div className="pipeline-steps">
          {statusOrder.map((status, index) => {
            const isActive = record.status === status;
            const isCompleted = statusOrder.indexOf(record.status) > index;
            return (
              <div key={status} className={`pipeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-indicator">
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="step-label">{status}</span>
                {index < statusOrder.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="detail-grid">
        <div className="split-grid-70">
          <div className="grid-stack">
            {/* Contact & Location Card */}
            <article className="detail-card">
              <div className="card-head">
                <User size={18} />
                <h3>Identity & Contact</h3>
              </div>
              <div className="info-bits">
                <div className="info-bit">
                  <label>Product Interest</label>
                  <span>{record.product}</span>
                </div>
                <div className="info-bit">
                  <label>Primary Phone</label>
                  <div className="contact-actions">
                    <span>{record.phone1}</span>
                    <button onClick={() => handleCall(record.phone1)} className="icon-btn" title="Call"><Phone size={14} /></button>
                    <button onClick={() => handleWhatsApp(record.phone1)} className="icon-btn wa" title="WhatsApp"><MessageSquare size={14} /></button>
                  </div>
                </div>
                <div className="info-bit">
                  <label>Secondary Phone</label>
                  <div className="contact-actions">
                    <span>{record.phone2 || 'Not Provided'}</span>
                    {record.phone2 && (
                      <>
                        <button onClick={() => handleCall(record.phone2)} className="icon-btn" title="Call"><Phone size={14} /></button>
                        <button onClick={() => handleWhatsApp(record.phone2)} className="icon-btn wa" title="WhatsApp"><MessageSquare size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="info-bit full">
                  <label><MapPin size={12} /> Address</label>
                  <p>{record.address}</p>
                </div>
                <div className="info-bit full">
                  <label><FileText size={12} /> Notes</label>
                  <p className="description-text">{record.description || 'No additional notes provided.'}</p>
                </div>
              </div>
            </article>

            {/* Status Transition Control */}
            <article className="form-card">
              <div className="card-head">
                <ArrowRight size={18} />
                <h3>Transition Pipeline</h3>
              </div>
              <div className="control-wrap">
                <div className="next-action-prompt">
                  {nextStatus ? (
                    <div className="promo-box">
                      <p>Ready to move forward?</p>
                      <button className="primary-btn" onClick={() => updateStatus(nextStatus)} disabled={saving}>
                        {saving ? 'Processing...' : `Move to ${nextStatus}`}
                      </button>
                    </div>
                  ) : (
                    <div className="success-banner">Final lifecycle stage reached.</div>
                  )}
                </div>
                <div className="manual-move">
                  <label>Or select manually</label>
                  <div className="toolbar-inline">
                    <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button className="secondary-btn" disabled={saving || targetStatus === record.status} onClick={() => updateStatus()}>
                      Apply Changes
                    </button>
                  </div>
                </div>
                <div className="remark-wrap">
                  <label>Add internal remark for this change</label>
                  <textarea
                    placeholder="E.g. Sample kit successfully delivered to shop..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
              </div>
            </article>

            {/* Schedule Next Follow-Up Card */}
            <article className="form-card">
              <div className="card-head">
                <Calendar size={18} />
                <h3>Schedule Next Follow-Up</h3>
              </div>
              <form className="control-wrap" onSubmit={handleScheduleFollowUp}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Follow-Up Title <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Check if samples were reviewed"
                      value={followUp.title}
                      onChange={(e) => setFollowUp(f => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Due Date <span className="req">*</span></label>
                    <input
                      type="date"
                      min={today}
                      value={followUp.dueDate}
                      onChange={(e) => setFollowUp(f => ({ ...f, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Priority</label>
                    <select value={followUp.priority} onChange={(e) => setFollowUp(f => ({ ...f, priority: e.target.value }))}>
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label><UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} />Assign To Employee</label>
                    <select value={followUp.assignedTo} onChange={(e) => setFollowUp(f => ({ ...f, assignedTo: e.target.value }))}>
                      <option value="">— Unassigned —</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {followUp.assignedTo && (
                  <div className="assign-preview">
                    <Bell size={13} />
                    <span>
                      <strong>{employees.find(e => e.id === followUp.assignedTo)?.name}</strong> will receive a push notification when this follow-up is created.
                    </span>
                  </div>
                )}

                {followUpSuccess && <p className="success-msg">{followUpSuccess}</p>}
                {followUpError && <p className="error-banner">{followUpError}</p>}

                <div className="toolbar-inline">
                  <button type="submit" className="primary-btn" disabled={schedulingFollowUp}>
                    {schedulingFollowUp ? 'Scheduling...' : '📅 Schedule Follow-Up'}
                  </button>
                  <Link to="/app/reminders" className="ghost-btn">View All Reminders</Link>
                </div>
              </form>
            </article>
          </div>
        </div>

        <div className="split-grid-30">
          {/* History Timeline */}
          <article className="activity-card">
            <div className="card-head">
              <History size={18} />
              <h3>Audit Timeline</h3>
            </div>
            <div className="timeline-wrap">
              {history.length === 0 ? <p className="empty-msg">No history recorded yet.</p> : null}
              {history.map((item, idx) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-node">
                    {idx === 0 ? <Clock size={12} /> : <div className="dot" />}
                  </div>
                  <div className="timeline-content">
                    <div className="time-meta">
                      <span className="time-pill">{new Date(item.changedAt).toLocaleDateString()}</span>
                      <span className="time-hour">{new Date(item.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="transition-msg">
                      <span className="from">{item.fromStatus}</span>
                      <ArrowRight size={10} />
                      <span className="to">{item.toStatus}</span>
                    </p>
                    {item.remark && <p className="remark-text">"{item.remark}"</p>}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/app/activities" className="ghost-btn full-width mt-12">View Details Activity Feed</Link>
          </article>
        </div>
      </section>

      {error ? <p className="error-banner mt-16">{error}</p> : null}
    </div>
  );
}
