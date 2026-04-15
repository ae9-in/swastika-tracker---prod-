import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import Auth from './pages/Auth';
import Register from './pages/Register';
import BusinessSelect from './pages/BusinessSelect';
import Dashboard from './pages/Dashboard';
import AffiliatesList from './pages/AffiliatesList';
import AffiliateForm from './pages/AffiliateForm';
import AffiliateDetail from './pages/AffiliateDetail';
import Reminders from './pages/Reminders';
import Activities from './pages/Activities';
import { ProtectedRoute, PublicRoute } from './components/common/RouteGuards';
import { subscribeToPush } from './utils/notifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';

function AppInitializer() {
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      subscribeToPush(user.id, {
        post: (url, data) => fetch(`${API_BASE}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        })
      });
    }
  }, [token, user]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInitializer />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/select-business"

                element={
                  <ProtectedRoute requiresBusiness={false}>
                    <BusinessSelect />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="affiliates" element={<AffiliatesList />} />
                <Route path="affiliates/new" element={<AffiliateForm />} />
                <Route path="affiliates/:id" element={<AffiliateDetail />} />
                <Route path="affiliates/:id/edit" element={<AffiliateForm />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="activities" element={<Activities />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
