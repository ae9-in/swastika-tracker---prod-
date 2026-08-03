import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import PageHeader from '../components/common/PageHeader';
import { generateDashboardPDF } from '../utils/exportUtils';

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

export default function Dashboard() {
  const { token, activeBusiness, user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [error, setError] = useState('');
  const isStaffView = user?.role === 'staff';

  useEffect(() => {
    if (isStaffView) {
      return undefined;
    }

    let mounted = true;
    api.analytics
      .affiliates(token, rangeDays)
      .then((res) => {
        if (mounted) {
          setMetrics(res);
          setError('');
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isStaffView, rangeDays, token]);

  const handleExport = () => {
    if (metrics) {
      generateDashboardPDF(metrics, activeBusiness?.name || 'Business');
    }
  };

  const donutData = useMemo(() => {
    if (!metrics) {
      return [];
    }

    return Object.entries(metrics.statusCounts).map(([label, value]) => ({ label, value }));
  }, [metrics]);

  if (isStaffView) {
    return (
      <div className="screen-stack">
        <PageHeader
          title={`Staff Workspace: ${activeBusiness?.name || 'Business'}`}
          subtitle="Welcome to your operations center. Manage affiliates and reminders below."
          actions={[{ label: 'Add Affiliate', to: '/app/affiliates/new' }]}
        />
        <section className="quick-grid">
          <Link to="/app/affiliates" className="quick-card">
            <h4>Affiliate Pipeline</h4>
            <p>Manage all affiliate records with filters and status visibility.</p>
            <span>Open list</span>
          </Link>
          <Link to="/app/reminders" className="quick-card">
            <h4>Reminder Board</h4>
            <p>Create and close action items before they become overdue.</p>
            <span>Open reminders</span>
          </Link>
        </section>
      </div>
    );
  }

  if (error) {
    return <p className="error-banner">{error}</p>;
  }

  if (!metrics) {
    return <p className="loading-state">Loading dashboard analytics...</p>;
  }

  return (
    <div className="screen-stack" data-export-target="dashboard">
      <PageHeader
        title={`${activeBusiness?.name || 'Business'} Dashboard`}
        subtitle="Clear operational insights for affiliates, reminders, and growth health."
        actions={[
          { label: 'Export Report', onClick: handleExport, variant: 'secondary' },
          { label: 'Add Affiliate', to: '/app/affiliates/new' },
        ]}
      />

      <section className="table-toolbar simple-toolbar">
        <div className="chip-row">
          <span className="info-chip">Live Analytics</span>
          <span className="info-chip">Business Scoped</span>
        </div>
        <select value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}>
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </section>

      <section className="stats-grid">
        <StatCard label="Total Affiliates" value={metrics.totals.totalAffiliates} />
        <StatCard label="Contacted" value={metrics.totals.contacted} />
        <StatCard label="Samples Given" value={metrics.totals.samplesGiven} />
        <StatCard label="Follow Up Visit" value={metrics.totals.followUpVisit} />
        <StatCard label="Delivered" value={metrics.totals.delivered || 0} />
      </section>

      <section className="quick-grid">
        <Link to="/app/affiliates" className="quick-card">
          <h4>Affiliate Pipeline</h4>
          <p>Manage all affiliate records with filters and status visibility.</p>
          <span>Open list</span>
        </Link>
        <Link to="/app/reminders" className="quick-card">
          <h4>Reminder Board</h4>
          <p>Create and close action items before they become overdue.</p>
          <span>Open reminders</span>
        </Link>
        <Link to="/app/activities" className="quick-card">
          <h4>Activity Audit</h4>
          <p>Track every change and event in one timeline.</p>
          <span>Open activity feed</span>
        </Link>
      </section>

      <section className="charts-grid">
        <LineChart data={metrics.trendSeries} title="Affiliate Growth Trend" />
        <DonutChart data={donutData} title="Status Composition" />
        <BarChart data={metrics.businessBreakdown} title="Business Distribution" />
      </section>

      <section className="split-grid mt-16">
        <article className="activity-card">
          <div className="panel-head">
            <div className="card-head" style={{ marginBottom: 0 }}>
              <h3>Upcoming Reminders</h3>
            </div>
            <Link to="/app/reminders" className="table-link">View all</Link>
          </div>
          <div className="premium-queue" style={{ marginTop: '16px' }}>
            {metrics.upcomingReminders.length === 0 ? <p className="loading-state">No pending reminders.</p> : null}
            {metrics.upcomingReminders.slice(0, 5).map((item) => (
              <div key={item.id} className="premium-task" style={{ padding: '14px' }}>
                <div className="task-body">
                  <h4 style={{ fontSize: '14px' }}>{item.title}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>Due {item.dueDate}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="activity-card">
          <div className="panel-head">
            <div className="card-head" style={{ marginBottom: 0 }}>
              <h3>Recent Activity</h3>
            </div>
            <Link to="/app/activities" className="table-link">View all</Link>
          </div>
          <div className="premium-queue" style={{ marginTop: '16px' }}>
            {metrics.recentActivities.length === 0 ? <p className="loading-state">No activity yet.</p> : null}
            {metrics.recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="premium-task" style={{ padding: '14px' }}>
                <div className="task-body">
                  <h4 style={{ fontSize: '14px' }}>{activity.message}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{new Date(activity.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
