import React, { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Box
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  SportsEsports as GamesIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const BottomNavigation = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'الرئيسية' },
    { path: '/search', icon: SearchIcon, label: 'البحث' },
    { path: '/chat', icon: ChatIcon, label: 'الدردشة' },
    { path: '/games', icon: GamesIcon, label: 'الألعاب' },
    { path: '/store', icon: StoreIcon, label: 'المتجر' }
  ];

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const index = navItems.findIndex(item => 
      currentPath === item.path || 
      (item.path === '/chat' && currentPath.startsWith('/chat'))
    );
    return index !== -1 ? index : 0;
  };

  const handleNavigation = (event, newValue) => {
    navigate(navItems[newValue].path);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1201,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(233, 30, 99, 0.1)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        pb: 'env(safe-area-inset-bottom)'
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleNavigation}
        sx={{
          background: 'transparent',
          height: { xs: '70px', sm: '80px' },
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(102, 126, 234, 0.6)',
            minWidth: 'auto',
            padding: { xs: '8px 12px', sm: '12px 16px' },
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            '&.Mui-selected': {
              color: '#e91e63',
              fontWeight: 'bold'
            },
            '& .MuiBottomNavigationAction-label': {
              fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              marginTop: { xs: '4px', sm: '6px' }
            },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.2rem', sm: '1.4rem' }
            }
          }
        }}
      >
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = getCurrentValue() === index;
          
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon />
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)'
                        }}
                      />
                    )}
                  </Box>
                </motion.div>
              }
              sx={{
                position: 'relative',
                overflow: 'visible',
                '&::before': isActive ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: '3px',
                  background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                  borderRadius: '0 0 3px 3px'
                } : {}
              }}
            />
          );
        })}
      </MuiBottomNavigation>
    </Paper>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;
