import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Add as AddIcon,
  PhotoCamera,
  Send as SendIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove, orderBy, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreatePost, setOpenCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ description: '', image: '' });
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // جلب المنشورات
  useEffect(() => {
    if (!currentUser) return;

    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // رفع صورة منشور جديد
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('حجم الصورة كبير جداً. يجب أن يكون أقل من 10 ميجابايت.');
        return;
      }
      
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPostImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // إنشاء منشور جديد
  const handleCreatePost = async () => {
    if (!newPost.description.trim() && !newPostImageUrl) {
      toast.error('يرجى إضافة نص أو صورة للمنشور');
      return;
    }

    setUploading(true);
    
    try {
      let imageUrl = '';
      if (newPostImage) {
        // رفع الصورة إلى Firebase Storage
        const imageRef = ref(storage, `posts/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(imageRef, newPostImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const postData = {
        authorId: currentUser.uid,
      authorName: userProfile.displayName,
      authorProfilePicture: userProfile.profilePicture,
      authorEmojis: userProfile.emojis || [],
      description: newPost.description.trim(),
      image: imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
      };

      await addDoc(collection(db, 'posts'), postData);
      
      // تحديث عدد المنشورات للمستخدم
      if (userProfile) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          postsCount: (userProfile.postsCount || 0) + 1
        });
      }

      setOpenCreatePost(false);
      setNewPost({ description: '', image: '' });
      setNewPostImage(null);
      setNewPostImageUrl('');
      toast.success('تم نشر المنشور بنجاح! 🎉');
    } catch (error) {
      console.error('خطأ في نشر المنشور:', error);
      toast.error('حدث خطأ في نشر المنشور');
    } finally {
      setUploading(false);
    }
  };

  // إضافة/إزالة إعجاب
  const handleLike = async (postId, isLiked) => {
    try {
      const postRef = doc(db, 'posts', postId);
      
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error('خطأ في الإعجاب:', error);
      toast.error('حدث خطأ في الإعجاب');
    }
  };

  // إضافة تعليق
  const handleComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const comment = {
        id: Date.now().toString(),
        authorId: currentUser.uid,
        authorName: userProfile.displayName,
        authorProfilePicture: userProfile.profilePicture,
        text: commentText.trim(),
        createdAt: new Date()
      };

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(comment)
      });
    } catch (error) {
      console.error('خطأ في التعليق:', error);
      toast.error('حدث خطأ في إضافة التعليق');
    }
  };

  // مكون المنشور
  const PostCard = ({ post }) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const isLiked = post.likes?.includes(currentUser.uid);

    const submitComment = (e) => {
      e.preventDefault();
      handleComment(post.id, newComment);
      setNewComment('');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="post-card" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          {/* رأس المنشور */}
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={post.authorProfilePicture}
                sx={{ width: 45, height: 45, mr: 2 }}
              >
                {post.authorName?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" className="arabic-title" sx={{ fontWeight: 600 }}>
                  {post.authorName}
                  {post.authorEmojis?.slice(0, 3).map((emoji, index) => (
                    <span key={index} className="emoji-display">{emoji.emoji}</span>
                  ))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(post.createdAt?.toDate()).toLocaleString('ar-SA')}
                </Typography>
              </Box>
            </Box>

            {/* نص المنشور */}
            {post.description && (
              <Typography 
                variant="body1" 
                className="arabic-text"
                sx={{ mb: 2, lineHeight: 1.8 }}
              >
                {post.description}
              </Typography>
            )}
          </CardContent>

          {/* صورة المنشور */}
          {post.image && (
            <CardMedia
              component="img"
              image={post.image}
              alt="منشور"
              sx={{ 
                maxHeight: 400,
                objectFit: 'cover',
                borderRadius: '1px',
              }}
            />
          )}

          {/* أزرار التفاعل */}
          <CardContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton 
                onClick={() => handleLike(post.id, isLiked)}
                sx={{ color: isLiked ? '#e91e63' : '#666' }}
              >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {post.likes?.length || 0}
              </Typography>

              <IconButton 
                onClick={() => setShowComments(!showComments)}
                sx={{ color: '#666', ml: 2 }}
              >
                <CommentIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {post.comments?.length || 0}
              </Typography>

              <IconButton sx={{ color: '#666', ml: 2 }}>
                <ShareIcon />
              </IconButton>
            </Box>

            {/* التعليقات */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mt: 2, borderTop: '1px solid rgba(0,0,0,0.1)', pt: 2 }}>
                    {/* إضافة تعليق */}
                    <Box component="form" onSubmit={submitComment} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="اكتب تعليقاً..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <IconButton 
                          type="submit" 
                          disabled={!newComment.trim()}
                          sx={{ color: '#e91e63' }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* عرض التعليقات */}
                    {post.comments?.map((comment) => (
                      <Box key={comment.id} sx={{ display: 'flex', mb: 2 }}>
                        <Avatar
                          src={comment.authorProfilePicture}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        >
                          {comment.authorName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" fontWeight="bold">
                            {comment.authorName}
                          </Typography>
                          <Typography variant="body2" className="arabic-text">
                            {comment.text}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#e91e63' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* رسالة ترحيب */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card" sx={{ mb: 4, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" className="arabic-title gradient-text" sx={{ mb: 2 }}>
                مرحباً {userProfile?.displayName}! 👋
              </Typography>
              <Typography variant="body1" className="arabic-text" color="text.secondary">
                شاركنا ما يدور في بالك اليوم واستمتع بمنشورات الأصدقاء
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* المنشورات */}
        <AnimatePresence>
          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card" sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <Typography variant="h5" className="arabic-title" sx={{ mb: 2 }}>
                    لا توجد منشورات بعد 📝
                  </Typography>
                  <Typography variant="body1" className="arabic-text" color="text.secondary">
                    كن أول من ينشر في شسمه!
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </AnimatePresence>

        {/* زر إنشاء منشور */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d81b60, #8e24aa)',
              transform: 'scale(1.1)',
            }
          }}
          onClick={() => setOpenCreatePost(true)}
        >
          <AddIcon />
        </Fab>

        {/* نافذة إنشاء منشور */}
        <Dialog
          open={openCreatePost}
          onClose={() => setOpenCreatePost(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Typography variant="h5" className="arabic-title">
              منشور جديد ✨
            </Typography>
            <IconButton
              onClick={() => setOpenCreatePost(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            {/* صورة المنشور */}
            {newPostImageUrl && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <img
                  src={newPostImageUrl}
                  alt="منشور جديد"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 15,
                    objectFit: 'cover'
                  }}
                />
              </Box>
            )}

            {/* نص المنشور */}
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="ما الذي يدور في بالك؟ 💭"
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
              sx={{ mb: 3 }}
            />

            {/* أزرار الإجراءات */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 3 }}
              >
                إضافة صورة
              </Button>

              <Button
                variant="contained"
                onClick={handleCreatePost}
                disabled={uploading || (!newPost.description.trim() && !newPostImageUrl)}
                sx={{
                  background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                  borderRadius: 3,
                  minWidth: 120
                }}
              >
                {uploading ? <CircularProgress size={20} color="inherit" /> : 'نشر 🚀'}
              </Button>
            </Box>

            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
            />
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default HomePage;
