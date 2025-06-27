import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError('فشل في تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* شعار التطبيق */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h2"
                className="arabic-title"
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  mb: 1,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                شسمه ✨
              </Typography>
              <Typography
                variant="h6"
                className="arabic-text"
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 300
                }}
              >
                منصة التواصل العربية الأنيقة
              </Typography>
            </Box>

            {/* بطاقة تسجيل الدخول */}
            <Card className="glass-card" sx={{ maxWidth: 500, mx: 'auto' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h4"
                  className="arabic-title"
                  sx={{ 
                    textAlign: 'center',
                    mb: 3,
                    color: '#2c3e50',
                    fontWeight: 600
                  }}
                >
                  تسجيل الدخول 🔐
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  {/* البريد الإلكتروني */}
                  <TextField
                    fullWidth
                    name="email"
                    label="البريد الإلكتروني"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ ml: 1, color: '#e91e63' }} />,
                    }}
                  />

                  {/* كلمة المرور */}
                  <TextField
                    fullWidth
                    name="password"
                    label="كلمة المرور"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    sx={{ mb: 4 }}
                    InputProps={{
                      startAdornment: <LockIcon sx={{ ml: 1, color: '#e91e63' }} />,
                      endAdornment: (
                        <Button
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ minWidth: 'auto', color: '#666' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      ),
                    }}
                  />

                  {/* زر تسجيل الدخول */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      mb: 3,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d81b60, #8e24aa)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(233, 30, 99, 0.4)',
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'دخول 🚀'
                    )}
                  </Button>

                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      أو
                    </Typography>
                  </Divider>

                  {/* رابط التسجيل */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" className="arabic-text">
                      ليس لديك حساب؟{' '}
                      <Link
                        to="/signup"
                        style={{
                          color: '#e91e63',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        سجل الآن ✨
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* نص ترحيبي */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  mt: 3,
                  color: 'rgba(255,255,255,0.8)',
                  maxWidth: 400,
                  mx: 'auto'
                }}
              >
                انضم إلى مجتمع شسمه واستمتع بتجربة تواصل اجتماعي عربية فريدة مع الألعاب التفاعلية ونظام النقاط المميز! 🎮✨
              </Typography>
            </motion.div>
          </motion.div>
        </Container>
      </Box>
    </motion.div>
  );
};

export default LoginPage;
