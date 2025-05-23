import React, {type  ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: ReactNode;
    className?: string;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hoverable = false
}) => {
    return (
        <motion.div
            className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}
            whileHover={hoverable ? { y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
};

export const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
            {children}
        </div>
    );
};

export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`px-6 py-4 ${className}`}>
            {children}
        </div>
    );
};

export const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
            {children}
        </div>
    );
};