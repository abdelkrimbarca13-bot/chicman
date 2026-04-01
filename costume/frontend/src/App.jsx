import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Customers from './pages/Customers';
import Rentals from './pages/Rentals';
import Revenue from './pages/Revenue';
import Cash from './pages/Cash';
import Audit from './pages/Audit';
import Users from './pages/Users';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/items" element={<PrivateRoute><Items /></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
            <Route path="/rentals" element={<PrivateRoute><Rentals /></PrivateRoute>} />
            <Route path="/revenue" element={<PrivateRoute><Revenue /></PrivateRoute>} />
            <Route path="/cash" element={<PrivateRoute><Cash /></PrivateRoute>} />
            <Route path="/audit" element={<PrivateRoute><Audit /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
