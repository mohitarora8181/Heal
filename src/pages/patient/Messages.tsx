import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Paperclip, Loader, Bot } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { format } from 'date-fns';
import { useAuth } from '../../auth/AuthContext';
import io, { Socket } from 'socket.io-client';

// Define types
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    specialization?: string;
    profileImageUrl?: string;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    read: boolean;
}

interface Conversation {
    _id: string;
    participants: User[];
    lastMessage?: {
        content: string;
        timestamp: Date;
        senderId: string;
    };
    unreadCount: number;
}

interface MedicalRecord {
    title: string;
    description: string;
}

// AI assistant user object
const AI_ASSISTANT: User = {
    _id: 'ai',
    name: 'Health AI Assistant',
    email: 'ai@heal.app',
    role: 'assistant',
    profileImageUrl: '/ai-avatar.png' // You can add a proper AI avatar image
};

export const Messages = () => {
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiChat, setIsAiChat] = useState(false);
    const [aiConversationId, setAiConversationId] = useState<string | null>(null);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sentMessagesRef = useRef<Set<string>>(new Set());

    // Check URL for AI conversation parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const conversationId = params.get('conversation');

        if (conversationId === 'ai') {
            setIsAiChat(true);
            setAiConversationId("ai")
            setLoading(false);
        } else {
            setIsAiChat(false);
        }
    }, [window.location.search]);

    // Fetch user's medical records for AI context
    useEffect(() => {
        if (isAiChat) {
            fetchMedicalRecords();
        }
    }, [isAiChat]);

    // Connect to socket server on component mount (only for regular chats)
    useEffect(() => {
        if (!currentUser?._id || isAiChat) return;

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const token = localStorage.getItem('healToken');

        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        console.log("Attempting to connect to socket at:", backendUrl);

        socketRef.current = io(backendUrl, {
            path: "/chat",
            auth: { token },
            query: { userId: currentUser._id }
        });

        // Socket event listeners
        socketRef.current.on('connect', () => {
            console.log('Socket connected with ID:', socketRef.current?.id);
            console.log('Current user ID:', currentUser._id);
            fetchConversations();
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Failed to connect to chat server');
            setLoading(false);
        });

        // Add error event listener
        socketRef.current.on('error', (errorData) => {
            console.error('Socket server error:', errorData);
            setError(`Server error: ${errorData.message || 'Unknown error'}`);
        });

        // Add message sent confirmation handler
        socketRef.current.on('message_sent', (data) => {
            console.log('Message sent confirmation:', data);
        });

        socketRef.current.on('new_message', (newMessage) => {
            console.log('New message received:', newMessage);

            // Skip messages we've already added optimistically
            if (newMessage.senderId === currentUser?._id) {
                const tempIdString = newMessage._id.toString();
                if (sentMessagesRef.current.has(tempIdString)) {
                    console.log('Skipping already displayed message:', tempIdString);
                    return;
                }
            }

            // Handle incoming new message
            if (selectedConversation) {
                const isRelevantToCurrentConversation =
                    selectedConversation._id === newMessage.conversationId ||
                    selectedConversation.participants.some(p => p._id === newMessage.senderId);

                if (isRelevantToCurrentConversation) {
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                }
            }

            // Update conversations list with new message
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    // Check if this message belongs to this conversation
                    if (conv._id === newMessage.conversationId) {
                        // Update last message and unread count
                        return {
                            ...conv,
                            lastMessage: {
                                content: newMessage.content,
                                timestamp: newMessage.timestamp,
                                senderId: newMessage.senderId
                            },
                            unreadCount: conv.unreadCount + (
                                newMessage.senderId !== currentUser._id &&
                                    (!selectedConversation || selectedConversation._id !== conv._id) ? 1 : 0
                            )
                        };
                    }
                    return conv;
                });
            });
        });

        // Add notification handler (for when not in the conversation)
        socketRef.current.on('new_message_notification', ({ message, conversation }) => {
            console.log('New message notification:', message, 'for conversation:', conversation);

            // Update conversations to show new message notification
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv._id === conversation) {
                        return {
                            ...conv,
                            lastMessage: {
                                content: message.content,
                                timestamp: message.timestamp,
                                senderId: message.senderId
                            },
                            unreadCount: conv.unreadCount + 1
                        };
                    }
                    return conv;
                });
            });

            // If the message is not from the currently selected conversation
            if (!selectedConversation || selectedConversation._id !== conversation) {
                // You could add a browser notification here if desired
                // new Notification(`New message from ${message.senderId.name}`, {body: message.content});
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [currentUser, selectedConversation?._id, isAiChat]);

    // Fetch medical records for AI context
    const fetchMedicalRecords = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            const response = await fetch(`${backendUrl}/medical-records/${currentUser?._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch medical records');
            }

            const data = await response.json();
            setMedicalRecords(data);
        } catch (err) {
            console.error('Error fetching medical records:', err);
            // Not setting error here as it's not critical for the chat functionality
        }
    };

    // Handle sending message to AI assistant
    const handleSendAiMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !currentUser) return;

        // Create temporary message
        const tempId = Date.now().toString();
        const optimisticMessage: Message = {
            _id: tempId,
            senderId: currentUser._id,
            receiverId: 'ai',
            content: message.trim(),
            timestamp: new Date(),
            read: true
        };

        // Add to UI
        setMessages(prev => [...prev, optimisticMessage]);

        // Clear input
        setMessage('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            // Send message to AI endpoint
            const response = await fetch(`${backendUrl}/ai-response`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message.trim(),
                    user_name: currentUser.name,
                    medical_records: medicalRecords,
                    conversationId: aiConversationId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            // Add AI response to UI
            const aiResponseMessage: Message = {
                _id: data.messageId,
                senderId: 'ai',
                receiverId: currentUser._id,
                content: data.response,
                timestamp: new Date(),
                read: true
            };

            setMessages(prev => [...prev, aiResponseMessage]);

        } catch (err) {
            console.error('Error getting AI response:', err);

            // Show error message in chat
            const errorMessage: Message = {
                _id: 'error-' + Date.now(),
                senderId: 'ai',
                receiverId: currentUser._id,
                content: "Sorry, I couldn't process your request. Please try again later.",
                timestamp: new Date(),
                read: true
            };

            setMessages(prev => [...prev, errorMessage]);
        }
    };

    // Scroll to bottom of messages when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // When selected conversation changes, fetch messages
    useEffect(() => {
        if (selectedConversation && socketRef.current && !isAiChat) {
            console.log(`Joining conversation: ${selectedConversation._id}`);

            // Join conversation room
            socketRef.current.emit('join_conversation', {
                conversationId: selectedConversation._id
            });

            // Mark messages as read
            socketRef.current.emit('mark_read', {
                conversationId: selectedConversation._id
            });

            // Update the unread count locally
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv._id === selectedConversation._id) {
                        return { ...conv, unreadCount: 0 };
                    }
                    return conv;
                });
            });

            // Fetch messages for this conversation
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation?._id, isAiChat]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            const response = await fetch(`${backendUrl}/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const data = await response.json();
            setConversations(data);

            // Check URL parameters
            const params = new URLSearchParams(window.location.search);
            const conversationId = params.get('conversation');

            // If AI conversation is requested, don't auto-select regular conversation
            if (conversationId === 'ai') {
                return;
            }

            // Auto-select specific conversation if in URL
            if (conversationId && data.length > 0) {
                const conversation = data.find((conv: any) => conv._id === conversationId);
                if (conversation) {
                    setSelectedConversation(conversation);
                    return;
                }
            }

            // Otherwise auto-select first conversation if available
            if (data.length > 0 && !selectedConversation) {
                setSelectedConversation(data[0]);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            const response = await fetch(`${backendUrl}/conversations/${conversationId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const data = await response.json();
            setMessages(data);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages');
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        // If AI chat is active, use the AI message handler
        if (isAiChat) {
            handleSendAiMessage(e);
            return;
        }

        // Otherwise use regular chat functionality
        if (!message.trim() || !selectedConversation || !socketRef.current) return;

        // Get the receiver ID (the other participant who is not current user)
        const receiver = selectedConversation.participants.find(p => p._id !== currentUser?._id);

        if (!receiver) return;

        // Generate a temporary ID for this message
        const tempId = Date.now().toString();

        // Track this message ID so we can avoid duplication when it comes back
        sentMessagesRef.current.add(tempId);

        // Emit message through socket
        socketRef.current.emit('send_message', {
            conversationId: selectedConversation._id,
            receiverId: receiver._id,
            content: message.trim(),
            tempId // Send the temp ID to help match the message
        });

        // Optimistically add message to UI
        const optimisticMessage: Message = {
            _id: tempId,
            senderId: currentUser?._id || '',
            receiverId: receiver._id,
            content: message.trim(),
            timestamp: new Date(),
            read: false
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessage('');
    };

    // Get the other user from conversation (not current user)
    const getOtherUser = (conversation: Conversation): User | undefined => {
        if (isAiChat && conversation.participants.some(p => p._id === 'ai')) {
            return AI_ASSISTANT;
        }
        return conversation.participants.find(user => user._id !== currentUser?._id);
    };

    const filteredConversations = conversations.filter(convo => {
        const otherUser = getOtherUser(convo);
        return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const navigateToAiChat = () => {
        window.location.href = '/patient/messages?conversation=ai';
    };

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
                    <p className="text-gray-600 mt-1">Communicate with your healthcare providers</p>
                </div>
                <button
                    onClick={navigateToAiChat}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                    <Bot className="h-5 w-5" />
                    Chat with AI
                </button>
            </div>

            <Card className="h-[calc(100vh-12rem)]">
                <div className="flex h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-80 border-r border-gray-100"
                    >
                        <div className="p-4">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Search conversations..."
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="overflow-y-auto h-[calc(100%-5rem)]">
                            {isAiChat && (
                                <button
                                    className="w-full p-4 flex items-center bg-primary-50 hover:bg-primary-100 transition relative"
                                    onClick={navigateToAiChat}
                                >
                                    <Avatar
                                        user={AI_ASSISTANT}
                                        size="md"
                                        className="mr-3"
                                    />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium text-gray-800 truncate">Health AI Assistant</h3>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-500 truncate">
                                                Virtual healthcare assistant
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {loading && conversations.length === 0 ? (
                                <div className="flex justify-center items-center h-32">
                                    <Loader className="h-6 w-6 text-primary-500 animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="p-4 text-center text-error-600">
                                    <p>{error}</p>
                                    <button
                                        className="mt-2 text-primary-500 hover:underline"
                                        onClick={fetchConversations}
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : filteredConversations.length === 0 && !isAiChat ? (
                                <div className="p-4 text-center text-gray-500">
                                    {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                                </div>
                            ) : (
                                filteredConversations.map(conversation => {
                                    const otherUser = getOtherUser(conversation);
                                    if (!otherUser) return null;

                                    return (
                                        <button
                                            key={conversation._id}
                                            className={`w-full p-4 flex items-center hover:bg-gray-50 transition relative ${(!isAiChat && selectedConversation?._id === conversation._id) ? 'bg-primary-50' : ''
                                                }`}
                                            onClick={() => {
                                                setIsAiChat(false);
                                                setSelectedConversation(conversation);
                                                window.history.pushState({}, '', `/patient/messages?conversation=${conversation._id}`);
                                            }}
                                        >
                                            <Avatar
                                                user={otherUser}
                                                size="md"
                                                className="mr-3"
                                            />
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-medium text-gray-800 truncate">{otherUser.name}</h3>
                                                    {conversation.lastMessage && (
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(conversation.lastMessage.timestamp), 'h:mm a')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {conversation.lastMessage ? (
                                                            conversation.lastMessage.senderId === currentUser?._id ?
                                                                `You: ${conversation.lastMessage.content}` :
                                                                conversation.lastMessage.content
                                                        ) : (
                                                            otherUser.specialization || 'New conversation'
                                                        )}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col"
                    >
                        {selectedConversation || isAiChat ? (
                            <>
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center">
                                        <Avatar
                                            user={isAiChat ? AI_ASSISTANT : getOtherUser(selectedConversation!) || {
                                                _id: '',
                                                name: 'Unknown',
                                                email: '',
                                                role: ''
                                            }}
                                            size="md"
                                            className="mr-3"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-800">
                                                {isAiChat ? 'Health AI Assistant' : getOtherUser(selectedConversation!)?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {isAiChat ? 'Virtual healthcare assistant' : getOtherUser(selectedConversation!)?.specialization || ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <p>{isAiChat ?
                                                'Ask any health-related questions you may have.' :
                                                'No messages yet. Start the conversation!'}
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div
                                                key={msg._id}
                                                className={`flex mb-4 ${msg.senderId === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${msg.senderId === currentUser?._id
                                                        ? 'bg-primary-500 text-white'
                                                        : isAiChat && msg.senderId === 'ai'
                                                            ? 'bg-secondary-100 text-gray-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className="text-xs mt-1 opacity-70">
                                                        {format(new Date(msg.timestamp), 'h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                                    <div className="flex items-center">
                                        {!isAiChat && (
                                            <button
                                                type="button"
                                                className="p-2 hover:bg-gray-100 rounded-full transition"
                                            >
                                                <Paperclip className="h-5 w-5 text-gray-500" />
                                            </button>
                                        )}
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={isAiChat ? "Ask the AI assistant..." : "Type your message..."}
                                            className="flex-1 mx-2 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                                        />
                                        <button
                                            type="submit"
                                            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition disabled:opacity-50"
                                            disabled={!message.trim()}
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <p className="mb-4">Select a conversation to start messaging</p>
                                    {conversations.length === 0 && !loading && (
                                        <div className="flex flex-col gap-3">
                                            <button
                                                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition"
                                                onClick={() => window.location.href = '/patient/find-doctors'}
                                            >
                                                Find doctors to message
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-secondary-500 text-white rounded hover:bg-secondary-600 transition flex items-center justify-center gap-2"
                                                onClick={navigateToAiChat}
                                            >
                                                <Bot className="h-5 w-5" />
                                                Chat with AI assistant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </Card>
        </PageLayout>
    );
};