import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/common/ThemeToggle';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            await register(formData.name, formData.email, formData.password);
            navigate('/select-business');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page animate-up">
            <ThemeToggle floating />
            <div className="auth-bg" />
            <motion.section
                className="auth-card"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <p className="eyebrow">Swastika Tracker</p>
                <h1>Create an Account</h1>
                <p className="subtitle">Register as staff to access operations workspace.</p>

                <form onSubmit={handleSubmit} className="form-stack">
                    <label>
                        Full Name
                        <div className="input-wrap">
                            <User size={16} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </label>

                    <label>
                        Email Address
                        <div className="input-wrap">
                            <Mail size={16} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                placeholder="hello@example.com"
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
                                value={formData.password}
                                onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </label>

                    {error && (
                        <motion.p
                            className="error-banner"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {error}
                        </motion.p>
                    )}

                    <button type="submit" disabled={isLoading} className="primary-btn">
                        {isLoading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <small className="text-muted">
                        Already have an account? <Link to="/login" className="link">Sign In</Link>
                    </small>
                </div>
            </motion.section>
        </div>
    );
}
