import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { Bell, Calendar, Flag, CheckCircle, ExternalLink } from 'lucide-react';

export default function Reminders() {
  const { token } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [affiliates, setAffiliates] = useState([]);
  const [form, setForm] = useState({ affiliateId: '', title: '', dueDate: '', priority: 'medium' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadReminders() {
    const res = await api.reminders.list(token, statusFilter);
    setReminders(res.data);
  }

  async function loadAffiliates() {
    const res = await api.affiliates.list(token, { page: 1, pageSize: 200, status: 'All' });
    setAffiliates(res.data);
    if (res.data[0] && !form.affiliateId) {
      setForm((prev) => ({ ...prev, affiliateId: res.data[0].id }));
    }
  }

  useEffect(() => {
    Promise.all([loadReminders(), loadAffiliates()]).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, token]);

  async function submitReminder(event) {
    event.preventDefault();
    setError('');
    try {
      await api.reminders.create(token, form);
      setMessage('Reminder created.');
      setForm((prev) => ({ ...prev, title: '', dueDate: '' }));
      await loadReminders();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markComplete(id) {
    setError('');
    try {
      await api.reminders.complete(token, id);
      setMessage('Reminder completed.');
      await loadReminders();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="screen-stack animate-up">
      <PageHeader
        title="Reminders"
        subtitle="Manage upcoming action items and follow-ups with priority tracking."
        actions={[
          { label: 'Back to Dashboard', to: '/app/dashboard', variant: 'secondary' },
        ]}
      />

      <section className="detail-grid">
        <article className="form-card">
          <div className="card-head">
            <Bell size={18} />
            <h3>Create New Action</h3>
          </div>
          <form className="form-grid mt-16" onSubmit={submitReminder}>
            <label>
              Assign Affiliate
              <select
                value={form.affiliateId}
                onChange={(event) => setForm((prev) => ({ ...prev, affiliateId: event.target.value }))}
                required
              >
                {affiliates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority Level
              <select
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </label>
            <label className="full-span">
              Task Description
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Follow up on sample delivery"
                required
              />
            </label>
            <label className="full-span">
              Due Date
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </label>
            <div className="full-span action-row">
              <button type="submit" className="primary-btn full-width" disabled={!form.affiliateId}>
                Schedule Reminder
              </button>
            </div>
          </form>
        </article>

        <article className="activity-card">
          <div className="panel-head">
            <div className="card-head" style={{ marginBottom: 0 }}>
              <Flag size={18} />
              <h3>Action Queue</h3>
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="all">All Items</option>
            </select>
          </div>

          <div className="premium-queue">
            {reminders.length === 0 ? <p className="loading-state">No reminders found.</p> : null}
            {reminders.map((item) => (
              <div key={item.id} className="premium-task">
                <div className="priority-dot" style={{ background: `var(--priority-${item.priority})` }}></div>
                <div className="task-body">
                  <span className={`badge badge-${item.priority}`}>{item.priority}</span>
                  <h4>{item.title}</h4>
                  <p>{item.affiliateName}</p>
                </div>
                <div className="task-footer">
                  <small style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} /> {item.dueDate}
                  </small>
                  <div className="btn-inline-group">
                    <Link to={`/app/affiliates/${item.affiliateId}`} className="icon-btn" title="View Affiliate">
                      <ExternalLink size={14} />
                    </Link>
                    {item.status === 'pending' ? (
                      <button type="button" className="secondary-btn inline-btn" onClick={() => markComplete(item.id)}>
                        <CheckCircle size={14} /> Complete
                      </button>
                    ) : (
                      <span className="status-pill status-follow-up-visit">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {message ? <p className="success-banner mt-16">{message}</p> : null}
      {error ? <p className="error-banner mt-16">{error}</p> : null}
    </div>
  );
}

