import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, CircularProgress, Alert, Chip, LinearProgress,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
    Replay as ReplayIcon,
    ThumbDown as HardIcon,
    ThumbUp as GoodIcon,
    Favorite as EasyIcon,
    ArrowBack as BackIcon,
    Celebration as CelebrationIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../App';
import Flashcard from './Flashcard';

const DIFFICULTY_COLORS = {
    easy: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#10b981', emoji: '🟢' },
    medium: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#f59e0b', emoji: '🟡' },
    hard: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444', emoji: '🔴' }
};

const SUBJECT_ICONS = {
    DBMS: '🗃️',
    OS: '💻',
    CN: '🌐',
    DSA: '🔢',
    OOPS: '🧩'
};

function Quiz() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Get filters from URL
    const category = searchParams.get('category');
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');

    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    const fetchDueCards = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params = { limit: 50 };
            if (category) params.category = category;
            if (subject) params.subject = subject;
            if (difficulty) params.difficulty = difficulty;

            const res = await axios.get(`/api/due-cards/${user.id}`, { params });
            setCards(res.data.cards);
            setCurrentIndex(0);
            setShowAnswer(false);
            setCompleted(res.data.cards.length === 0);
        } catch (err) {
            setError('Failed to load cards');
        } finally {
            setLoading(false);
        }
    }, [category, subject, difficulty, user.id]);

    useEffect(() => {
        fetchDueCards();
    }, [fetchDueCards]);

    const handleDifficultyChange = (event, newDifficulty) => {
        const newParams = new URLSearchParams(searchParams);
        if (newDifficulty) {
            newParams.set('difficulty', newDifficulty);
        } else {
            newParams.delete('difficulty');
        }
        setSearchParams(newParams);
    };

    const handleCardClick = () => {
        if (!showAnswer) {
            setShowAnswer(true);
        }
    };

    const handleRating = async (rating) => {
        if (submitting || !cards[currentIndex]) return;

        setSubmitting(true);
        try {
            await axios.post('/api/submit-review', {
                question_id: cards[currentIndex].id,
                rating: rating
            });

            setReviewedCount(prev => prev + 1);

            if (currentIndex + 1 >= cards.length) {
                setCompleted(true);
            } else {
                setCurrentIndex(prev => prev + 1);
                setShowAnswer(false);
            }
        } catch (err) {
            setError('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const ratingButtons = [
        { label: 'Again', rating: 'again', icon: <ReplayIcon />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { label: 'Hard', rating: 'hard', icon: <HardIcon />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { label: 'Good', rating: 'good', icon: <GoodIcon />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'Easy', rating: 'easy', icon: <EasyIcon />, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const currentCard = cards[currentIndex];
    const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Button startIcon={<BackIcon />} onClick={() => navigate('/dashboard')} sx={{ color: 'text.secondary' }}>
                    Back to Dashboard
                </Button>

                {/* Difficulty Filter */}
                <ToggleButtonGroup
                    value={difficulty || null}
                    exclusive
                    onChange={handleDifficultyChange}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            border: '1px solid rgba(255,255,255,0.1)',
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                color: '#a5b4fc',
                                '&:hover': {
                                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="easy" sx={{ color: DIFFICULTY_COLORS.easy.text }}>
                        🟢 Easy
                    </ToggleButton>
                    <ToggleButton value="medium" sx={{ color: DIFFICULTY_COLORS.medium.text }}>
                        🟡 Medium
                    </ToggleButton>
                    <ToggleButton value="hard" sx={{ color: DIFFICULTY_COLORS.hard.text }}>
                        🔴 Hard
                    </ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {subject && (
                        <Chip
                            label={`${SUBJECT_ICONS[subject] || '📘'} ${subject}`}
                            sx={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}
                        />
                    )}
                    {category && (
                        <Chip
                            label={category}
                            sx={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}
                        />
                    )}
                    <Typography color="text.secondary">
                        {currentIndex + 1} / {cards.length}
                    </Typography>
                </Box>
            </Box>

            {/* Progress Bar */}
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    mb: 4, height: 8, borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                        borderRadius: 4
                    }
                }}
            />

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Completion Screen */}
            {completed ? (
                <Box sx={{
                    textAlign: 'center', py: 8,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1))',
                    borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                    <CelebrationIcon sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                        {reviewedCount > 0 ? 'Great job!' : 'All caught up!'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        {reviewedCount > 0
                            ? `You reviewed ${reviewedCount} cards. Come back later for more!`
                            : 'No cards due for review. Start a new study session or try different filters.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button variant="contained" onClick={() => navigate('/dashboard')}
                            sx={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}>
                            Back to Dashboard
                        </Button>
                        <Button variant="outlined" onClick={fetchDueCards}>
                            Review More
                        </Button>
                    </Box>
                </Box>
            ) : currentCard && (
                <>
                    {/* Card Info Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {currentCard.subject && (
                            <Chip
                                size="small"
                                label={`${SUBJECT_ICONS[currentCard.subject] || '📘'} ${currentCard.subject}`}
                                sx={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                            />
                        )}
                        {currentCard.category && (
                            <Chip
                                size="small"
                                label={currentCard.category}
                                sx={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                            />
                        )}
                        {currentCard.difficulty && (
                            <Chip
                                size="small"
                                label={`${DIFFICULTY_COLORS[currentCard.difficulty]?.emoji} ${currentCard.difficulty.toUpperCase()}`}
                                sx={{
                                    backgroundColor: DIFFICULTY_COLORS[currentCard.difficulty]?.bg,
                                    color: DIFFICULTY_COLORS[currentCard.difficulty]?.text,
                                    border: `1px solid ${DIFFICULTY_COLORS[currentCard.difficulty]?.border}`,
                                    fontWeight: 600
                                }}
                            />
                        )}
                    </Box>

                    {/* Flashcard */}
                    <Box sx={{ mb: 4 }}>
                        <Flashcard
                            question={currentCard.question}
                            options={typeof currentCard.options === 'string'
                                ? JSON.parse(currentCard.options)
                                : currentCard.options}
                            showAnswer={showAnswer}
                            answer={currentCard.answer}
                            explanation={currentCard.explanation}
                            onClick={handleCardClick}
                        />
                    </Box>

                    {/* Rating Buttons */}
                    {showAnswer && (
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {ratingButtons.map((btn) => (
                                <Button
                                    key={btn.rating}
                                    onClick={() => handleRating(btn.rating)}
                                    disabled={submitting}
                                    startIcon={btn.icon}
                                    sx={{
                                        px: 3,
                                        py: 1.5,
                                        minWidth: 120,
                                        backgroundColor: btn.bg,
                                        color: btn.color,
                                        border: `1px solid ${btn.color}`,
                                        '&:hover': {
                                            backgroundColor: btn.color,
                                            color: 'white'
                                        }
                                    }}
                                >
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {btn.label}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            {currentCard.button_intervals?.[btn.rating] || '-'}
                                        </Typography>
                                    </Box>
                                </Button>
                            ))}
                        </Box>
                    )}

                    {!showAnswer && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                Think about your answer, then click the card to reveal
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}

export default Quiz;
