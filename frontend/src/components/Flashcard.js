import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function Flashcard({ question, options, showAnswer, answer, explanation, onClick }) {
    return (
        <Paper
            onClick={onClick}
            sx={{
                p: 4,
                minHeight: 300,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                background: showAnswer
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1))'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                border: showAnswer
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: showAnswer
                        ? '0 20px 60px rgba(16, 185, 129, 0.2)'
                        : '0 20px 60px rgba(99, 102, 241, 0.2)'
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: showAnswer
                        ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                        : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                }
            }}
        >
            <Box sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                px: 2, py: 0.5,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.1)',
                fontSize: '0.75rem',
                color: 'text.secondary'
            }}>
                {showAnswer ? 'Answer' : 'Question'}
            </Box>

            <Typography
                variant="h5"
                sx={{
                    fontWeight: 600,
                    mb: 3,
                    textAlign: 'center',
                    lineHeight: 1.5
                }}
            >
                {question}
            </Typography>

            {!showAnswer ? (
                <Box sx={{ mt: 2 }}>
                    {Object.entries(options || {}).map(([key, value]) => (
                        <Box
                            key={key}
                            sx={{
                                p: 2,
                                mb: 1.5,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    borderColor: 'rgba(99, 102, 241, 0.4)'
                                }
                            }}
                        >
                            <Typography>
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#6366f1',
                                        mr: 1.5
                                    }}
                                >
                                    {key.toUpperCase()}.
                                </Box>
                                {value}
                            </Typography>
                        </Box>
                    ))}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mt: 3 }}
                    >
                        Click to reveal answer
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center' }}>
                    <Box
                        sx={{
                            display: 'inline-block',
                            px: 4,
                            py: 2,
                            mb: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                            {answer?.toUpperCase()}
                        </Typography>
                    </Box>

                    {explanation && (
                        <Box sx={{
                            mt: 2,
                            p: 3,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.05)',
                            textAlign: 'left'
                        }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#22d3ee', mb: 1, fontWeight: 600 }}
                            >
                                Explanation
                            </Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                {explanation}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
}

export default Flashcard;
