import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  Button,
  Grid,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  PhotoCamera,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';


// لا داعي لهذا السطر هنا، لأنه لا يمكن وضع جملة تنفيذية مباشرة في أعلى الملف خارج الدوال أو useEffect.
// السطر if (!profileUserId) return; يجب أن يكون داخل useEffect أو دالة.
// إذا كنت تريد التحقق من profileUserId في useEffect (كما هو موجود بالفعل في الكود)، فلا تضف هذا السطر هنا.
// يمكنك حذف هذا السطر من مكان $SELECTION_PLACEHOLDER$، ولا تضعه في أعلى الملف.
const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    profilePicture: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.uid;
  const profileUserId = userId || currentUser?.uid;

  // جلب بيانات المستخدم
  useEffect(() => {
    if (!profileUserId) return;

    const fetchUserProfile = async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', profileUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
          setEditData({
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            profilePicture: userData.profilePicture || ''
          });
          
          // تحقق من المتابعة
          if (!isOwnProfile && currentUserProfile) {
            setIsFollowing(currentUserProfile.following?.includes(profileUserId) || false);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        toast.error('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileUserId, currentUserProfile, isOwnProfile]);

  // جلب منشورات المستخدم
  useEffect(() => {
    if (!profileUserId) return;

    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('authorId', '==', profileUserId));

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
      
      setUserPosts(postsData);
    });

    return () => unsubscribe();
  }, [profileUserId]);

  // متابعة/إلغاء متابعة
  const handleFollow = async () => {
    if (!currentUser || !currentUserProfile || isOwnProfile) return;

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', profileUserId);

      if (isFollowing) {
        // إلغاء المتابعة
        await updateDoc(currentUserRef, {
          following: arrayRemove(profileUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        setIsFollowing(false);
        toast.success('تم إلغاء المتابعة');
      } else {
        // متابعة
        await updateDoc(currentUserRef, {
          following: arrayUnion(profileUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        setIsFollowing(true);
        toast.success('تم المتابعة بنجاح! 🎉');
      }
    } catch (error) {
      console.error('خطأ في المتابعة:', error);
      toast.error('حدث خطأ في العملية');
    }
  };

  // تحديث الملف الشخصي
  const handleUpdateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editData.displayName,
        bio: editData.bio,
        profilePicture: editData.profilePicture
      });

      setUserProfile(prev => ({
        ...prev,
        displayName: editData.displayName,
        bio: editData.bio,
        profilePicture: editData.profilePicture
      }));

      setOpenEditProfile(false);
      toast.success('تم تحديث الملف الشخصي بنجاح! ✅');
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      toast.error('حدث خطأ في التحديث');
    }
  };

  // إرسال رسالة
  const handleSendMessage = () => {
    navigate(`/chat?user=${profileUserId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#e91e63' }} />
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" className="arabic-title">
          المستخدم غير موجود 😞
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* رأس الملف الشخصي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card" sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                {/* الصورة الشخصية */}
                <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={userProfile.profilePicture}
                    sx={{ 
                      width: 150, 
                      height: 150,
                      mx: 'auto',
                      mb: 2,
                      border: '4px solid #e91e63',
                      background: 'linear-gradient(135deg, #e91e63, #9c27b0)'
                    }}
                  >
                    {userProfile.displayName?.charAt(0)}
                  </Avatar>
                  
                  {/* الإيموجيات */}
                  <Box sx={{ mb: 2 }}>
                    {userProfile.emojis?.slice(0, 5).map((emoji, index) => (
                      <Chip
                        key={index}
                        label={`${emoji.emoji} ${emoji.name}`}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          m: 0.5,
                          borderColor: '#e91e63',
                          color: '#e91e63'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* معلومات المستخدم */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" className="arabic-title" sx={{ fontWeight: 700 }}>
                      {userProfile.displayName}
                    </Typography>
                    {userProfile.emojis?.slice(0, 3).map((emoji, index) => (
                      <span key={index} className="emoji-display" style={{ fontSize: '1.5em', marginLeft: '8px' }}>
                        {emoji.emoji}
                      </span>
                    ))}
                  </Box>

                  <Typography variant="body1" className="arabic-text" sx={{ mb: 3, color: 'text.secondary' }}>
                    {userProfile.bio || 'مرحباً بكم في ملفي الشخصي! 👋'}
                  </Typography>

                  {/* الإحصائيات */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" className="arabic-title" sx={{ fontWeight: 700, color: '#e91e63' }}>
                          {userPosts.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          منشور
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" className="arabic-title" sx={{ fontWeight: 700, color: '#e91e63' }}>
                          {userProfile.followers?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          متابع
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" className="arabic-title" sx={{ fontWeight: 700, color: '#e91e63' }}>
                          {userProfile.following?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          متابَع
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* النقاط */}
                  <Box className="dragon-points" sx={{ mb: 3, display: 'inline-flex' }}>
                    {userProfile.dragons || 0}
                  </Box>

                  {/* أزرار الإجراءات */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {isOwnProfile ? (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenEditProfile(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                          borderRadius: 3
                        }}
                      >
                        تعديل الملف الشخصي
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant={isFollowing ? "outlined" : "contained"}
                          startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                          onClick={handleFollow}
                          sx={{
                            background: isFollowing ? 'transparent' : 'linear-gradient(135deg, #e91e63, #9c27b0)',
                            borderColor: isFollowing ? '#e91e63' : 'transparent',
                            color: isFollowing ? '#e91e63' : 'white',
                            borderRadius: 3
                          }}
                        >
                          {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          startIcon={<MessageIcon />}
                          onClick={handleSendMessage}
                          sx={{
                            borderColor: '#e91e63',
                            color: '#e91e63',
                            borderRadius: 3
                          }}
                        >
                          مراسلة
                        </Button>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* تبويبات المحتوى */}
        <Card className="glass-card">
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            centered
            sx={{
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              '& .MuiTab-root': {
                fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif',
                fontWeight: 600
              },
              '& .Mui-selected': {
                color: '#e91e63'
              }
            }}
          >
            <Tab label="المنشورات" />
            <Tab label="الإيموجيات" />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {/* منشورات المستخدم */}
            {tabValue === 0 && (
              <AnimatePresence>
                {userPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" className="arabic-title" sx={{ mb: 1 }}>
                        لا توجد منشورات بعد 📝
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isOwnProfile ? 'ابدأ بنشر أول منشور لك!' : 'لم ينشر هذا المستخدم أي منشورات بعد'}
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  <Grid container spacing={2}>
                    {userPosts.map((post, index) => (
                      <Grid item xs={12} sm={6} md={4} key={post.id}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Card 
                            sx={{ 
                              borderRadius: 3,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                              }
                            }}
                          >
                            {post.image && (
                              <CardMedia
                                component="img"
                                height={200}
                                image={post.image}
                                alt="منشور"
                                sx={{ objectFit: 'cover' }}
                              />
                            )}
                            <CardContent sx={{ p: 2 }}>
                              <Typography 
                                variant="body2" 
                                className="arabic-text"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: 1.5
                                }}
                              >
                                {post.description || 'صورة'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  ❤️ {post.likes?.length || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  💬 {post.comments?.length || 0}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </AnimatePresence>
            )}

            {/* الإيموجيات */}
            {tabValue === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {userProfile.emojis?.length === 0 || !userProfile.emojis ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" className="arabic-title" sx={{ mb: 1 }}>
                      لا توجد إيموجيات بعد 😊
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isOwnProfile ? 'قم بزيارة المتجر لشراء إيموجيات رائعة!' : 'لم يشتري هذا المستخدم أي إيموجيات بعد'}
                    </Typography>
                    {isOwnProfile && (
                      <Button
                        variant="contained"
                        onClick={() => navigate('/store')}
                        sx={{
                          mt: 2,
                          background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                          borderRadius: 3
                        }}
                      >
                        تصفح المتجر 🛍️
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {userProfile.emojis.map((emoji, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Card 
                            sx={{ 
                              textAlign: 'center',
                              p: 2,
                              borderRadius: 3,
                              border: '2px solid rgba(233, 30, 99, 0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: '#e91e63',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Typography variant="h3" sx={{ mb: 1 }}>
                              {emoji.emoji}
                            </Typography>
                            <Typography variant="body2" className="arabic-text" fontWeight="bold">
                              {emoji.name}
                            </Typography>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* نافذة تحرير الملف الشخصي */}
        <Dialog
          open={openEditProfile}
          onClose={() => setOpenEditProfile(false)}
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
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Typography variant="h5" className="arabic-title">
              تعديل الملف الشخصي ✏️
            </Typography>
            <IconButton
              onClick={() => setOpenEditProfile(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="الاسم"
              value={editData.displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="النبذة الشخصية"
              multiline
              rows={3}
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="رابط الصورة الشخصية"
              value={editData.profilePicture}
              onChange={(e) => setEditData({ ...editData, profilePicture: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setOpenEditProfile(false)}
                sx={{ borderRadius: 3 }}
              >
                إلغاء
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleUpdateProfile}
                sx={{
                  background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                  borderRadius: 3
                }}
              >
                حفظ التغييرات
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProfilePage;
