import { AppBar, Avatar, Box, Button, Container, IconButton, MenuItem, Toolbar, Typography } from '@mui/material'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../providers/AuthProvider';

export default function Navigation() {

    const { username } = useContext(AuthContext);

    return (
        <AppBar position="static">
            <Container>
                <Toolbar>
                    <Typography
                        variant="h6"
                        sx={{
                            mr: 2,
                            display: 'flex',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '-.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        FAUSTVault
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex' }}>
                        <Link to="/secrets">
                            <MenuItem sx={{ borderRadius: '5px' }}>
                                <Typography
                                    textAlign="center"
                                >
                                    SECRETS
                                </Typography>
                            </MenuItem>
                        </Link>
                        <Link to="/community">
                            <MenuItem sx={{ borderRadius: '5px' }}>
                                <Typography
                                    textAlign="center"
                                >
                                    COMMUNITY
                                </Typography>
                            </MenuItem>
                        </Link>
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <Link to="/profile">
                            <IconButton>
                                <Avatar alt={username} src="/static/images/avatar/2.jpg" />
                            </IconButton>
                        </Link>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    )
}
