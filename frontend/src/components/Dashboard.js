import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Card, CardContent, Typography, Box, Button, Chip,
    LinearProgress, CircularProgress, Alert, Tabs, Tab, ToggleButton, ToggleButtonGroup,
    Paper
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    LocalFireDepartment as FireIcon,
    School as SchoolIcon,
    TrendingUp as TrendingIcon,
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
    Star as StarIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../App';

const DIFFICULTY_COLORS = {
    easy: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981' },
    medium: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', text: '#f59e0b' },
    hard: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' }
};

const SUBJECT_CONFIG = {
    'Analytical Reasoning': { icon: '🧠', color: '#8b5cf6' },
    'English Usage': { icon: '📝', color: '#06b6d4' },
    'Quantitative Aptitude': { icon: '📊', color: '#f59e0b' },
    'DBMS': { icon: '🗃️', color: '#10b981' }
};

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('ALL');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, subjectsRes] = await Promise.all([
                axios.get(`/api/stats/${user.id}`),
                axios.get('/api/subjects')
            ]);
            setStats(statsRes.data);
            setSubjects(subjectsRes.data.subjects);
        } catch (err) {
            setError('Failed to load stats');
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubjectChange = (event, newValue) => {
        if (newValue !== null) {
            setSelectedSubject(newValue);
        }
    };

    const handleStartQuiz = (subjectOverride = null) => {
        let url = '/quiz';
        const params = new URLSearchParams();
        const subject = subjectOverride || (selectedSubject !== 'ALL' ? selectedSubject : null);
        if (subject) params.append('subject', subject);
        if (params.toString()) url += `?${params.toString()}`;
        navigate(url);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const totalQuestions = subjects.reduce((sum, s) => sum + s.total, 0);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Hero Section */}
            <Paper sx={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                borderRadius: 4, p: 4, mb: 4, border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            Welcome, {user?.username}! 👋
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            Master aptitude with {totalQuestions}+ questions across 4 subjects
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PlayIcon />}
                                onClick={() => handleStartQuiz()}
                                sx={{
                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                                    px: 4
                                }}
                            >
                                Start Quiz ({stats?.due_today || 0} due)
                            </Button>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                            {stats?.streak > 0 && (
                                <Card sx={{
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
                                    border: '1px solid rgba(245, 158, 11, 0.3)', minWidth: 100
                                }}>
                                    <CardContent sx={{ textAlign: 'center', py: 2, px: 3 }}>
                                        <FireIcon sx={{ fontSize: 36, color: '#f59e0b' }} />
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                            {stats.streak}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Day Streak</Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Subject Cards with Scores */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrophyIcon sx={{ color: '#f59e0b' }} /> Your Subject Scores
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {subjects.map(subj => {
                    const config = SUBJECT_CONFIG[subj.name] || { icon: '📘', color: '#6366f1' };
                    const userSubjectStats = stats?.subjects?.find(s => s.name === subj.name) || {};

                    return (
                        <Grid item xs={12} sm={6} md={3} key={subj.name}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    border: `2px solid transparent`,
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: `0 20px 40px rgba(0,0,0,0.3)`,
                                        borderColor: config.color,
                                    }
                                }}
                                onClick={() => handleStartQuiz(subj.name)}
                            >
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="h2" sx={{ mb: 1 }}>{config.icon}</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                        {subj.name}
                                    </Typography>

                                    {/* Score Circle */}
                                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={userSubjectStats.score || 0}
                                            size={80}
                                            thickness={6}
                                            sx={{
                                                color: config.color,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                {userSubjectStats.score || 0}%
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {userSubjectStats.reviewed || 0} / {subj.total} completed
                                    </Typography>

                                    {/* Difficulty breakdown chips */}
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`E: ${subj.easy}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: DIFFICULTY_COLORS.easy.bg,
                                                color: DIFFICULTY_COLORS.easy.text,
                                                fontSize: '0.7rem',
                                                height: 24
                                            }}
                                        />
                                        <Chip
                                            label={`M: ${subj.medium}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: DIFFICULTY_COLORS.medium.bg,
                                                color: DIFFICULTY_COLORS.medium.text,
                                                fontSize: '0.7rem',
                                                height: 24
                                            }}
                                        />
                                        <Chip
                                            label={`H: ${subj.hard}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: DIFFICULTY_COLORS.hard.bg,
                                                color: DIFFICULTY_COLORS.hard.text,
                                                fontSize: '0.7rem',
                                                height: 24
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>



            {/* Subject Tabs for Category View */}
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon sx={{ color: '#a78bfa' }} /> Browse by Subject
            </Typography>
            <Tabs
                value={selectedSubject}
                onChange={handleSubjectChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    mb: 3,
                    '& .MuiTab-root': {
                        minHeight: 56,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 500,
                    },
                    '& .Mui-selected': {
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: 2,
                    }
                }}
            >
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>📚</span>
                            <span>All</span>
                            <Chip label={totalQuestions} size="small" />
                        </Box>
                    }
                    value="ALL"
                />
                {subjects.map(subj => {
                    const config = SUBJECT_CONFIG[subj.name] || { icon: '📘' };
                    return (
                        <Tab
                            key={subj.name}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{config.icon}</span>
                                    <span>{subj.name}</span>
                                    <Chip label={subj.total} size="small" />
                                </Box>
                            }
                            value={subj.name}
                        />
                    );
                })}
            </Tabs>

            {/* Quick Start Buttons */}
            <Grid container spacing={2}>
                {subjects
                    .filter(s => selectedSubject === 'ALL' || s.name === selectedSubject)
                    .map(subj => {
                        const config = SUBJECT_CONFIG[subj.name] || { icon: '📘', color: '#6366f1' };
                        return (
                            <Grid item xs={12} sm={6} md={3} key={subj.name}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => handleStartQuiz(subj.name)}
                                    sx={{
                                        py: 2,
                                        borderColor: config.color,
                                        color: config.color,
                                        '&:hover': {
                                            backgroundColor: `${config.color}20`,
                                            borderColor: config.color,
                                        }
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5">{config.icon}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Quiz: {subj.name}
                                        </Typography>
                                    </Box>
                                </Button>
                            </Grid>
                        );
                    })
                }
            </Grid>

            {/* Overall Stats */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingIcon sx={{ color: '#10b981' }} /> Overall Progress
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={6} md={3}>
                        <Card sx={{ background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <SchoolIcon sx={{ fontSize: 36, color: '#22d3ee', mb: 1 }} />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.total_questions || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card sx={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <TrendingIcon sx={{ fontSize: 36, color: '#10b981', mb: 1 }} />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.reviewed || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">Completed</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card sx={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PlayIcon sx={{ fontSize: 36, color: '#6366f1', mb: 1 }} />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.due_today || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">Due Today</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card sx={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <StarIcon sx={{ fontSize: 36, color: '#f59e0b', mb: 1 }} />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.total_reviews || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">Total Reviews</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container >
    );
}

export default Dashboard;
