import { Alert, Box, Button, Grid, Paper, TextField } from '@mui/material'
import React, { FormEvent, useContext, useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext, Result } from '../providers/AuthProvider';
import { Link } from 'react-router-dom';

export default function Login() {

    const { enabled, login } = useContext(AuthContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState<Result | undefined>(undefined);

    const formSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = await login(username, password);
        setMessage(result);
    }

    return (
        <Grid>
            <Box className="flex items-center justify-center h-screen">
                <Paper elevation={10} className="p-10 w-[280]">
                    <Box className="flex flex-col items-center">
                        <Box className="p-5 rounded-full bg-green-500 mb-10"><LockOutlinedIcon /></Box>
                        {
                            message && (<Alert style={{ width: "100%" }} severity={message.severity}>
                                {message.message}
                            </Alert>)
                        }
                        <form onSubmit={formSubmit}>
                            <TextField value={username} onChange={(e) => { setUsername(e.target.value) }} style={{ width: "100%" }} id="username" label="Username" variant="standard" />
                            <TextField value={password} onChange={(e) => { setPassword(e.target.value) }} style={{ width: "100%" }} id="password" label="Password" variant="standard" type="password" />
                            <Button type="submit" style={{ width: "100%", marginTop: 20 }} variant="contained" disabled={!enabled}>Log In</Button>
                        </form>
                        <Box className="p-5">
                            No account yet? <Link to="/register" className='text-blue-500'>Register</Link> now.
                        </Box>
                    </Box>
                </Paper>
            </Box >
        </Grid >
    )
}
