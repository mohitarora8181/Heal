import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Calendar, MessageCircle } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { mockPatients } from '../../../dummyData';

export const DoctorPatients = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = mockPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                <p className="text-gray-600 mt-1">Manage and view your patient records</p>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map(patient => (
                    <motion.div
                        key={patient.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="h-full">
                            <CardContent className="p-4">
                                <div className="flex items-start">
                                    <Avatar user={patient} size="lg" className="mr-4" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800">{patient.name}</h3>
                                        <p className="text-sm text-gray-500">{patient.email}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Medical History</h4>
                                    <p className="text-sm text-gray-600">
                                        {patient.medicalHistory || 'No medical history recorded'}
                                    </p>
                                </div>

                                {patient.allergies && patient.allergies.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {patient.allergies.map((allergy, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xs bg-error-50 text-error-700 px-2 py-1 rounded-full"
                                                >
                                                    {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="flex items-center justify-center">
                                        <FileText className="h-4 w-4 mr-1" />
                                        Records
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex items-center justify-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        Schedule
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex items-center justify-center">
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        Message
                                    </Button>
                                    <Button variant="primary" size="sm">
                                        View Profile
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </PageLayout>
    );
};