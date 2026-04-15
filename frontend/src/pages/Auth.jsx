import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate('/select-business');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page animate-up">
      <ThemeToggle floating />
      <div className="auth-bg" />
      <section className="auth-card">
        <p className="eyebrow">Swastika Tracker</p>
        <h1>Affiliates Intelligence Suite</h1>
        <p className="subtitle">Log in to continue into H&W or Pooja workspace.</p>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Work Email
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@swastika.in"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-wrap">
              <Lock size={16} />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Signing in...' : 'Enter Workspace'}
          </button>
        </form>

        <div className="hint-box">
          <p>Demo users</p>
          <small>admin@swastika.in / Admin@123</small>
          <small>hw@swastika.in / Admin@123</small>
          <small>pooja@swastika.in / Admin@123</small>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <small className="text-muted">
            New employee? <a href="/register" className="link">Register here</a>
          </small>
        </div>
      </section>
    </div>
  );
}
