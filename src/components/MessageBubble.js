import React, { memo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton
} from '@mui/material';
import { Reply as ReplyIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MessageBubble = memo(({ 
  message, 
  isOwn, 
  onReply,
  index 
}) => {
  const handleReplyClick = useCallback((e) => {
    e.stopPropagation();
    onReply(message);
  }, [message, onReply]);

  const handleBubbleClick = useCallback(() => {
    onReply(message);
  }, [message, onReply]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05 // تأخير تدريجي لتجنب القفز
      }}
      layout
      layoutId={`message-${message.id}`}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: { xs: 1.5, sm: 2 },
          alignItems: 'flex-end',
          px: { xs: 1, sm: 2 }
        }}
      >
        {!isOwn && (
          <Avatar
            src={message.senderProfilePicture}
            sx={{ 
              width: { xs: 28, sm: 32 }, 
              height: { xs: 28, sm: 32 }, 
              mr: 1,
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
          >
            {message.senderName?.charAt(0)}
          </Avatar>
        )}

        <Paper
          elevation={2}
          sx={{
            p: { xs: 1.5, sm: 2 },
            maxWidth: { xs: '85%', sm: '70%' },
            borderRadius: { xs: 2.5, sm: 3 },
            background: isOwn 
              ? 'linear-gradient(135deg, #e91e63, #9c27b0)' 
              : 'rgba(255, 255, 255, 0.9)',
            color: isOwn ? 'white' : 'inherit',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            },
            '&:hover .reply-btn': {
              opacity: 1
            }
          }}
          onClick={handleBubbleClick}
        >
          {/* الرد على رسالة */}
          {message.replyTo && (
            <Box
              sx={{
                p: { xs: 0.75, sm: 1 },
                mb: { xs: 0.75, sm: 1 },
                borderRadius: 2,
                background: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                borderLeft: `3px solid ${isOwn ? 'white' : '#e91e63'}`
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.8,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }
                }}
              >
                رد على: {message.replyTo.senderName}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  mt: 0.25
                }}
              >
                {message.replyTo.type === 'gif' ? '🎬 صورة متحركة' : message.replyTo.content}
              </Typography>
            </Box>
          )}

          {/* محتوى الرسالة */}
          {message.type === 'text' ? (
            <Typography 
              variant="body1" 
              className="arabic-text"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                lineHeight: 1.5,
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Typography>
          ) : message.type === 'gif' && message.gif ? (
            <Box>
              <img
                src={message.gif.url}
                alt={message.gif.title}
                style={{
                  maxWidth: '200px',
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block'
                }}
                loading="lazy"
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  opacity: 0.8,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }
                }}
              >
                {message.gif.title}
              </Typography>
            </Box>
          ) : null}

          {/* وقت الرسالة */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: { xs: 0.75, sm: 1 },
              opacity: 0.7,
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              textAlign: isOwn ? 'left' : 'right'
            }}
          >
            {message.createdAt?.toDate ? 
              new Date(message.createdAt.toDate()).toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 
              new Date().toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          </Typography>

          {/* زر الرد */}
          <IconButton
            className="reply-btn"
            size="small"
            sx={{
              position: 'absolute',
              top: { xs: -8, sm: -10 },
              right: isOwn ? 'auto' : { xs: -8, sm: -10 },
              left: isOwn ? { xs: -8, sm: -10 } : 'auto',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              background: 'rgba(255,255,255,0.9)',
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              '&:hover': {
                background: 'rgba(255,255,255,1)',
                transform: 'scale(1.1)'
              }
            }}
            onClick={handleReplyClick}
          >
            <ReplyIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
          </IconButton>
        </Paper>

        {isOwn && (
          <Avatar
            src={message.senderProfilePicture}
            sx={{ 
              width: { xs: 28, sm: 32 }, 
              height: { xs: 28, sm: 32 }, 
              ml: 1,
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
          >
            {message.senderName?.charAt(0)}
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
