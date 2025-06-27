import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({
    displayName: userProfile?.displayName || '',
    bio: userProfile?.bio || '',
    profilePicture: userProfile?.profilePicture || '',
    age: userProfile?.age || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [settings, setSettings] = useState({
    notifications: true,
    publicProfile: true,
    showOnlineStatus: true,
    allowMessages: true
  });
  
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  // تحديث الملف الشخصي
  const handleUpdateProfile = async () => {
    if (!profileData.displayName.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    if (profileData.age && (profileData.age < 13 || profileData.age > 100)) {
      toast.error('يرجى إدخال عمر صحيح (13-100)');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        displayName: profileData.displayName,
        bio: profileData.bio,
        profilePicture: profileData.profilePicture,
        age: parseInt(profileData.age) || userProfile.age
      });
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
    } finally {
      setLoading(false);
    }
  };

  // تحديث كلمة المرور
  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      // إعادة تأكيد الهوية
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // تحديث كلمة المرور
      await updatePassword(currentUser, passwordData.newPassword);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('تم تحديث كلمة المرور بنجاح! 🔒');
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور الحالية غير صحيحة');
      } else {
        toast.error('حدث خطأ في تحديث كلمة المرور');
      }
    } finally {
      setLoading(false);
    }
  };

  // حذف الحساب
  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      toast.error('يرجى إدخال كلمة المرور للتأكيد');
      return;
    }

    setLoading(true);
    try {
      // إعادة تأكيد الهوية
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deleteConfirmPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // حذف بيانات المستخدم من Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // حذف الحساب
      await deleteUser(currentUser);
      
      toast.success('تم حذف الحساب بنجاح');
      navigate('/login');
    } catch (error) {
      console.error('خطأ في حذف الحساب:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('كلمة المرور غير صحيحة');
      } else {
        toast.error('حدث خطأ في حذف الحساب');
      }
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* رأس الصفحة */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card" sx={{ mb: 4, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h3" className="arabic-title gradient-text" sx={{ mb: 2 }}>
                ⚙️ الإعدادات
              </Typography>
              <Typography variant="h6" className="arabic-text" color="text.secondary">
                تخصيص حسابك وإعداداتك
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        <Grid container spacing={4}>
          {/* الملف الشخصي */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="glass-card" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="arabic-title" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <PaletteIcon sx={{ mr: 1, color: '#e91e63' }} />
                    الملف الشخصي
                  </Typography>

                  {/* الصورة الشخصية */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      src={profileData.profilePicture}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mx: 'auto',
                        mb: 2,
                        border: '3px solid #e91e63'
                      }}
                    >
                      {profileData.displayName?.charAt(0)}
                    </Avatar>
                  </Box>

                  {/* بيانات الملف الشخصي */}
                  <TextField
                    fullWidth
                    label="الاسم"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="النبذة الشخصية"
                    multiline
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="رابط الصورة الشخصية"
                    value={profileData.profilePicture}
                    onChange={(e) => setProfileData({ ...profileData, profilePicture: e.target.value })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="العمر"
                    type="number"
                    inputProps={{ min: 13, max: 100 }}
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                      borderRadius: 3
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'حفظ التغييرات'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* الأمان */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="glass-card" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="arabic-title" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1, color: '#e91e63' }} />
                    الأمان
                  </Typography>

                  <TextField
                    fullWidth
                    label="كلمة المرور الحالية"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="كلمة المرور الجديدة"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="تأكيد كلمة المرور الجديدة"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SecurityIcon />}
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                      borderRadius: 3,
                      mb: 2
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'تحديث كلمة المرور'}
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* إعدادات الخصوصية */}
                  <Typography variant="subtitle1" className="arabic-title" sx={{ mb: 2 }}>
                    إعدادات الخصوصية
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.publicProfile}
                        onChange={(e) => setSettings({ ...settings, publicProfile: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="ملف شخصي عام"
                    sx={{ mb: 1 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showOnlineStatus}
                        onChange={(e) => setSettings({ ...settings, showOnlineStatus: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="إظهار حالة الاتصال"
                    sx={{ mb: 1 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowMessages}
                        onChange={(e) => setSettings({ ...settings, allowMessages: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="السماح بالرسائل"
                    sx={{ mb: 1 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications}
                        onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="الإشعارات"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* معلومات الحساب */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="glass-card">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="arabic-title" sx={{ mb: 3 }}>
                    معلومات الحساب
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        البريد الإلكتروني
                      </Typography>
                      <Typography variant="body1" className="arabic-text">
                        {currentUser?.email}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        تاريخ التسجيل
                      </Typography>
                      <Typography variant="body1" className="arabic-text">
  {
    (() => {
      const createdAt = userProfile?.createdAt;
      if (!createdAt) return '---';
      if (typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleDateString('ar-SA');
      }
      return new Date(createdAt).toLocaleDateString('ar-SA');
    })()
  }
</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        عدد المنشورات
                      </Typography>
                      <Typography variant="body1" className="arabic-text">
                        {userProfile?.postsCount || 0} منشور
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        نقاط الدراغون
                      </Typography>
                      <Box className="dragon-points" sx={{ mt: 1 }}>
                        {userProfile?.dragons || 0}
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  {/* إجراءات الحساب */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                          borderColor: '#ff9800',
                          color: '#ff9800',
                          borderRadius: 3,
                          '&:hover': {
                            borderColor: '#f57c00',
                            background: 'rgba(255, 152, 0, 0.1)'
                          }
                        }}
                      >
                        تسجيل الخروج
                      </Button>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteDialog(true)}
                        sx={{ borderRadius: 3 }}
                      >
                        حذف الحساب
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* نافذة تأكيد حذف الحساب */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', color: '#f44336' }}>
            <Typography variant="h6" className="arabic-title">
              ⚠️ تحذير: حذف الحساب
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography className="arabic-text">
                <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل نهائي!
              </Typography>
            </Alert>

            <Typography variant="body1" className="arabic-text" sx={{ mb: 3 }}>
              لتأكيد حذف حسابك، يرجى إدخال كلمة المرور:
            </Typography>

            <TextField
              fullWidth
              label="كلمة المرور"
              type="password"
              value={deleteConfirmPassword}
              onChange={(e) => setDeleteConfirmPassword(e.target.value)}
              placeholder="أدخل كلمة المرور للتأكيد"
            />
          </DialogContent>

          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmPassword('');
              }}
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              إلغاء
            </Button>
            
            <Button
              onClick={handleDeleteAccount}
              disabled={!deleteConfirmPassword || loading}
              variant="contained"
              color="error"
              sx={{ borderRadius: 3 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'حذف الحساب نهائياً'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SettingsPage;
