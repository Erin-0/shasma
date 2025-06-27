import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

// Context
import { AuthProvider } from  './hooks/useAuth';

// Components
import TopAppBar from './components/AppBar';
import BottomNavigation from './components/BottomNavigation';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
//مسحت امه
// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import GamesPage from './pages/GamesPage';
import StorePage from './pages/StorePage';
import SettingsPage from './pages/SettingsPage';



// Loading Component
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ textAlign: 'center' }}
    >
      <Typography 
        variant="h2" 
        className="arabic-title gradient-text"
        sx={{ mb: 3, fontWeight: 700 }}
      >
        شسمه
      </Typography>
      <Typography 
        variant="h6" 
        className="arabic-text"
        sx={{ mb: 4, opacity: 0.9 }}
      >
        منصة التواصل العربية الأنيقة
      </Typography>
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{ 
          color: '#e91e63',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
      />
    </motion.div>
  </Box>
);

// Main App Layout
const AppLayout = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {currentUser && <TopAppBar />}
      
      <Box sx={{ 
        flex: 1, 
        pt: currentUser ? '64px' : 0,
        pb: currentUser ? '80px' : 0, // مساحة للـ bottom navigation
        minHeight: currentUser ? 'calc(100vh - 144px)' : '100vh',
        overflow: 'auto'
      }}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              currentUser ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/signup" 
            element={
              currentUser ? <Navigate to="/" replace /> : <SignupPage />
            } 
          />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:userId?" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          } />
          
          <Route path="/chat/:chatId?" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/games" element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/store" element={
            <ProtectedRoute>
              <StorePage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Fallback Route */}
          <Route 
            path="*" 
            element={
              currentUser ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </Box>
      
      {currentUser && <BottomNavigation />}
    </Box>
  );
};

function App() {
  useEffect(() => {
    console.log(
      "%cأهاااا أخوي! تحاول تهكر التطبيق؟ 😏💣",
      "font-size: 16px; color: #e91e63; font-weight: bold;"
    );
    console.log(
      "%cشوف يا بطل، أنا متابع كل خطوة 🤫✨",
      "color: #9c27b0; font-style: italic;"
    );
    console.log(
      "%cرحم الله من عرف قدر أخيه 😎",
      "color: #ffd700; font-size: 14px;"
    );
    console.log(
      "%cبليييز لاااا 😭😭🙏🏻🙏🏻🙏🏻🙏🏻",
      "color: rgb(255, 0, 0); font-size: 20px;"
    );
  }, []);

  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;
