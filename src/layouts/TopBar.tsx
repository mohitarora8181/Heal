import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, LogOut, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const Topbar = () => {
    const { currentUser, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const navigate = useNavigate();

    if (!currentUser) return null;

    // Mock notifications
    const notifications = [
        {
            id: 'n1',
            title: 'Appointment Reminder',
            message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:00 AM',
            timestamp: new Date('2025-03-15T10:00:00'),
            unread: true,
        },
        {
            id: 'n2',
            title: 'New Message',
            message: 'Dr. Michael Chen sent you a message regarding your last consultation',
            timestamp: new Date('2025-03-14T15:30:00'),
            unread: true,
        },
    ];

    // Mock messages
    const messages = [
        {
            id: 'm1',
            sender: {
                name: 'Dr. Sarah Johnson',
                profileImageUrl: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
            },
            message: 'How are you feeling today?',
            timestamp: new Date('2025-03-15T09:30:00'),
            unread: true,
        },
        {
            id: 'm2',
            sender: {
                name: 'Dr. Michael Chen',
                profileImageUrl: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg',
            },
            message: 'Your test results look good. Let\'s discuss them in detail.',
            timestamp: new Date('2025-03-14T16:45:00'),
            unread: true,
        },
    ];

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
        setIsNotificationsOpen(false);
        setIsMessagesOpen(false);
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        setIsProfileOpen(false);
        setIsMessagesOpen(false);
    };

    const toggleMessages = () => {
        setIsMessagesOpen(!isMessagesOpen);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
    };

    return (
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-800 md:hidden">HEAL</h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <button
                        className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={toggleNotifications}
                    >
                        <Bell size={20} />
                        {notifications.some(n => n.unread) && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotificationsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10"
                            >
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <h3 className="font-medium text-gray-800">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 hover:bg-gray-50 ${notification.unread ? 'bg-primary-50' : ''
                                                }`}
                                        >
                                            <p className="font-medium text-sm text-gray-800">{notification.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {format(notification.timestamp, 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative">
                    <button
                        className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={toggleMessages}
                    >
                        <MessageCircle size={20} />
                        {messages.some(m => m.unread) && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isMessagesOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10"
                            >
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <h3 className="font-medium text-gray-800">Messages</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`px-4 py-3 hover:bg-gray-50 ${message.unread ? 'bg-primary-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <Avatar
                                                    user={{
                                                        name: message.sender.name,
                                                        profileImageUrl: message.sender.profileImageUrl,
                                                        role: 'doctor',
                                                        _id: '',
                                                        email: '',
                                                    }}
                                                    size="sm"
                                                    className="mr-3"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-800">{message.sender.name}</p>
                                                    <p className="text-sm text-gray-600 truncate">{message.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {format(message.timestamp, 'MMM d, h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
                                    onClick={() => window.location.href = "/patient/profile"}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <User size={16} className="mr-2" />
                                    My profile
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Logout
                                </button>
                                <button className='p-3 hover:bg-gray-50 transition-all w-full' onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/EnterRoom')
                                }}>Join Room</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};