import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const TopAppBar = memo(() => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(233, 30, 99, 0.1)',
        boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)',
        height: '64px',
        zIndex: 1201
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        {/* الشعار */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h5"
            component="div"
            className="arabic-title gradient-text"
            sx={{ 
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease'
              }
            }}
            onClick={() => navigate('/')}
          >
            شسمه ✨
          </Typography>
        </motion.div>

        {/* منطقة المستخدم */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* نقاط الدراغون */}
          {userProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box 
                className="dragon-points"
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  minWidth: { xs: '50px', sm: '60px' },
                  textAlign: 'center'
                }}
              >
                🐉 {userProfile.dragons || 0}
              </Box>
            </motion.div>
          )}

          {/* الملف الشخصي */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0,
                border: '2px solid rgba(233, 30, 99, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  border: '2px solid #e91e63',
                }
              }}
            >
              <Avatar
                src={userProfile?.profilePicture}
                alt={userProfile?.displayName}
                sx={{ 
                  width: { xs: 36, sm: 40 }, 
                  height: { xs: 36, sm: 40 },
                  background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {userProfile?.displayName?.charAt(0) || '👤'}
              </Avatar>
            </IconButton>
          </motion.div>

          {/* قائمة الملف الشخصي */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: '15px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(233, 30, 99, 0.1)',
                minWidth: 200,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <MenuItem 
              onClick={() => { 
                navigate(`/profile/${currentUser.uid}`); 
                handleProfileMenuClose(); 
              }}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.08)'
                }
              }}
            >
              <PersonIcon sx={{ mr: 2, color: '#e91e63' }} />
              <Typography className="arabic-text">الملف الشخصي</Typography>
            </MenuItem>
            
            <MenuItem 
              onClick={() => { 
                navigate('/settings'); 
                handleProfileMenuClose(); 
              }}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.08)'
                }
              }}
            >
              <SettingsIcon sx={{ mr: 2, color: '#e91e63' }} />
              <Typography className="arabic-text">الإعدادات</Typography>
            </MenuItem>
            
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.08)'
                }
              }}
            >
              <LogoutIcon sx={{ mr: 2, color: '#f44336' }} />
              <Typography className="arabic-text">تسجيل الخروج</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

TopAppBar.displayName = 'TopAppBar';

export default TopAppBar;
