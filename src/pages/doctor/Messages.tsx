import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Paperclip } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { mockPatients } from '../../../dummyData';
import { format } from 'date-fns';

export const DoctorMessages = () => {
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0]);
  const [message, setMessage] = useState('');

  // Mock messages data
  const mockMessages = [
    {
      id: 1,
      senderId: 'p1',
      receiverId: 'd1',
      content: 'Hello Dr. Johnson, I have a question about my prescription.',
      timestamp: new Date('2025-03-10T10:00:00'),
    },
    {
      id: 2,
      senderId: 'd1',
      receiverId: 'p1',
      content: 'Hi! Of course, what would you like to know?',
      timestamp: new Date('2025-03-10T10:02:00'),
    },
    {
      id: 3,
      senderId: 'p1',
      receiverId: 'd1',
      content: 'Should I take the medication with food or on an empty stomach?',
      timestamp: new Date('2025-03-10T10:03:00'),
    },
    {
      id: 4,
      senderId: 'd1',
      receiverId: 'p1',
      content: 'It\'s best to take this medication with food to avoid any stomach discomfort. Make sure to have it right after your meals.',
      timestamp: new Date('2025-03-10T10:05:00'),
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Handle sending message
    setMessage('');
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-600 mt-1">Communicate with your patients</p>
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
                  placeholder="Search patients..."
                  fullWidth
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-5rem)]">
              {mockPatients.map(patient => (
                <button
                  key={patient.id}
                  className={`w-full p-4 flex items-center hover:bg-gray-50 transition ${
                    selectedPatient.id === patient.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <Avatar user={patient} size="md" className="mr-3" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-800">{patient.name}</h3>
                    <p className="text-sm text-gray-500">
                      {patient.medicalHistory ? `${patient.medicalHistory.slice(0, 30)}...` : 'No history'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Avatar user={selectedPatient} size="md" className="mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedPatient.medicalHistory || 'No medical history'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {mockMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${
                    msg.senderId === 'd1' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === 'd1'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(msg.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
              <div className="flex items-center">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
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
          </motion.div>
        </div>
      </Card>
    </PageLayout>
  );
};