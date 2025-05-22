import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../../types/index';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRole
}) => {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role !== allowedRole) {
        if (currentUser.role === 'patient') {
            return <Navigate to="/patient/dashboard" replace />;
        } else {
            return <Navigate to="/doctor/dashboard" replace />;
        }
    }

    return <>{children}</>;
};