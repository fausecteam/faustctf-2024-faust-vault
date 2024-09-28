import axios from "axios";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router";
import init, { generate_master_key, encrypt_text, decrypt_text } from 'wasm-crypt';
import rsa_init, { RsaKeypair } from 'rsa';
import { generate_rsa_keys, encrypt_master_key, decrypt_master_key } from 'rsa';

export interface Result {
    severity: 'success' | 'info' | 'warning' | 'error';
    message: string;
}

interface KeyValue {
    key: string;
    value: string;
}


export interface User {
    group: string;
    createdAt: number;
    e?: string;
    n?: string;
}

export interface Secret {
    key: string;
    value: string;
}

interface AuthContextType {
    enabled: boolean,
    isAuthenticated: () => boolean;
    username: string;
    getSecrets: () => Promise<Secret[]>;
    getUsers: () => Promise<User[]>;
    getUser: (username: string, createdAt: number) => Promise<User>;
    addSecret: (key: string, value: string) => Promise<Result>;
    register: (username: string, password: string, repeatPassword: string) => Promise<Result>;
    login: (username: string, password: string) => Promise<Result>;
    logout: () => void;
}

const defaultValues = {
    enabled: false,
    isAuthenticated: () => false,
    username: "",
    getSecrets: () => (Promise.resolve([])),
    getUsers: () => Promise.resolve([]),
    getUser: (username: string, createdAt: number) => Promise.reject(),
    addSecret: (): Promise<Result> => (Promise.resolve({ severity: 'warning', message: 'Not Implemented' })),
    register: (username: string, password: string, repeatPassword: string): Promise<Result> => (Promise.resolve({ severity: 'warning', message: 'Not Implemented' })),
    login: (username: string, password: string): Promise<Result> => (Promise.resolve({ severity: 'warning', message: 'Not Implemented' })),
    logout: () => { },
}

export const AuthContext = createContext<AuthContextType>(defaultValues);

export function ProtectedRoute({ redirect, children }: { redirect: string } & PropsWithChildren) {
    const { isAuthenticated } = useContext(AuthContext);

    return (
        isAuthenticated() ? children : <Navigate replace to={redirect} />
    )
}

export function LoginRoute({ redirect, children }: { redirect: string } & PropsWithChildren) {
    const { isAuthenticated } = useContext(AuthContext);

    return (
        isAuthenticated() ? <Navigate replace to={redirect} /> : children
    )
}


