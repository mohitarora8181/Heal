import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../../types/index';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<User>;
    logout: () => void;
    register: (
        email: string,
        password: string,
        name: string,
        role: UserRole,
        specialization?: string,
        profileImageUrl?: string
    ) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('healToken');
        if (token) {
            verifyToken(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const response = await fetch(`${backendUrl}/auth/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
            } else {
                // Token invalid, clear storage
                localStorage.removeItem('healToken');
                localStorage.removeItem('healUser');
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('healToken');
            localStorage.removeItem('healUser');
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const response = await fetch(`${backendUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    role
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            const { user, token } = data;

            const authenticatedUser: User = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole,
            };

            setCurrentUser(authenticatedUser);

            localStorage.setItem('healUser', JSON.stringify(authenticatedUser));
            localStorage.setItem('healToken', token);

            return authenticatedUser;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('healUser');
    };

    const register = async (email: string, password: string, name: string, role: UserRole, specialization?: string, profileImageUrl?: string): Promise<User> => {
        setIsLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const response = await fetch(`${backendUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    specialization,  // Optional field for doctor role
                    profileImageUrl  // Optional profile image
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            const { user, token } = data;

            const authenticatedUser: User = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole,
                // Optional fields if user is a doctor
                ...(user.specialization && { specialization: user.specialization }),
                ...(user.profileImageUrl && { profileImageUrl: user.profileImageUrl }),
            };

            setCurrentUser(authenticatedUser);

            localStorage.setItem('healUser', JSON.stringify(authenticatedUser));
            localStorage.setItem('healToken', token);

            return authenticatedUser;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        currentUser,
        isLoading,
        login,
        logout,
        register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};