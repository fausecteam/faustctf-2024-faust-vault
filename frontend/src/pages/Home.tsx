import React, { useContext } from 'react'
import { Navigate } from 'react-router'
import { AuthContext } from '../providers/AuthProvider';

export default function Index() {

  const { isAuthenticated } = useContext(AuthContext);

  const redirectURL = isAuthenticated() ? "/secrets" : "/login";

  return (
    <Navigate replace to={redirectURL} />
  )
}
