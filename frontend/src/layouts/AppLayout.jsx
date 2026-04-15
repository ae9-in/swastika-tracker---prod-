import { Activity, BellRing, Building2, ChartColumnBig, LogOut, Plus, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

function navLinkClass({ isActive }) {
  return `nav-link ${isActive ? 'nav-link-active' : ''}`;
}

export default function AppLayout() {
  const { user, activeBusiness, allowedBusinesses, selectBusiness, logout } = useAuth();
  const navigate = useNavigate();

  async function handleBusinessChange(event) {
    await selectBusiness(event.target.value);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <p className="brand-title">Swastika Tracker</p>
            <p className="brand-subtitle">Affiliates CRM</p>
          </div>
        </div>

        <nav className="nav-stack">
          <NavLink to="/app/dashboard" className={navLinkClass}>
            <ChartColumnBig size={18} /> Dashboard
          </NavLink>
          <NavLink to="/app/affiliates" className={navLinkClass}>
            <Users size={18} /> Affiliates
          </NavLink>
          <NavLink to="/app/affiliates/new" className={navLinkClass}>
            <Plus size={18} /> New Affiliate
          </NavLink>
          <NavLink to="/app/reminders" className={navLinkClass}>
            <BellRing size={18} /> Reminders
          </NavLink>
          <NavLink to="/app/activities" className={navLinkClass}>
            <Activity size={18} /> Activity Feed
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div>
            <p className="topbar-title">Operations Workspace</p>
            <p className="topbar-subtitle">Premium lead orchestration for H&W and Pooja.</p>
          </div>

          <div className="topbar-right">
            <ThemeToggle />

            <div className="business-switch-wrap">
              <Building2 size={16} />
              <select
                value={activeBusiness?.id || ''}
                onChange={handleBusinessChange}
                disabled={allowedBusinesses.length === 0}
              >
                {!activeBusiness && <option value="">Select business</option>}
                {allowedBusinesses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-chip">
              <span>{user?.name}</span>
              <small style={{ textTransform: 'capitalize' }}>{user?.role}</small>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
