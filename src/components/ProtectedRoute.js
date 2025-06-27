import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null; // سيتم عرض LoadingScreen من App.js
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
