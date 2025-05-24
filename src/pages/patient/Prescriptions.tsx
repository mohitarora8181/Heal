import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Download } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { mockPrescriptions, mockDoctors } from '../../../dummyData';
import { useAuth } from '../../auth/AuthContext';
import { format } from 'date-fns';

export const Prescriptions = () => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) return null;

    const userPrescriptions = mockPrescriptions
        // .filter(prescription =>
        //     prescription.patientId === currentUser._id &&
        //     (prescription.medications.some(med =>
        //         med.name.toLowerCase().includes(searchTerm.toLowerCase())
        //     ))
        // )
        .map(prescription => ({
            ...prescription,
            doctor: mockDoctors.find(d => d._id === prescription.doctorId)
        }));

    return (
        <PageLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
                <p className="text-gray-600 mt-1">View and manage your prescriptions</p>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search prescriptions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                {userPrescriptions.map(({ _id, doctor, date, medications, instructions, refillable, refills }) => (
                    <motion.div
                        key={_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-start">
                                    <div className="bg-primary-50 p-3 rounded-lg mr-4">
                                        <FileText className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-800">Prescription from {doctor?.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </Button>
                                        </div>

                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                                            <div className="space-y-2">
                                                {medications.map((med, index) => (
                                                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex justify-between">
                                                            <h5 className="font-medium text-gray-800">{med.name}</h5>
                                                            <span className="text-sm text-gray-600">{med.dosage}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {med.frequency} • {med.duration}
                                                        </p>
                                                        {med.notes && (
                                                            <p className="text-sm text-gray-500 mt-1">{med.notes}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
                                            <p className="text-sm text-gray-600">{instructions}</p>
                                        </div>

                                        {refillable && (
                                            <div className="mt-4 flex items-center">
                                                <span className="text-sm text-gray-600">
                                                    Refills remaining: {refills}
                                                </span>
                                                {refills && refills > 0 && (
                                                    <Button variant="outline" size="sm" className="ml-4">
                                                        Request Refill
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </PageLayout>
    );
};