import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Chip
} from '@mui/material';
import {
    Home as HomeIcon,
    Quiz as QuizIcon,
    BarChart as StatsIcon,
    LocalFireDepartment as FireIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../App';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
        { path: '/quiz', label: 'Quiz', icon: <QuizIcon /> },
        { path: '/stats', label: 'Stats', icon: <StatsIcon /> },
    ];

    return (
        <AppBar position="sticky" sx={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mr: 3
                    }}>
                        DBMS Quiz
                    </Typography>

                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            sx={{
                                color: location.pathname.startsWith(item.path) ? '#6366f1' : 'rgba(255,255,255,0.7)',
                                '&:hover': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {user?.streak > 0 && (
                        <Chip
                            icon={<FireIcon sx={{ color: '#f59e0b !important' }} />}
                            label={`${user.streak} day streak`}
                            sx={{
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                color: '#f59e0b',
                                fontWeight: 600
                            }}
                        />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                            width: 32, height: 32,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            fontSize: '0.875rem'
                        }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {user?.username}
                        </Typography>
                    </Box>

                    <IconButton onClick={logout} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;
