import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Download, Eye, Upload } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { mockMedicalRecords } from '../../../dummyData';
import { useAuth } from '../../auth/AuthContext';
import { format } from 'date-fns';

export const Records = () => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) return null;

    // const userRecords = mockMedicalRecords.filter(record =>
    //     record.patientId === currentUser._id &&
    //     (record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         record.description.toLowerCase().includes(searchTerm.toLowerCase()))
    // );

    const userRecords = mockMedicalRecords

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Medical Records</h1>
                    <p className="text-gray-600 mt-1">View and manage your medical records</p>
                </div>
                <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Record
                </Button>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                {userRecords.map(record => (
                    <motion.div
                        key={record._id}
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
                                                <h3 className="font-medium text-gray-800">{record.title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(record.date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600">{record.description}</p>
                                        </div>
                                        <div className="mt-4">
                                            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                                                {record.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                            </span>
                                        </div>
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