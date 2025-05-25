import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../auth/AuthContext';
import type { UserRole } from '../../../types/index';
import { Heart } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('patient');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(email, password, role);
            // Redirect based on role
            if (user.role === 'patient') {
                navigate('/patient/dashboard');
            } else {
                navigate('/doctor/dashboard');
            }
        } catch (err: any) {
            setError(err?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    // Demo credentials
    const setDemoCredentials = (userRole: UserRole) => {
        if (userRole === 'patient') {
            setEmail('patient@gmail.com');
            setPassword('12345678');
        } else {
            setEmail('doctor@gmail.com');
            setPassword('12345678');
        }
        setRole(userRole);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full"
            >
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-2">
                            <Heart className="h-12 w-12 text-primary-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">HEAL</h1>
                        <p className="text-gray-500 mt-1">Health Enabled Anywhere & Live</p>
                    </div>

                    {error && (
                        <div className="bg-error-50 text-error-700 p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-4 rounded-md transition ${role === 'patient'
                                        ? 'bg-white shadow-sm text-primary-700'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    onClick={() => setRole('patient')}
                                >
                                    Patient
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-4 rounded-md transition ${role === 'doctor'
                                        ? 'bg-white shadow-sm text-primary-700'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    onClick={() => setRole('doctor')}
                                >
                                    Doctor
                                </button>
                            </div>
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            fullWidth
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                            fullWidth
                        />

                        <div className="mt-6">
                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isLoading}
                            >
                                Sign In
                            </Button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-center mb-4 text-gray-500">Demo Accounts</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDemoCredentials('patient')}
                            >
                                Patient Demo
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDemoCredentials('doctor')}
                            >
                                Doctor Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};