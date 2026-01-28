import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAuth } from '../App';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        setLoading(true);

        try {
            await register(username, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
        }}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={{
                    p: 5,
                    borderRadius: 4,
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box sx={{
                            width: 80, height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 10px 40px rgba(34, 211, 238, 0.3)'
                        }}>
                            <PersonAddIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Typography variant="h4" sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #fff, #a5b4fc)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Create Account
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Start your DBMS learning journey
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                            inputProps={{ minLength: 3 }}
                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(15, 23, 42, 0.5)' } }}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(15, 23, 42, 0.5)' } }}
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(15, 23, 42, 0.5)' } }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 3, py: 1.5,
                                background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
                                boxShadow: '0 4px 20px rgba(34, 211, 238, 0.4)',
                                '&:hover': { background: 'linear-gradient(90deg, #0ea5e9, #0891b2)' }
                            }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#22d3ee', textDecoration: 'none', fontWeight: 600 }}>
                                Sign In
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default Register;
