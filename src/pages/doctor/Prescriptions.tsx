import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Download, Plus } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { mockPrescriptions, mockPatients } from '../../../dummyData';
import { format } from 'date-fns';

export const DoctorPrescriptions = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const prescriptions = mockPrescriptions.map(prescription => ({
        ...prescription,
        patient: mockPatients.find(p => p.id === prescription.patientId)
    }));

    const filteredPrescriptions = prescriptions.filter(prescription =>
        prescription.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medications.some(med =>
            med.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
                    <p className="text-gray-600 mt-1">Manage and issue patient prescriptions</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                </Button>
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
                {filteredPrescriptions.map(({ id, patient, date, medications, instructions, refillable, refills }) => (
                    <motion.div
                        key={id}
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
                                            <div className="flex items-center">
                                                {patient && <Avatar user={patient} size="sm" className="mr-2" />}
                                                <div>
                                                    <h3 className="font-medium text-gray-800">{patient?.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {format(new Date(date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                                <Button variant="primary" size="sm">
                                                    Edit
                                                </Button>
                                            </div>
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