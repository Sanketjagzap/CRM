import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/layouts/AppShell';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { RequireRole } from '../components/common/RequireRole';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/endpoints';
import { pageVariants } from '../animations/pageVariants';
import { motion } from 'framer-motion';

const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Leads = lazy(() => import('../pages/leads/Leads'));
const Contacts = lazy(() => import('../pages/contacts/Contacts'));
const Companies = lazy(() => import('../pages/companies/Companies'));
const Deals = lazy(() => import('../pages/deals/Deals'));
const Tasks = lazy(() => import('../pages/tasks/Tasks'));
const Revenue = lazy(() => import('../pages/revenue/Revenue'));
const Products = lazy(() => import('../pages/products/Products'));
const Activities = lazy(() => import('../pages/activities/Activities'));
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const Users = lazy(() => import('../pages/users/Users'));

function SessionBootstrap() {
  const token = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.auth.me();
      return response.data.data;
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (data) {
      setSession({ user: data, accessToken: token });
    }
  }, [data, setSession, token]);

  return null;
}

function RouteFrame({ children }) {
  const location = useLocation();
  return (
    <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

export function AppRoutes() {
  return (
    <>
      <SessionBootstrap />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RouteFrame><Dashboard /></RouteFrame>} />
          <Route path="/leads" element={<RouteFrame><Leads /></RouteFrame>} />
          <Route path="/contacts" element={<RouteFrame><Contacts /></RouteFrame>} />
          <Route path="/companies" element={<RouteFrame><Companies /></RouteFrame>} />
          <Route path="/deals" element={<RouteFrame><Deals /></RouteFrame>} />
          <Route path="/tasks" element={<RouteFrame><Tasks /></RouteFrame>} />
          <Route path="/revenue" element={<RouteFrame><Revenue /></RouteFrame>} />
          <Route path="/products" element={<RouteFrame><Products /></RouteFrame>} />
          <Route path="/activities" element={<RouteFrame><Activities /></RouteFrame>} />
          <Route path="/analytics" element={<RequireRole roles={['admin', 'manager']}><RouteFrame><Analytics /></RouteFrame></RequireRole>} />
          <Route path="/settings" element={<RouteFrame><Settings /></RouteFrame>} />
          <Route path="/users" element={<RequireRole roles={['admin', 'manager']}><RouteFrame><Users /></RouteFrame></RequireRole>} />
          <Route path="/profile" element={<RouteFrame><Profile /></RouteFrame>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
