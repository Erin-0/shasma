import React, { useState, useEffect } from 'react';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  School as MathIcon,
  Extension as PuzzleIcon,
  Public as KnowledgeIcon,
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { generateMathQuestion, generatePuzzle, generateGeneralKnowledge } from '../services/gemini';
import toast from 'react-hot-toast';

const GamesPage = () => {
  const { userProfile, updateDragons } = useAuth();
  
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState({
    math: { played: 0, won: 0 },
    puzzle: { played: 0, won: 0 },
    knowledge: { played: 0, won: 0 }
  });

  // تحميل إحصائيات الألعاب من التخزين المحلي
  useEffect(() => {
    const saved = localStorage.getItem('gameStats');
    if (saved) {
      setGameStats(JSON.parse(saved));
    }
  }, []);

  // حفظ إحصائيات الألعاب
  const saveGameStats = (newStats) => {
    setGameStats(newStats);
    localStorage.setItem('gameStats', JSON.stringify(newStats));
  };

  // أنواع الألعاب
  const gameTypes = [
    {
      id: 'math',
      title: 'الرياضيات',
      description: 'اختبر مهاراتك في الرياضيات',
      icon: MathIcon,
      color: '#2196f3',
      gradient: 'linear-gradient(135deg, #2196f3, #21cbf3)',
      generator: generateMathQuestion
    },
    {
      id: 'puzzle',
      title: 'الألغاز',
      description: 'تحدى عقلك مع الألغاز الذكية',
      icon: PuzzleIcon,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0, #e91e63)',
      generator: generatePuzzle
    },
    {
      id: 'knowledge',
      title: 'الثقافة العامة',
      description: 'اختبر معلوماتك العامة',
      icon: KnowledgeIcon,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50, #8bc34a)',
      generator: generateGeneralKnowledge
    }
  ];

  // بدء لعبة جديدة
  const startGame = async (gameType) => {
    setSelectedGame(gameType);
    setLoading(true);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);

    try {
      const question = await gameType.generator(userProfile?.age || 20);
      setCurrentQuestion(question);
    } catch (error) {
      console.error('خطأ في تحميل السؤال:', error);
      toast.error('حدث خطأ في تحميل السؤال. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // تحديث السؤال
  const refreshQuestion = async () => {
    if (!selectedGame) return;
    
    setLoading(true);
    setSelectedAnswer('');
    setShowResult(false);

    try {
      const question = await selectedGame.generator(userProfile?.age || 20);
      setCurrentQuestion(question);
    } catch (error) {
      console.error('خطأ في تحديث السؤال:', error);
      toast.error('حدث خطأ في تحديث السؤال');
    } finally {
      setLoading(false);
    }
  };

  // تقديم الإجابة
  const submitAnswer = () => {
    if (selectedAnswer === '' || !currentQuestion) return;

    const correct = parseInt(selectedAnswer) === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // تحديث الإحصائيات
    const newStats = { ...gameStats };
    newStats[selectedGame.id].played += 1;
    if (correct) {
      newStats[selectedGame.id].won += 1;
      updateDragons(5); // مكافأة 5 دراغون للإجابة الصحيحة
    }
    saveGameStats(newStats);

    // رسالة النتيجة
    if (correct) {
      toast.success('إجابة صحيحة! حصلت على 5 دراغون! 🎉');
    } else {
      toast.error('إجابة خاطئة. حاول مرة أخرى! 😞');
    }
  };

  // إغلاق اللعبة
  const closeGame = () => {
    setSelectedGame(null);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  // مكون بطاقة اللعبة
  const GameCard = ({ game }) => {
    const stats = gameStats[game.id];
    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          background: game.gradient,
          color: 'white',
          cursor: 'pointer',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 250,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 12px 40px ${game.color}40`,
            transform: 'translateY(-5px)'
          }
        }}
        onClick={() => startGame(game)}
      >
        <CardContent sx={{ p: 3, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* أيقونة اللعبة */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              mb: 2,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Icon sx={{ fontSize: 40 }} />
          </Box>

          {/* عنوان اللعبة */}
          <Typography variant="h5" className="arabic-title" sx={{ mb: 1, fontWeight: 700 }}>
            {game.title}
          </Typography>

          {/* وصف اللعبة */}
          <Typography variant="body1" className="arabic-text" sx={{ mb: 3, opacity: 0.9 }}>
            {game.description}
          </Typography>

          {/* الإحصائيات */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {stats.played}
              </Typography>
              <Typography variant="caption">
                لعبة
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {stats.won}
              </Typography>
              <Typography variant="caption">
                فوز
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {winRate}%
              </Typography>
              <Typography variant="caption">
                نسبة الفوز
              </Typography>
            </Box>
          </Box>

          {/* زر اللعب */}
          <Button
            variant="contained"
            size="large"
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            ابدأ اللعب 🎮
          </Button>
        </CardContent>

        {/* تأثير الخلفية */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }}
        />
      </Card>
    </motion.div>
  );
};

// MathContent component should be defined outside of GameCard
const MathContent = ({ content, isBlock = false }) => {
  if (!content) return null;

  // التحقق مما إذا كان النص يحتوي على تعبير رياضي
  const isMathExpression = /[\^_\\{}[\]]|\\[a-zA-Z]+|&|\\\(|\$\$|\$|\\\[|\\\]/.test(content);

  if (isMathExpression) {
    try {
      return isBlock ?
        <BlockMath math={content} /> :
        <InlineMath math={content} />;
    } catch (error) {
      console.error('KaTeX parsing error:', error);
      return <span style={{ color: 'red' }}>{content}</span>;
    }
  }

  return <span>{content}</span>;
};

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* رأس الصفحة */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card" sx={{ mb: 4, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h3" className="arabic-title gradient-text" sx={{ mb: 2 }}>
                🎮 الألعاب التفاعلية
              </Typography>
              <Typography variant="h6" className="arabic-text" color="text.secondary" sx={{ mb: 3 }}>
                تحدى نفسك واكسب نقاط الدراغون!
              </Typography>

              {/* نقاط المستخدم الحالية */}
              <Box className="dragon-points" sx={{ fontSize: '1.2rem', display: 'inline-flex' }}>
                رصيدك: {userProfile?.dragons || 0}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* الألعاب */}
        <Grid container spacing={4}>
          {gameTypes.map((game, index) => (
            <Grid item xs={12} md={4} key={game.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <GameCard game={game} />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* حوار اللعبة */}
          <Dialog
            open={!!selectedGame}
            onClose={closeGame}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                minHeight: 400
              }
            }}
          >
            {selectedGame && (
              <>
                <DialogTitle
            sx={{
              background: selectedGame.gradient,
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              py: 3
            }}
                >
            <span className="arabic-title" style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
              {selectedGame.title} 🎯
            </span>
            <Button
              onClick={closeGame}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'white',
                minWidth: 'auto'
              }}
            >
              <CloseIcon />
            </Button>
            <Button
              onClick={refreshQuestion}
              disabled={loading}
              sx={{
                position: 'absolute',
                left: 8,
                top: 8,
                color: 'white',
                minWidth: 'auto'
              }}
            >
              <RefreshIcon />
            </Button>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={60} sx={{ color: selectedGame.color, mb: 2 }} />
                <Typography variant="body1" className="arabic-text">
                  يتم تحضير سؤال جديد لك... 🤔
                </Typography>
              </Box>
  ) : currentQuestion ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestion.question}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {/* السؤال */}
        <Typography
          variant="h5"
          className="arabic-text"
          sx={{
            mb: 4,
            p: 3,
            background: `${selectedGame.color}10`,
            borderRadius: 3,
            borderLeft: `4px solid ${selectedGame.color}`,
            lineHeight: 1.8
          }}
        >
          <MathContent 
            content={currentQuestion.question} 
            isBlock={true} 
          />
        </Typography>

        {/* عرض الخيارات */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel
            component="legend"
            sx={{
              mb: 2,
              color: selectedGame.color,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            اختر الإجابة الصحيحة:
          </FormLabel>
          <RadioGroup
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index.toString()}
                control={
                  <Radio
                    sx={{
                      color: selectedGame.color,
                      '&.Mui-checked': {
                        color: selectedGame.color,
                      },
                    }}
                  />
                }
                label={
                  <Typography className="arabic-text" sx={{ fontSize: '1.1rem' }}>
                    {['أ', 'ب', 'ج', 'د'][index]}) <MathContent content={option} />
                  </Typography>
                }
                sx={{
                  mb: 1,
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${selectedGame.color}20`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `${selectedGame.color}10`,
                    borderColor: selectedGame.color,
                  }
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* النتيجة */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              severity={isCorrect ? "success" : "error"}
              sx={{
                mt: 3,
                borderRadius: 3,
                fontSize: '1.1rem',
                '& .MuiAlert-message': {
                  fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif'
                }
              }}
            >
              {isCorrect ? (
                <>
                  🎉 إجابة صحيحة! حصلت على 5 نقاط دراغون!
                  <br />
                  <strong>الإجابة الصحيحة:</strong> {['أ', 'ب', 'ج', 'د'][currentQuestion.correctAnswer]}) {currentQuestion.options[currentQuestion.correctAnswer]}
                </>
              ) : (
                <>
                  😞 إجابة خاطئة. لا تستسلم!
                  <br />
                  <strong>الإجابة الصحيحة:</strong> {['أ', 'ب', 'ج', 'د'][currentQuestion.correctAnswer]}) {currentQuestion.options[currentQuestion.correctAnswer]}
                </>
              )}
            </Alert>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  ) : (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography variant="h6" color="error">
        حدث خطأ في تحميل السؤال 😞 .اكلنا هوا!
      </Typography>
      <Button
        onClick={refreshQuestion}
        variant="contained"
        sx={{ mt: 2, background: selectedGame.gradient }}
      >
        حاول مرة أخرى
      </Button>
    </Box>
  )}
</DialogContent>

              <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Button
                  onClick={closeGame}
                  variant="outlined"
                  sx={{
                    borderColor: selectedGame.color,
                    color: selectedGame.color,
                    borderRadius: 3
                  }}
                >
                  إغلاق
                </Button>

                {currentQuestion && !showResult && (
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === '' || loading}
                    variant="contained"
                    sx={{
                      background: selectedGame.gradient,
                      borderRadius: 3,
                      px: 4
                    }}
                  >
                    تأكيد الإجابة ✅
                  </Button>
                )}

                {showResult && (
                  <Button
                    onClick={refreshQuestion}
                    variant="contained"
                    sx={{
                      background: selectedGame.gradient,
                      borderRadius: 3
                    }}
                  >
                    سؤال جديد 🔄
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default GamesPage;
