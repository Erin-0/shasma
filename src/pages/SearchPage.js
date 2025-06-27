import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Message as MessageIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchTimeoutRef = useRef();

  useEffect(() => {
    fetchSuggestions();
    loadRecentSearches();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser?.uid)
        .slice(0, 10);
      
      setSuggestions(users);
    } catch (error) {
      console.error('خطأ في جلب الاقتراحات:', error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (user) => {
    const newRecentSearches = [
      user,
      ...recentSearches.filter(u => u.id !== user.id)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const searchUsers = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', searchText),
        where('displayName', '<=', searchText + '\uf8ff')
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser?.uid);

      setSearchResults(users);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      toast.error('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 500);
  };

  const handleFollow = async (userId, isFollowing) => {
    if (!currentUser || !userProfile) return;

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', userId);

      if (isFollowing) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        toast.success('تم إلغاء المتابعة');
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        toast.success('تم المتابعة بنجاح! 🎉');
      }
      // تحديث userProfile بعد العملية
    fetchUserProfile(currentUser.uid);

      const updateFollowingStatus = (users) => 
        users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              isFollowing: !isFollowing
            };
          }
          return user;
        });

      setSearchResults(prev => updateFollowingStatus(prev));
      setSuggestions(prev => updateFollowingStatus(prev));
    } catch (error) {
      console.error('خطأ في المتابعة:', error);
      toast.error('حدث خطأ في العملية');
    }
  };

  const handleSendMessage = (userId) => {
    navigate(`/chat?user=${userId}`);
  };

  const handleViewProfile = (user) => {
    saveRecentSearch(user);
    navigate(`/profile/${user.id}`);
  };

  const UserCard = ({ user, showFollowButton = true }) => {
    const isFollowing = userProfile?.following?.includes(user.id) || false;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card 
          sx={{ 
            cursor: 'pointer',
            borderRadius: 3,
            border: '1px solid rgba(233, 30, 99, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#e91e63',
              boxShadow: '0 8px 25px rgba(233, 30, 99, 0.15)'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* الصورة الشخصية */}
              <Avatar
                src={user.profilePicture}
                onClick={() => handleViewProfile(user)}
                sx={{ 
                  width: 60, 
                  height: 60,
                  border: '2px solid #e91e63',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {user.displayName?.charAt(0)}
              </Avatar>

              
              <Box sx={{ flex: 1 }} onClick={() => handleViewProfile(user)}>
                <Typography variant="h6" className="arabic-title" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user.displayName}
                  {user.emojis?.slice(0, 2).map((emoji, index) => (
                    <span key={index}>{typeof emoji === 'string' ? emoji : emoji.emoji}</span>
                  ))}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {user.bio || 'مرحباً بكم في ملفي الشخصي! 👋'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    📝 {user.postsCount || 0} منشور
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    👥 {user.followers?.length || 0} متابع
                  </Typography>
                  <Box className="dragon-points" sx={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {user.dragons || 0}
                  </Box>
                </Box>
              </Box>

             
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {showFollowButton && (
                  <Button
                    variant={isFollowing ? "outlined" : "contained"}
                    size="small"
                    startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(user.id, isFollowing);
                    }}
                    sx={{
                      background: isFollowing ? 'transparent' : 'linear-gradient(135deg, #e91e63, #9c27b0)',
                      borderColor: isFollowing ? '#e91e63' : 'transparent',
                      color: isFollowing ? '#e91e63' : 'white',
                      borderRadius: 2,
                      minWidth: 90,
                      fontSize: '0.75rem'
                    }}
                  >
                    {isFollowing ? 'إلغاء' : 'متابعة'}
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MessageIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendMessage(user.id);
                  }}
                  sx={{
                    borderColor: '#e91e63',
                    color: '#e91e63',
                    borderRadius: 2,
                    minWidth: 90,
                    fontSize: '0.75rem'
                  }}
                >
                  مراسلة
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card" sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" className="arabic-title gradient-text" sx={{ textAlign: 'center', mb: 3 }}>
                البحث عن الأصدقاء 🔍
              </Typography>
              
              <TextField
                fullWidth
                placeholder="ابحث عن صديق بالاسم..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#e91e63' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        sx={{ minWidth: 'auto', color: '#666' }}
                      >
                        <ClearIcon />
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    fontSize: '1.1rem'
                  }
                }}
              />
            </CardContent>
          </Card>
        </motion.div>

        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" className="arabic-title" sx={{ mb: 3 }}>
                  نتائج البحث 📋
                  {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Typography>
                
                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ color: '#e91e63' }} />
                  </Box>
                ) : searchResults.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      لم يتم العثور على نتائج 😞
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {searchResults.map((user) => (
                      <Grid item xs={12} key={user.id}>
                        <UserCard user={user} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!searchQuery && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card" sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" className="arabic-title">
                    عمليات البحث الأخيرة ⏰
                  </Typography>
                  <Button
                    onClick={clearRecentSearches}
                    size="small"
                    sx={{ color: '#e91e63' }}
                  >
                    مسح الكل
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {recentSearches.map((user) => (
                    <Grid item xs={12} key={user.id}>
                      <UserCard user={user} showFollowButton={false} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardContent>
                <Typography variant="h6" className="arabic-title" sx={{ mb: 3 }}>
                  اقتراحات لك ✨
                </Typography>
                
                {suggestions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      لا توجد اقتراحات حالياً 🤔
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {suggestions.map((user) => (
                      <Grid item xs={12} key={user.id}>
                        <UserCard user={user} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default SearchPage;