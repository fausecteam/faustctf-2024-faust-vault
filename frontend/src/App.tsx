import React from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { BrowserRouter, Link } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import AuthProvider, { LoginRoute, ProtectedRoute } from './providers/AuthProvider';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Secrets from './pages/Secrets';
import Community from './pages/Community';

export default function App() {

    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginRoute redirect="/secrets"><Login /></LoginRoute>} />
                    <Route path="/register" element={<LoginRoute redirect="/secrets"><Register /></LoginRoute>} />
                    <Route path="/secrets" element={<ProtectedRoute redirect="/login"><Secrets /></ProtectedRoute>} />
                    <Route path="/community" element={<ProtectedRoute redirect="/login"><Community /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute redirect="/login"><Profile /></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}