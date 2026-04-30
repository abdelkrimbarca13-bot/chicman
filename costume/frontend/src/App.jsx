import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { Suspense, lazy } from 'react';
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Items = lazy(() => import('./pages/Items'));
const Customers = lazy(() => import('./pages/Customers'));
const Rentals = lazy(() => import('./pages/Rentals'));
const Tailor = lazy(() => import('./pages/Tailor'));
const Repairs = lazy(() => import('./pages/Repairs'));
const Revenue = lazy(() => import('./pages/Revenue'));
const Cash = lazy(() => import('./pages/Cash'));
const Sales = lazy(() => import('./pages/Sales'));
const Audit = lazy(() => import('./pages/Audit'));
const Users = lazy(() => import('./pages/Users'));

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/items" element={<PrivateRoute><Items /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/rentals" element={<PrivateRoute><Rentals /></PrivateRoute>} />
              <Route path="/tailor" element={<PrivateRoute><Tailor /></PrivateRoute>} />
              <Route path="/repairs" element={<PrivateRoute><Repairs /></PrivateRoute>} />
              <Route path="/revenue" element={<PrivateRoute><Revenue /></PrivateRoute>} />
              <Route path="/cash" element={<PrivateRoute><Cash /></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
              <Route path="/audit" element={<PrivateRoute><Audit /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
