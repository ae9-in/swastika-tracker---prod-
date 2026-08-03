import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { Activity, User, Briefcase, RefreshCw, PlusCircle, CheckCircle, LayoutList, Calendar, Database, Building2 } from 'lucide-react';

const typeIcons = {
  affiliate_created: <PlusCircle size={14} />,
  affiliate_updated: <RefreshCw size={14} />,
  status_changed: <Activity size={14} />,
  affiliate_imported: <Briefcase size={14} />,
  reminder_created: <Calendar size={14} />,
  reminder_completed: <CheckCircle size={14} />
};

const CATEGORIES = [
  { id: 'all', label: 'All Activity', icon: <LayoutList size={14} /> },
  { id: 'lifecycle', label: 'Lifecycle', icon: <RefreshCw size={14} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckCircle size={14} /> },
  { id: 'system', label: 'System', icon: <Database size={14} /> }
];

export default function Activities() {
  const { token, user } = useAuth();
  const [limit, setLimit] = useState(100);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.activities
      .list(token, limit)
      .then((res) => {
        setRows(res.data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [limit, token]);

  const displayCategories = useMemo(() => {
    if (user?.role === 'admin') return CATEGORIES;
    return CATEGORIES.filter(c => c.id !== 'system');
  }, [user]);

  const groupedRows = useMemo(() => {
    // Phase 1: Filter by category tabs
    const filteredRows = rows.filter((row) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'lifecycle') {
        return ['affiliate_created', 'affiliate_updated', 'status_changed'].includes(row.type);
      }
      if (activeCategory === 'tasks') {
        return ['reminder_created', 'reminder_completed'].includes(row.type);
      }
      if (activeCategory === 'system' && user?.role === 'admin') {
        return ['affiliate_imported'].includes(row.type);
      }
      return true;
    });

    // Phase 2: Group by affiliate
    const groups = {};
    filteredRows.forEach(row => {
      const affId = row.metadata?.affiliateId || 'system';
      const affName = row.affiliateName || (affId === 'system' ? 'System & Bulk Operations' : 'Deleted/Unknown Affiliate');

      if (!groups[affId]) {
        groups[affId] = {
          id: affId,
          name: affName,
          activities: []
        };
      }
      groups[affId].activities.push(row);
    });

    // Phase 3: Sort clusters
    // 'system' always goes last. Otherwise, sort by the most recent timestamp in the grouped activities.
    return Object.values(groups).sort((a, b) => {
      if (a.id === 'system') return 1;
      if (b.id === 'system') return -1;
      return new Date(b.activities[0].createdAt) - new Date(a.activities[0].createdAt);
    });
  }, [rows, activeCategory, user]);

  return (
    <div className="screen-stack animate-up">
      <PageHeader
        title="Activity Feed"
        subtitle="Chronological audit of actions. Grouped seamlessly by affiliate."
        actions={[
          { label: 'Back to Dashboard', to: '/app/dashboard', variant: 'secondary' },
        ]}
      />

      <section className="activity-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-head" style={{ padding: '24px 24px 0' }}>
          <Activity size={18} />
          <h3>System Audit Log</h3>
        </div>

        {/* Tab Navigation */}
        <div className="tab-menu styled-scrollbar" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="chip"
              style={{
                cursor: 'pointer',
                background: activeCategory === cat.id ? 'var(--primary)' : 'var(--surface-sunken)',
                color: activeCategory === cat.id ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                gap: '6px'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="status-select">
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={500}>500 rows</option>
            </select>
          </div>
        </div>

        <div style={{ padding: '24px', background: 'var(--bg)' }}>
          {error ? <p className="error-banner">{error}</p> : null}

          <div>
            {groupedRows.length === 0 && !error ? <p className="loading-state">No activity found for this category.</p> : null}

            <AnimatePresence mode="popLayout">
              {groupedRows.map((group) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  key={group.id}
                  style={{ marginBottom: '40px', background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
                      {group.id === 'system' ? <Database size={20} color="var(--text-muted)" /> : <Building2 size={20} color="var(--primary)" />}
                      {group.name}
                    </h4>
                    {group.id !== 'system' && (
                      <Link to={`/app/affiliates/${group.id}`} className="primary-btn inline-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Open Profile
                      </Link>
                    )}
                  </div>

                  <div className="timeline-wrap" style={{ marginLeft: '12px' }}>
                    {group.activities.map((row) => (
                      <div className="timeline-item" key={row.id}>
                        <div className="timeline-node">
                          <div className="dot" style={{ background: row.type.includes('created') ? 'var(--success)' : row.type.includes('updated') ? 'var(--accent)' : 'var(--border)' }}></div>
                        </div>
                        <div className="timeline-content" style={{ background: 'var(--surface-sunken)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div className="time-meta" style={{ marginBottom: '8px' }}>
                            <span className="time-pill">{new Date(row.createdAt).toLocaleDateString()}</span>
                            <span className="time-hour">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="transition-msg">
                            <span className="info-chip" style={{ gap: '6px', background: 'transparent', padding: 0 }}>
                              {typeIcons[row.type] || <User size={14} />}
                              <strong style={{ color: 'var(--text-strong)', fontWeight: '500' }}>{row.message}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
