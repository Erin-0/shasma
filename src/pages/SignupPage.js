import React, { useState, useRef } from 'react';
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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  PhotoCamera,
  Cake as CakeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const fileInputRef = useRef();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة كبير جداً. يجب أن يكون أقل من 5 ميجابايت.');
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePictureUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      setError('يرجى إدخال الاسم');
      return false;
    }
    if (formData.displayName.length < 2) {
      setError('الاسم يجب أن يكون أكثر من حرفين');
      return false;
    }
    if (!formData.email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return false;
    }
    if (!formData.password) {
      setError('يرجى إدخال كلمة المرور');
      return false;
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return false;
    }
    if (!formData.age || formData.age < 13 || formData.age > 100) {
      setError('يرجى إدخال عمر صحيح (13-100)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await signup(
        formData.email,
        formData.password,
        formData.displayName,
        formData.age,
        profilePictureUrl
      );
      navigate('/');
    } catch (error) {
      setError('فشل في إنشاء الحساب. حاول مرة أخرى.');
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
          p: 2,
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* شعار التطبيق */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
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
                انضم إلى المجتمع العربي الأنيق
              </Typography>
            </Box>

            {/* بطاقة التسجيل */}
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
                  إنشاء حساب جديد 🎉
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  {/* صورة الملف الشخصي */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={profilePictureUrl}
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          mx: 'auto',
                          border: '3px solid #e91e63',
                          background: 'linear-gradient(135deg, #e91e63, #9c27b0)'
                        }}
                      >
                        📸
                      </Avatar>
                      <Button
                        component="label"
                        sx={{
                          position: 'absolute',
                          bottom: -5,
                          right: -5,
                          minWidth: 35,
                          height: 35,
                          borderRadius: '50%',
                          background: '#e91e63',
                          color: 'white',
                          '&:hover': {
                            background: '#d81b60',
                          }
                        }}
                      >
                        <PhotoCamera fontSize="small" />
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      اختر صورة للملف الشخصي (اختياري)
                    </Typography>
                  </Box>

                  {/* الاسم */}
                  <TextField
                    fullWidth
                    name="displayName"
                    label="الاسم الفريد"
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ ml: 1, color: '#e91e63' }} />,
                    }}
                    helperText="سيظهر هذا الاسم للآخرين"
                  />

                  {/* البريد الإلكتروني */}
                  <TextField
                    fullWidth
                    name="email"
                    label="البريد الإلكتروني"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ ml: 1, color: '#e91e63' }} />,
                    }}
                  />

                  {/* العمر */}
                  <TextField
                    fullWidth
                    name="age"
                    label="العمر"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 13, max: 100 }}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <CakeIcon sx={{ ml: 1, color: '#e91e63' }} />,
                    }}
                    helperText="يستخدم العمر لتخصيص الألعاب"
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
                    sx={{ mb: 2 }}
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

                  {/* تأكيد كلمة المرور */}
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    label="تأكيد كلمة المرور"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    sx={{ mb: 4 }}
                    InputProps={{
                      startAdornment: <LockIcon sx={{ ml: 1, color: '#e91e63' }} />,
                      endAdornment: (
                        <Button
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          sx={{ minWidth: 'auto', color: '#666' }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      ),
                    }}
                  />

                  {/* زر التسجيل */}
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
                      'إنشاء الحساب 🚀'
                    )}
                  </Button>

                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      أو
                    </Typography>
                  </Divider>

                  {/* رابط تسجيل الدخول */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" className="arabic-text">
                      لديك حساب بالفعل؟{' '}
                      <Link
                        to="/login"
                        style={{
                          color: '#e91e63',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        سجل الدخول 🔐
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    </motion.div>
  );
};

export default SignupPage;
