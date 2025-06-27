import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  CardContent,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Gif as GifIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import MessageBubble from '../components/MessageBubble';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showGifDialog, setShowGifDialog] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // GIFs (محاكاة)
  const popularGifs = useMemo(() => [
    { id: '1', url: 'https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif', title: 'تصفيق' },
    { id: '2', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', title: 'سعيد' },
    { id: '3', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'حب' },
    { id: '4', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'ضحك' },
    { id: '5', url: 'https://media.giphy.com/media/3o6Zt0hNCfak3QCqsw/giphy.gif', title: 'رقص' },
    { id: '6', url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif', title: 'تفكير' }
  ], []);

  // تحسين التمرير للأسفل
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // جلب المحادثات
  useEffect(() => {
    if (!currentUser) return;
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(chatsRef, where('participants', 'array-contains', currentUser.uid), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب المحادثات:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // التحقق من وجود معرف مستخدم في URL
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && currentUser) {
      startChatWithUser(userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUser]);
  
  // بدء محادثة
  const startChatWithUser = useCallback(async (userId) => {
    try {
      const existingChat = chats.find(chat => chat.participants.includes(userId) && chat.participants.includes(currentUser.uid));
      if (existingChat) {
        selectChat(existingChat);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        toast.error('المستخدم غير موجود');
        return;
      }
      const userData = userDoc.data();
      const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUser.uid, userId], createdAt: new Date(), updatedAt: new Date(), lastMessage: '', lastMessageTime: new Date()
      });
      const newChat = { id: newChatRef.id, participants: [currentUser.uid, userId], createdAt: new Date(), updatedAt: new Date(), lastMessage: '', lastMessageTime: new Date() };
      setOtherUser(userData);
      selectChat(newChat);
    } catch (error) {
      console.error('خطأ في بدء المحادثة:', error);
      toast.error('حدث خطأ في بدء المحادثة');
    }
  }, [chats, currentUser]);

  // اختيار محادثة
  const selectChat = useCallback(async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    } catch (error) {
      console.error('خطأ في جلب معلومات المستخدم:', error);
    }
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(messagesRef, where('chatId', '==', chat.id), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      setTimeout(scrollToBottom, 100);
    });
    return () => unsubscribe();
  }, [currentUser, scrollToBottom]);
  
  // الرد على رسالة
  const handleReply = useCallback((message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  }, []);
  
  // إرسال رسالة
  const sendMessage = useCallback(async (content = newMessage, type = 'text', gif = null) => {
    if ((!content.trim() && type === 'text') || !selectedChat || sendingMessage) return;
    setSendingMessage(true);
    try {
      const messageData = { chatId: selectedChat.id, senderId: currentUser.uid, senderName: userProfile?.displayName || 'مستخدم', senderProfilePicture: userProfile?.profilePicture || '', content: content.trim(), type, createdAt: new Date(), replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, senderName: replyingTo.senderName, type: replyingTo.type } : null, gif };
      await addDoc(collection(db, 'messages'), messageData);
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: type === 'gif' ? '🎬 صورة متحركة' : content.trim(), lastMessageTime: new Date(), updatedAt: new Date()
      });
      setNewMessage('');
      setReplyingTo(null);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      toast.error('حدث خطأ في إرسال الرسالة');
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedChat, sendingMessage, currentUser, userProfile, replyingTo]);
  
  // إرسال GIF
  const sendGif = useCallback((gif) => { sendMessage('', 'gif', gif); setShowGifDialog(false); }, [sendMessage]);
  
  // معالج تغيير النص
  const handleMessageChange = useCallback((e) => { setNewMessage(e.target.value); }, []);
  
  // معالج الضغط على Enter
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  
  // عرض الرسائل
  const renderedMessages = useMemo(() => messages.map((message, index) => (
    <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUser.uid} onReply={handleReply} index={index} />
  )), [messages, currentUser.uid, handleReply]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    // حاوية رئيسية تسمح بانزلاق اللوحات
    <Container maxWidth={false} sx={{ height: '100vh', p: 0, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      
      {/* لوحة قائمة المحادثات */}
      <Box
        sx={{
          width: { xs: '100%', sm: '350px' },
          height: '100%',
          flexShrink: 0,
          transition: 'transform 0.3s ease-in-out',
          transform: {
            xs: selectedChat ? 'translateX(-100%)' : 'translateX(0)',
            sm: 'none'
          },
          borderRight: { sm: '1px solid rgba(0, 0, 0, 0.12)' },
          background: '#f7f7f7'
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.2rem', sm: '1.25rem' }, fontWeight: 700 }}>
            المحادثات
          </Typography>

          <List sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
            {chats.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body2" color="text.secondary">لا توجد محادثات حتى الآن</Typography>
              </Box>
            ) : (
              chats.map((chat) => {
                const otherUserId = chat.participants.find(id => id !== currentUser.uid);
                return (
                  <ListItem
                    key={chat.id}
                    button
                    onClick={() => selectChat(chat)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      background: selectedChat?.id === chat.id ? 'rgba(0, 150, 255, 0.1)' : 'transparent',
                      '&:hover': { background: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {/* يمكنك وضع صورة المستخدم الآخر هنا لاحقاً */}
                        {otherUserId?.charAt(0).toUpperCase() || '👤'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>محادثة مع ...</Typography>}
                      secondary={<Typography variant="caption" noWrap>{chat.lastMessage}</Typography>}
                    />
                  </ListItem>
                );
              })
            )}
          </List>
        </CardContent>
      </Box>

      {/* لوحة نافذة الدردشة */}
      <Box
        sx={{
          position: { xs: 'absolute', sm: 'relative' },
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease-in-out',
          transform: {
            xs: selectedChat ? 'translateX(0)' : 'translateX(100%)',
            sm: 'none'
          },
          background: '#fff'
        }}
      >
        {selectedChat ? (
          <>
            {/* رأس الدردشة */}
            <Paper
              elevation={1}
              sx={{
                p: { xs: '12px 16px', sm: 2 },
                background: '#f7f7f7',
                borderRadius: 0,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              {/* زر الرجوع للهاتف */}
              <IconButton sx={{ display: { sm: 'none' } }} onClick={() => setSelectedChat(null)}>
                <ArrowBackIcon />
              </IconButton>
              
              <Avatar src={otherUser?.profilePicture} sx={{ width: 40, height: 40 }}>
                {otherUser?.displayName?.charAt(0) || '👤'}
              </Avatar>
              
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: '600' }}>
                {otherUser?.displayName || 'مستخدم'}
              </Typography>
            </Paper>

            {/* منطقة الرسائل */}
            <Box ref={chatContainerRef} sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
              {renderedMessages}
              <div ref={messagesEndRef} />
            </Box>

            {/* منطقة الرد */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Paper sx={{ mx: 2, p: 1.5, background: 'rgba(0,0,0,0.03)', borderLeft: '4px solid #1976d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>رد على: {replyingTo.senderName}</Typography>
                      <Typography variant="body2" noWrap>{replyingTo.type === 'gif' ? '🎬 صورة متحركة' : replyingTo.content}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReplyingTo(null)}><CloseIcon /></IconButton>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* منطقة الكتابة */}
            <Paper elevation={0} sx={{ p: { xs: 1, sm: 1.5 }, m: { xs: 1.5, sm: 2 }, background: '#f0f2f5', borderRadius: '2px' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  ref={messageInputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={handleMessageChange}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا..."
                  variant="standard" // تغيير الشكل ليكون أبسط
                  disabled={sendingMessage}
                  sx={{
                    '& .MuiInput-underline:before': { borderBottom: 'none' },
                    '& .MuiInput-underline:after': { borderBottom: 'none' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                  }}
                  InputProps={{
                    disableUnderline: true, // إزالة الخط السفلي
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowGifDialog(true)} size="small">
                          <GifIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <IconButton onClick={() => sendMessage()} disabled={sendingMessage || !newMessage.trim()} sx={{ background: '#1976d2', color: 'white', '&:hover': { background: '#1565c0' }, '&:disabled': { background: 'rgba(0,0,0,0.12)' } }}>
                  {sendingMessage ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>
            </Paper>
          </>
        ) : (
          <Box sx={{ flex: 1, display: {xs: 'none', sm: 'flex'}, alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'center' }}>
                اختر محادثة لبدء الدردشة 💬
              </Typography>
            </motion.div>
          </Box>
        )}
      </Box>

      {/* نافذة اختيار GIF */}
      <Dialog open={showGifDialog} onClose={() => setShowGifDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>اختر صورة متحركة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {popularGifs.map((gif) => (
              <Grid item xs={6} sm={4} key={gif.id}>
                <Box onClick={() => sendGif(gif)} sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', '&:hover': { transform: 'scale(1.05)', transition: 'transform 0.2s' } }}>
                  <img src={gif.url} alt={gif.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}/>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>{gif.title}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

    </Container>
  );
};

export default ChatPage;