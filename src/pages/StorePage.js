import React, { useState, memo, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
  EmojiEvents as TrophyIcon,
  Favorite as HeartIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// مكون بطاقة الإيموجي المحسن
const EmojiCard = memo(({ emoji, isOwned, canAfford, onSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = useCallback(() => {
    if (!isOwned) {
      onSelect(emoji);
    }
  }, [emoji, isOwned, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: isOwned ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card
        sx={{
          cursor: isOwned ? 'default' : 'pointer',
          borderRadius: { xs: 2, sm: 3 },
          border: isOwned ? '2px solid #4caf50' : canAfford ? '2px solid rgba(233, 30, 99, 0.3)' : '2px solid rgba(0,0,0,0.1)',
          background: isOwned ? 'linear-gradient(135deg, #4caf5020, #8bc34a20)' : 'white',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'visible',
          '&:hover': {
            borderColor: isOwned ? '#4caf50' : '#e91e63',
            boxShadow: isOwned ? '0 8px 25px rgba(76, 175, 80, 0.3)' : '0 8px 25px rgba(233, 30, 99, 0.2)'
          }
        }}
        onClick={handleClick}
      >
        {/* شارة "مملوك" */}
        {isOwned && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#4caf50',
              color: 'white',
              borderRadius: '50%',
              width: { xs: 24, sm: 30 },
              height: { xs: 24, sm: 30 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              fontWeight: 'bold',
              zIndex: 1
            }}
          >
            ✓
          </Box>
        )}

        <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
          {/* الإيموجي */}
          <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', sm: '4rem' }, mb: { xs: 1, sm: 2 } }}>
            {emoji.emoji}
          </Typography>

          {/* اسم الإيموجي */}
          <Typography 
            variant="h6" 
            className="arabic-title" 
            sx={{ 
              fontWeight: 600, 
              mb: 1,
              fontSize: { xs: '0.9rem', sm: '1.1rem' }
            }}
          >
            {emoji.name}
          </Typography>

          {/* وصف الإيموجي */}
          <Typography 
            variant="body2" 
            className="arabic-text" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.75rem', sm: '0.85rem' }
            }}
          >
            {emoji.description}
          </Typography>

          {/* السعر */}
          <Box 
            sx={{
              background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
              color: 'white',
              padding: { xs: '4px 8px', sm: '6px 12px' },
              borderRadius: '20px',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              fontWeight: 'bold',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              minWidth: { xs: '40px', sm: '60px' },
              textAlign: 'center',
              display: 'inline-block',
              mb: 2
            }}
          >
            🐉 {emoji.price}
          </Box>

          {/* زر الشراء */}
          {isOwned ? (
            <Chip
              label="مملوك"
              color="success"
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            />
          ) : (
            <Button
              variant={canAfford ? "contained" : "outlined"}
              disabled={!canAfford}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(emoji);
              }}
              sx={{
                background: canAfford ? 'linear-gradient(135deg, #e91e63, #9c27b0)' : 'transparent',
                borderColor: !canAfford ? '#ccc' : 'transparent',
                color: canAfford ? 'white' : '#999',
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                '&:hover': {
                  background: canAfford ? 'linear-gradient(135deg, #d81b60, #8e24aa)' : 'transparent'
                }
              }}
            >
              {canAfford ? 'شراء' : 'غير متاح'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EmojiCard.displayName = 'EmojiCard';

const StorePage = () => {
  const { userProfile, buyEmoji } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [purchaseDialog, setPurchaseDialog] = useState(false);

  // فئات الإيموجيات
  const categories = [
    { id: 'popular', name: 'الأكثر شعبية', icon: '⭐' },
    { id: 'animals', name: 'الحيوانات', icon: '🐾' },
    { id: 'food', name: 'الطعام', icon: '🍕' },
    { id: 'sports', name: 'الرياضة', icon: '⚽' },
    { id: 'nature', name: 'الطبيعة', icon: '🌿' },
    { id: 'premium', name: 'مميزة', icon: '💎' }
  ];

  // الإيموجيات المتاحة
  const availableEmojis = {
    popular: [
      { emoji: '😎', name: 'كول', price: 10, description: 'للشخصيات الرائعة' },
      { emoji: '🔥', name: 'نار', price: 15, description: 'للمحتوى الساخن' },
      { emoji: '💪', name: 'قوة', price: 12, description: 'للأقوياء والمصممين' },
      { emoji: '🌟', name: 'نجمة', price: 18, description: 'للمتميزين' },
      { emoji: '🎯', name: 'هدف', price: 14, description: 'للمركزين على أهدافهم' },
      { emoji: '⚡', name: 'برق', price: 16, description: 'للسريعين والنشيطين' }
    ],
    animals: [
      { emoji: '🦁', name: 'أسد', price: 25, description: 'ملك الغابة' },
      { emoji: '🐺', name: 'ذئب', price: 22, description: 'للشجعان والأقوياء' },
      { emoji: '🦅', name: 'نسر', price: 28, description: 'للطامحين والحالمين' },
      { emoji: '🐯', name: 'نمر', price: 30, description: 'للمقاتلين الشرسين' },
      { emoji: '🦄', name: 'يونيكورن', price: 35, description: 'للفريدين والخياليين' },
      { emoji: '🐉', name: 'تنين', price: 40, description: 'للأسطوريين والقادة' }
    ],
    food: [
      { emoji: '🍕', name: 'بيتزا', price: 8, description: 'لعشاق الطعام الإيطالي' },
      { emoji: '🍔', name: 'برجر', price: 7, description: 'للجوعانين دائماً' },
      { emoji: '🍰', name: 'كيك', price: 12, description: 'لمن يحب الحلويات' },
      { emoji: '🍜', name: 'شوربة', price: 6, description: 'للطعام المريح' },
      { emoji: '🍓', name: 'فراولة', price: 10, description: 'للصحيين واللذيذ' },
      { emoji: '🍯', name: 'عسل', price: 15, description: 'للحلو والطبيعي' }
    ],
    sports: [
      { emoji: '⚽', name: 'كرة قدم', price: 15, description: 'لعشاق الكرة الملكية' },
      { emoji: '🏀', name: 'كرة سلة', price: 14, description: 'للاعبين الطوال' },
      { emoji: '🎾', name: 'تنس', price: 16, description: 'للرياضيين الأنيقين' },
      { emoji: '🏊', name: 'سباحة', price: 18, description: 'لعشاق الماء' },
      { emoji: '🚴', name: 'دراجة', price: 12, description: 'للمغامرين والنشيطين' },
      { emoji: '🏃', name: 'جري', price: 10, description: 'للعدائين والسريعين' }
    ],
    nature: [
      { emoji: '🌳', name: 'شجرة', price: 12, description: 'لمحبي الطبيعة' },
      { emoji: '🌺', name: 'زهرة', price: 8, description: 'للجميلين والرقيقين' },
      { emoji: '🌙', name: 'قمر', price: 20, description: 'للحالمين والليليين' },
      { emoji: '⭐', name: 'نجمة', price: 15, description: 'للمتألقين' },
      { emoji: '🌈', name: 'قوس قزح', price: 25, description: 'للمتفائلين والملونين' },
      { emoji: '🌊', name: 'موجة', price: 18, description: 'لمحبي البحر' }
    ],
    premium: [
      { emoji: '👑', name: 'تاج', price: 50, description: 'للملوك والملكات' },
      { emoji: '💎', name: 'ماسة', price: 45, description: 'للثمينين والنادرين' },
      { emoji: '🏆', name: 'كأس', price: 40, description: 'للفائزين والبطل' },
      { emoji: '🎖️', name: 'ميدالية', price: 35, description: 'للمتميزين والشرفاء' },
      { emoji: '⚔️', name: 'سيف', price: 42, description: 'للمحاربين والشجعان' },
      { emoji: '🛡️', name: 'درع', price: 38, description: 'للحماة والمدافعين' }
    ]
  };

  // شراء إيموجي
  const handlePurchase = useCallback(async () => {
    if (!selectedEmoji) return;

    const success = await buyEmoji(selectedEmoji);
    if (success) {
      setPurchaseDialog(false);
      setSelectedEmoji(null);
      toast.success(`تم شراء ${selectedEmoji.name} بنجاح! 🎉`);
    }
  }, [selectedEmoji, buyEmoji]);

  // تحقق من ملكية الإيموجي
  const isOwned = useCallback((emoji) => {
    if (!userProfile?.emojis) return false;
    return userProfile.emojis.some(owned => {
      // التحقق من التنسيقات المختلفة للإيموجيات المملوكة
      if (typeof owned === 'string') {
        return owned === emoji.emoji;
      }
      if (typeof owned === 'object' && owned.emoji) {
        return owned.emoji === emoji.emoji;
      }
      return false;
    });
  }, [userProfile?.emojis]);

  // معالج اختيار الإيموجي
  const handleSelectEmoji = useCallback((emoji) => {
    setSelectedEmoji(emoji);
    setPurchaseDialog(true);
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      pb: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        {/* رأس الصفحة */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card 
            className="glass-card" 
            sx={{ 
              mb: { xs: 2, sm: 4 }, 
              textAlign: 'center',
              borderRadius: { xs: 2, sm: 3 }
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography 
                variant="h3" 
                className="arabic-title gradient-text" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.8rem', sm: '2.5rem' }
                }}
              >
                🛍️ متجر الإيموجيات
              </Typography>
              <Typography 
                variant="h6" 
                className="arabic-text" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                اشتري إيموجيات فريدة لتزيين ملفك الشخصي!
              </Typography>

              {/* رصيد المستخدم */}
              <Box 
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                  color: 'white',
                  padding: { xs: '8px 16px', sm: '12px 24px' },
                  borderRadius: '25px',
                  fontSize: { xs: '1.1rem', sm: '1.5rem' },
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2
                }}
              >
                🐉 رصيدك: {userProfile?.dragons || 0}
              </Box>

              <Typography 
                variant="body2" 
                className="arabic-text" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
              >
                اكسب المزيد من النقاط عبر لعب الألعاب! 🎮
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* تبويبات الفئات */}
        <Card 
          className="glass-card" 
          sx={{ 
            mb: { xs: 2, sm: 4 },
            borderRadius: { xs: 2, sm: 3 }
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              '& .MuiTab-root': {
                fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif',
                fontWeight: 600,
                minWidth: { xs: 80, sm: 120 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              },
              '& .Mui-selected': {
                color: '#e91e63'
              }
            }}
          >
            {categories.map((category, index) => (
              <Tab
                key={category.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <span>{category.icon}</span>
                    <span style={{ fontSize: isMobile ? '0.7rem' : '0.9rem' }}>
                      {category.name}
                    </span>
                  </Box>
                }
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {/* عرض الإيموجيات */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {availableEmojis[categories[selectedCategory].id]?.map((emoji, index) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={`${emoji.emoji}-${index}`}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <EmojiCard
                          emoji={emoji}
                          isOwned={isOwned(emoji)}
                          canAfford={(userProfile?.dragons || 0) >= emoji.price}
                          onSelect={handleSelectEmoji}
                        />
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* نصائح الشراء */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Alert
            severity="info"
            sx={{
              borderRadius: { xs: 2, sm: 3 },
              '& .MuiAlert-message': {
                fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif',
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }
            }}
          >
            💡 نصيحة: العب في قسم الألعاب لكسب المزيد من نقاط الدراغون وشراء المزيد من الإيموجيات الرائعة!
          </Alert>
        </motion.div>
      </Container>

      {/* نافذة تأكيد الشراء */}
      <Dialog
        open={purchaseDialog}
        onClose={() => setPurchaseDialog(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography 
            className="arabic-title gradient-text"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            تأكيد الشراء
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {selectedEmoji && (
            <>
              <Typography variant="h1" sx={{ fontSize: { xs: '3rem', sm: '4rem' }, mb: 2 }}>
                {selectedEmoji.emoji}
              </Typography>
              
              <Typography 
                variant="h6" 
                className="arabic-title" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {selectedEmoji.name}
              </Typography>
              
              <Typography 
                variant="body2" 
                className="arabic-text" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.8rem', sm: '0.85rem' }
                }}
              >
                {selectedEmoji.description}
              </Typography>

              <Box 
                sx={{
                  background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                  color: 'white',
                  padding: { xs: '8px 16px', sm: '12px 24px' },
                  borderRadius: '25px',
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  fontWeight: 'bold',
                  display: 'inline-block',
                  mb: 2
                }}
              >
                🐉 {selectedEmoji.price}
              </Box>

              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  display: 'block',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                رصيدك الحالي: {userProfile?.dragons || 0}
              </Typography>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button 
            onClick={() => setPurchaseDialog(false)}
            sx={{ 
              mr: 1,
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={!selectedEmoji || (userProfile?.dragons || 0) < (selectedEmoji?.price || 0)}
            sx={{
              background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #d81b60, #8e24aa)'
              }
            }}
          >
            تأكيد الشراء
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StorePage;
