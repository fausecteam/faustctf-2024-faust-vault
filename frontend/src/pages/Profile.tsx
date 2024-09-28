import React, { useContext } from 'react'
import { AuthContext } from '../providers/AuthProvider';
import Box from '@mui/material/Box';
import Navigation from '../components/Navigation';
import { Button, Container, Typography } from '@mui/material';

export default function Profile() {

    const { username, logout } = useContext(AuthContext);

    return (
        <Box>
            <Navigation />
            <Container>
                <Typography variant="h2">
                    Profile
                </Typography>
                <div>Username: {username}</div>
                <Button onClick={logout} variant="contained" color="error">Logout</Button>
            </Container>
        </Box>
    )
}
