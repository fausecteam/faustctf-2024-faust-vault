import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { AuthContext, Result, Secret } from '../providers/AuthProvider';
import Box from '@mui/material/Box';
import Navigation from '../components/Navigation';
import { Alert, Button, Container, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

export default function Secrets() {

    const { getSecrets, addSecret } = useContext(AuthContext);

    const [open, setOpen] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [alert, setAlert] = useState<Result | undefined>(undefined)

    const [secrets, setSecrets] = useState<Secret[]>([]);

    useEffect(() => {
        (async () => {
            const secrets = await getSecrets();
            setSecrets(secrets);
        })();
    }, []);

    const formSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await addSecret(newKey, newValue);
        if (res.severity != 'success') {
            setAlert(res);
            return;
        }
        const secrets = await getSecrets();
        setSecrets(secrets);
        setNewKey("");
        setNewValue("");
        setAlert(undefined);
        setOpen(false);
    }

    return (
        <Box>
            <Navigation />
            <Container>
                <Typography variant="h2" className="py-5">
                    Secrets
                </Typography>
                <Box className="py-3">
                    <Button variant="contained" onClick={() => { setOpen(true) }}>Add</Button>
                    <Modal
                        open={open}
                    >
                        <Box sx={{
                            position: 'absolute' as 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            p: 4,
                        }}>
                            <Typography variant="h6" component="h2">
                                Add Secret
                            </Typography>
                            {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
                            <form onSubmit={formSubmit}>
                                <TextField value={newKey} onChange={(e) => { setNewKey(e.target.value) }} style={{ width: "100%" }} id="key" label="Key" variant="standard" />
                                <TextField value={newValue} onChange={(e) => { setNewValue(e.target.value) }} style={{ width: "100%" }} id="value" label="Value" variant="standard" />
                                <Button type="submit" style={{ width: "100%", marginTop: 20 }} variant="contained">Add</Button>
                            </form>
                        </Box>
                    </Modal>
                </Box>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 900 }}>Key</TableCell>
                                <TableCell sx={{ fontWeight: 900 }} align="right">Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {secrets.map((row) => (
                                <TableRow
                                    key={row.key}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.key}
                                    </TableCell>
                                    <TableCell align="right">{row.value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    )
}
