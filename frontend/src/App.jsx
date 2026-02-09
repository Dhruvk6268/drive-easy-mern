import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import MyBookings from './pages/MyBookings';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import LoadingScreen from './components/LoadingScreen';
import MyTickets from './components/MyTickets';
import Checkout from './pages/Checkout';
import ForgotPassword from './components/ForgotPassword';
import PartnerDashboard from './components/PartnerDashboard';
import BecomePartner from './components/BecomePartner';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh user data from server
  const refreshUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const freshUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If token is invalid, logout user
      if (error.response?.status === 401) {
        handleLogout();
      }
      return null;
    }
  };

  // Enhanced login function with server refresh
  const login = async (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // Refresh to get latest status from server
    await refreshUserData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Enhanced updateUser function that also refreshes from server
  const updateUser = async (updatedUserData) => {
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
    
    // Also refresh from server to ensure consistency
    const token = localStorage.getItem('token');
    if (token) {
      await refreshUserData(token);
    }
  };

  // Listen for storage events to sync user data across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const updatedUser = JSON.parse(e.newValue || 'null');
          if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
            setUser(updatedUser);
          }
        } catch (error) {
          console.error('Error parsing user data from storage:', error);
        }
      }
      
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        handleLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Initial authentication check
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token and get fresh user data
          const freshUser = await refreshUserData(token);
          if (!freshUser) {
            // Token is invalid, logout
            handleLogout();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          handleLogout();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Protected route wrapper component
  const ProtectedRoute = ({ children, requireAdmin = false, requirePartner = false }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && !user.isAdmin) {
      return <Navigate to="/" replace />;
    }
    
    if (requirePartner && !user.isPartner) {
      return <Navigate to="/become-partner" replace />;
    }
    
    return children;
  };

  // Public route wrapper (redirect to home if already logged in)
  const PublicRoute = ({ children }) => {
    return user ? <Navigate to="/" replace /> : children;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} logout={handleLogout} setUser={setUser} />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home user={user} logout={handleLogout} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Auth Routes (public only) */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login login={login} />
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
            
            {/* Protected User Routes */}
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            
            {/* Partner Routes */}
            <Route 
              path="/become-partner" 
              element={
                <ProtectedRoute>
                  {user?.isPartner ? 
                    <Navigate to="/partner-dashboard" replace /> : 
                    <BecomePartner user={user} updateUser={updateUser} />
                  }
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/partner-dashboard" 
              element={
                <ProtectedRoute requirePartner>
                  <PartnerDashboard user={user} setUser={setUser} />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        
      </div>
    </Router>
  );
}

export default App;