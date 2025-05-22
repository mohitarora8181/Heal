import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../../types/index';
import { mockPatients, mockDoctors } from '../../dummyData';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
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
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('healUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            // In a real app, this would be an API call
            // Simulating authentication with mock data
            let user;

            if (role === 'patient') {
                user = mockPatients.find(p => p.email === email);
            } else {
                user = mockDoctors.find(d => d.email === email);
            }

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Save user to state and localStorage
            setCurrentUser(user);
            localStorage.setItem('healUser', JSON.stringify(user));
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

    const register = async (email: string, password: string, name: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const newUser: User = {
                id: Math.random().toString(36).substring(2, 9),
                name,
                email,
                role,
            };

            setCurrentUser(newUser);
            localStorage.setItem('healUser', JSON.stringify(newUser));
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