export default function AuthProvider({ children }: PropsWithChildren) {

    const [enabled, setEnabled] = useState(defaultValues.enabled);
    const [initCount, setInitCount] = useState(0);
    const [username, setUsername] = useState(defaultValues.username);
    const [masterKey, setMasterKey] = useState<Uint8Array | undefined>(undefined);

    const client = axios.create({ baseURL: `/api/store` });

    useEffect(() => {
        init().then(() => {
            if (initCount === 1) setEnabled(true);
            setInitCount((oldValue) => { if (oldValue === 1) setEnabled(true); return oldValue + 1; })
        }).catch(console.error);
        rsa_init().then(() => {
            if (initCount === 1) setEnabled(true);
            setInitCount((oldValue) => { if (oldValue === 1) setEnabled(true); return oldValue + 1; })
        }).catch(console.error);
    }, []);

    const store = async (group: string, key: string, value: string): Promise<KeyValue> => {
        const response = await client.post(`/${group}/`, { key, value });
        const content: KeyValue = response.data;
        return content;
    }
    const retrieve = async (group: string, key: string): Promise<KeyValue> => {
        const response = await client.get(`/${group}/${key}`);
        const content: KeyValue = response.data;
        return content;
    }

    const isAuthenticated = () => {
        return username !== "";
    }

    const getSecrets = async () => {
        if (!isAuthenticated) throw new Error("Log in first!");
        const response = await client.get(`/${username}/`);
        const content: Secret[] = response.data;
        const decoder = new TextDecoder();
        return content
            .filter(secret => !["master-key", "e", "n"].includes(secret.key))
            .map((secret) => {
                const buffer = hex2buf(secret.value);
                return { key: secret.key, value: decoder.decode(decrypt_text(buffer, masterKey!)) };
            });
    }

    const getUsers = async () => {
        if (!isAuthenticated) throw new Error("Log in first!");
        const response = await client.get(`/`);
        const content: User[] = response.data;
        return content;
    }

    const getUser = async (username: string, createdAt: number) => {
        if (!isAuthenticated) throw new Error("Log in first!");
        const eres = await client.get(`/${username}/e`);
        const nres = await client.get(`/${username}/n`);
        const eValue: KeyValue = eres.data;
        const nValue: KeyValue = nres.data;
        return {
            group: username,
            createdAt,
            e: eValue.value,
            n: nValue.value
        }
    }

    const addSecret = async (key: string, value: string): Promise<Result> => {
        if (!isAuthenticated) throw new Error("Log in first!");
        if (!masterKey) throw new Error("Master Key not found! Please log out and in again!");
        try {
            const encoder = new TextEncoder();
            const encodedValue = encoder.encode(value);
            const encryptedValue = encrypt_text(encodedValue, masterKey);
            await store(username, key, buf2hex(encryptedValue));
        } catch (error) {
            return { severity: 'error', message: error.message };
        }
        return { severity: 'success', message: 'Successfully added secret' }
    }

    const register = async (username: string, password: string, repeatPassword: string): Promise<Result> => {
        if (!enabled) return { severity: 'error', message: 'wasm not initialized' };
        if (password !== repeatPassword) return { severity: 'error', message: 'passwords don\'t match' };
        try {
            const a = new Date().toLocaleTimeString();
            let masterKey = generate_master_key([username, a]);
            const mk = new Uint8Array(29);
            mk.set(new Uint8Array([0, 1, 2, 3, 4]), 0);
            mk.set(masterKey, 5);
            let rsaKeypair = generate_rsa_keys(new TextEncoder().encode(password));
            let encryptedMasterKey = encrypt_master_key(mk, rsaKeypair.e, rsaKeypair.n);
            await store(username, "master-key", buf2hex(encryptedMasterKey));
            await store(username, "e", buf2hex(rsaKeypair.e));
            await store(username, "n", buf2hex(rsaKeypair.n));
        } catch (error) {
            return { severity: 'error', message: error.message };
        }
        return { severity: 'success', message: 'Successfully registered' }
    }

    const login = async (username: string, password: string): Promise<Result> => {
        if (!enabled) return { severity: 'error', message: 'wasm not initialized' };
        try {
            const result = await retrieve(username, "master-key");
            let rsaKeypair = generate_rsa_keys(new TextEncoder().encode(password));
            const buffer = hex2buf(result.value);
            const masterKey = decrypt_master_key(buffer, rsaKeypair.d, rsaKeypair.n);
            if (!isMasterKey(masterKey)) return { severity: 'error', message: 'wrong password' };
            setMasterKey(masterKey.slice(5));
            setUsername(username);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 404) return { severity: 'error', message: "user does not exist" };
            return { severity: 'error', message: error.message };
        }
        return { severity: 'success', message: 'Successfully logged in' }
    }

    const logout = () => {
        if (enabled) {
            setUsername("");
        }
    }

    const value = {
        enabled,
        isAuthenticated,
        username,
        getSecrets,
        getUsers,
        getUser,
        addSecret,
        register,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

function buf2hex(buffer: Uint8Array) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

function hex2buf(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string must have an even length');
    }

    const buffer = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        buffer[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return buffer;
}

function isMasterKey(arr: Uint8Array) {
    for (let i = 0; i < 5; i++) {
        if (arr[i] !== i) {
            //console.log(`${arr[i]} ${i}`);
            return false;
        }
    }
    return true;
}