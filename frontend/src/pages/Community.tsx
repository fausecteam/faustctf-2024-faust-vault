import React, { useContext, useEffect, useState } from 'react'
import { AuthContext, User } from '../providers/AuthProvider';
import ImageIcon from '@mui/icons-material/Image';
import Box from '@mui/material/Box';
import Navigation from '../components/Navigation';
import { Avatar, Button, Container, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}


export default function Community() {

    const { getUsers, getUser } = useContext(AuthContext);

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        (async () => {
            const users = await getUsers();
            setUsers(users);
        })();
    }, []);

    const inspectUser = async (username: string) => {
        const user = await getUser(username, 0);
        downloadTextFile(`${username}.txt`,
            `${username}\n\ne\n${user.e}\n\nn\n${user.n}`);

    }

    return (
        <Box>
            <Navigation />
            <Container>
                <Typography variant="h2">
                    Community
                </Typography>
                <List>
                    {users.map((user) => (
                        <ListItemButton key={user.group} onClick={() => inspectUser(user.group)}>
                            <ListItemAvatar>
                                <Avatar>
                                    <ImageIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={user.group} secondary={new Date(user.createdAt * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
                        </ListItemButton>
                    ))}

                </List>
            </Container>
        </Box>
    )
}
