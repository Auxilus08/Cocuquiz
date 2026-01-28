import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Card, CardContent, Typography, Box, CircularProgress,
    LinearProgress, Alert, Chip, Paper
} from '@mui/material';
import {
    School as SchoolIcon,
    TrendingUp as TrendingIcon,
    LocalFireDepartment as FireIcon,
    CheckCircle as CheckIcon,
    Schedule as ScheduleIcon,
    BarChart as ChartIcon,
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../App';

const SUBJECT_CONFIG = {
    'Analytical Reasoning': { icon: '🧠', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.2)' },
    'English Usage': { icon: '📝', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.2)' },
    'Quantitative Aptitude': { icon: '📊', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' },
    'DBMS': { icon: '🗃️', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)' }
};

function Stats() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/stats/${user.id}`);
            setStats(res.data);
        } catch (err) {
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const overallProgress = stats?.total_questions > 0
        ? Math.round((stats.reviewed / stats.total_questions) * 100)
        : 0;

    // Calculate overall score
    const overallCorrect = stats?.subjects?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0;
    const overallReviewed = stats?.subjects?.reduce((sum, s) => sum + (s.reviewed || 0), 0) || 0;
    const overallScore = overallReviewed > 0 ? Math.round((overallCorrect / overallReviewed) * 100) : 0;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrophyIcon sx={{ color: '#f59e0b' }} /> Your Progress & Scores
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Overview Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <Card sx={{
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(6, 182, 212, 0.2))',
                        border: '1px solid rgba(34, 211, 238, 0.3)'
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 40, color: '#22d3ee', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {stats?.total_questions || 0}
                            </Typography>
                            <Typography color="text.secondary">Total Questions</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card sx={{
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.2))',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <CheckIcon sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {stats?.reviewed || 0}
                            </Typography>
                            <Typography color="text.secondary">Completed</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card sx={{
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.2))',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingIcon sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {overallScore}%
                            </Typography>
                            <Typography color="text.secondary">Overall Score</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6} md={3}>
                    <Card sx={{
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.2))',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <FireIcon sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {stats?.streak || 0}
                            </Typography>
                            <Typography color="text.secondary">Day Streak</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Subject-wise Scores */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon sx={{ color: '#22d3ee' }} /> Subject-wise Performance
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats?.subjects?.map((subj) => {
                    const config = SUBJECT_CONFIG[subj.name] || { icon: '📘', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.2)' };

                    return (
                        <Grid item xs={12} md={6} key={subj.name}>
                            <Paper
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    border: `2px solid ${config.color}30`,
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 10px 30px ${config.color}30`,
                                        borderColor: config.color
                                    }
                                }}
                                onClick={() => navigate(`/quiz?subject=${encodeURIComponent(subj.name)}`)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    {/* Score Circle */}
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={subj.score || 0}
                                            size={100}
                                            thickness={6}
                                            sx={{
                                                color: config.color,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                {subj.score || 0}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Score</Typography>
                                        </Box>
                                    </Box>

                                    {/* Subject Details */}
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="h4">{config.icon}</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {subj.name}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                            <Chip
                                                label={`${subj.reviewed || 0} / ${subj.total} completed`}
                                                size="small"
                                                sx={{ backgroundColor: config.bgColor }}
                                            />
                                            <Chip
                                                label={`${subj.progress || 0}% progress`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <LinearProgress
                                            variant="determinate"
                                            value={subj.progress || 0}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: config.color,
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Overall Progress */}
            <Card sx={{ mb: 4, background: 'rgba(30, 41, 59, 0.5)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                Overall Progress
                            </Typography>
                            <Typography color="text.secondary">
                                {stats?.reviewed || 0} of {stats?.total_questions || 0} questions completed
                            </Typography>
                        </Box>
                        <Box sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            width: 100,
                            height: 100
                        }}>
                            <CircularProgress
                                variant="determinate"
                                value={overallProgress}
                                size={100}
                                thickness={4}
                                sx={{
                                    color: '#6366f1',
                                    '& .MuiCircularProgress-circle': {
                                        strokeLinecap: 'round',
                                    }
                                }}
                            />
                            <Box sx={{
                                position: 'absolute',
                                top: 0, left: 0, bottom: 0, right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {overallProgress}%
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={overallProgress}
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #6366f1, #22d3ee, #10b981)',
                                borderRadius: 6
                            }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Category Progress */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChartIcon sx={{ color: '#a78bfa' }} /> Progress by Topic
            </Typography>

            <Grid container spacing={2}>
                {stats?.categories?.map((cat) => (
                    <Grid item xs={12} md={6} key={cat.name}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateX(8px)',
                                    borderColor: 'primary.main'
                                }
                            }}
                            onClick={() => navigate(`/quiz?category=${encodeURIComponent(cat.name)}`)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ChartIcon sx={{ color: '#6366f1' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {cat.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {cat.reviewed} / {cat.total}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={cat.progress}
                                        sx={{
                                            flex: 1,
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                background: cat.progress === 100
                                                    ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                                                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                                borderRadius: 5
                                            }
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            minWidth: 50,
                                            color: cat.progress === 100 ? '#10b981' : 'inherit'
                                        }}
                                    >
                                        {cat.progress}%
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Due Today */}
            {stats?.due_today > 0 && (
                <Card sx={{
                    mt: 4,
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.2))',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ScheduleIcon sx={{ fontSize: 40, color: '#ef4444' }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    {stats.due_today} Cards Due
                                </Typography>
                                <Typography color="text.secondary">
                                    Don't break your streak! Review these cards today.
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}

export default Stats;
