import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, User, MessageCircle, FilePlus, FileText, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Sidebar = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Return null if no user is logged in
    if (!currentUser) return null;

    const isPatient = currentUser.role === 'patient';

    const patientLinks = [
        { name: 'Dashboard', path: '/patient/dashboard', icon: <Activity size={20} /> },
        { name: 'Appointments', path: '/patient/appointments', icon: <Calendar size={20} /> },
        { name: 'Find Doctors', path: '/patient/find-doctors', icon: <User size={20} /> },
        { name: 'Messages', path: '/patient/messages', icon: <MessageCircle size={20} /> },
        { name: 'Medical Records', path: '/patient/records', icon: <FileText size={20} /> },
        { name: 'Prescriptions', path: '/patient/prescriptions', icon: <FilePlus size={20} /> },
        { name: 'Payments', path: '/patient/payments', icon: <CreditCard size={20} /> },
    ];

    const doctorLinks = [
        { name: 'Dashboard', path: '/doctor/dashboard', icon: <Activity size={20} /> },
        { name: 'Appointments', path: '/doctor/appointments', icon: <Calendar size={20} /> },
        { name: 'Patients', path: '/doctor/patients', icon: <User size={20} /> },
        { name: 'Messages', path: '/doctor/messages', icon: <MessageCircle size={20} /> },
        { name: 'Medical Records', path: '/doctor/records', icon: <FileText size={20} /> },
        { name: 'Prescriptions', path: '/doctor/prescriptions', icon: <FilePlus size={20} /> },
        { name: 'Payments', path: '/doctor/payments', icon: <CreditCard size={20} /> },
    ];

    const links = isPatient ? patientLinks : doctorLinks;

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const toggleMobileSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    const sidebarVariants = {
        open: { width: 250, transition: { duration: 0.3 } },
        closed: { width: 80, transition: { duration: 0.3 } }
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleMobileSidebar}
                className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-20 w-64 bg-white shadow-lg lg:hidden"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-center p-4 border-b">
                                <h1 className="text-2xl font-bold text-primary-600">HEAL</h1>
                            </div>
                            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                                {links.map((link) => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors ${isActive
                                                ? 'bg-primary-50 text-primary-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`
                                        }
                                    >
                                        <span className="mr-3">{link.icon}</span>
                                        <span>{link.name}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.div
                variants={sidebarVariants}
                initial="open"
                animate={isOpen ? 'open' : 'closed'}
                className="hidden lg:block bg-white h-full shadow-md z-10 overflow-x-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    {isOpen ? (
                        <h1 className="text-2xl font-bold text-primary-600">HEAL</h1>
                    ) : (
                        <h1 className="text-2xl font-bold text-primary-600">H</h1>
                    )}
                    <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                <nav className="flex flex-col p-4">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center py-3 px-4 rounded-lg mb-2 transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <span>{link.icon}</span>
                            {isOpen && <span className="ml-3">{link.name}</span>}
                        </NavLink>
                    ))}
                </nav>
            </motion.div>
        </>
    );
};