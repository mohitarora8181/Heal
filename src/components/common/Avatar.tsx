import React from 'react';
import type { User } from '../../../types/index';

interface AvatarProps {
    user: User;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    user,
    size = 'md',
    className = ''
}) => {
    // Determine avatar size
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
    };

    // Get initials from user name
    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className={`${className}`}>
            {user.profileImageUrl ? (
                <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className={`${sizeClasses[size]} rounded-full object-cover`}
                />
            ) : (
                <div
                    className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-primary-100 text-primary-700 font-medium`}
                >
                    {getInitials(user.name)}
                </div>
            )}
        </div>
    );
};