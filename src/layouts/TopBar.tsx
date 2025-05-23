import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/common/Avatar';

export const Topbar = () => {
    const { currentUser, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Return null if no user is logged in
    if (!currentUser) return null;

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    return (
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-800 md:hidden">HEAL</h1>
            </div>

            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                </button>

                <button className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100">
                    <MessageCircle size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                </button>

                <div className="relative">
                    <button
                        className="flex items-center space-x-2 focus:outline-none"
                        onClick={toggleProfile}
                    >
                        <Avatar user={currentUser} size="sm" />
                        <span className="hidden md:inline text-sm font-medium text-gray-700">
                            {currentUser.name}
                        </span>
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                            >
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};