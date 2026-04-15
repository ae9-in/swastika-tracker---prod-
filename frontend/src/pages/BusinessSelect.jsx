import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

export default function BusinessSelect() {
  const navigate = useNavigate();
  const { allowedBusinesses, activeBusiness, selectBusiness } = useAuth();

  async function enterBusiness(id) {
    await selectBusiness(id);
    navigate('/app/dashboard');
  }

  if (activeBusiness) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="business-page animate-up">
      <ThemeToggle floating />
      <section className="business-card">
        <h2>Select Business Context</h2>
        <p>Choose where you want to operate now. Data stays isolated by business.</p>

        <div className="business-grid">
          {allowedBusinesses.map((business, index) => (
            <button
              type="button"
              key={business.id}
              onClick={() => enterBusiness(business.id)}
              className="business-tile"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <strong>{business.name}</strong>
              <span>{business.code}</span>
              <small>Enter workspace</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
