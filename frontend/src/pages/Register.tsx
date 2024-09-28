import { Alert, Box, Button, Grid, Paper, TextField } from '@mui/material'
import React, { FormEvent, useContext, useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, Result } from '../providers/AuthProvider';

export default function Register() {

    const { enabled, register } = useContext(AuthContext);

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [repeatpassword, setRepeatPassword] = useState("");

    const [message, setMessage] = useState<Result | undefined>(undefined);

    const formSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = await register(username, password, repeatpassword);
        setMessage(result);
        if (result.severity === 'success') {
            navigate('/login');
        }
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
                            <TextField value={repeatpassword} onChange={(e) => { setRepeatPassword(e.target.value) }} style={{ width: "100%" }} id="repeat_password" label="Repeat Password" variant="standard" type="password" />
                            <Button type="submit" style={{ width: "100%", marginTop: 20 }} variant="contained" disabled={!enabled}>Register</Button>
                        </form>
                        <Box className="p-5">
                            Already have an account? <Link to="/login" className='text-blue-500'>Log In</Link> instead.
                        </Box>
                    </Box>
                </Paper>
            </Box >
        </Grid >
    )
}
