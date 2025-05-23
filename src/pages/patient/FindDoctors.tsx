import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Calendar } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { mockDoctors } from '../../../dummyData';

export const FindDoctors = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('all');

    const specializations = Array.from(
        new Set(mockDoctors.map(doctor => doctor.specialization))
    );

    const filteredDoctors = mockDoctors.filter(doctor => {
        const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialization = selectedSpecialization === 'all' ||
            doctor.specialization === selectedSpecialization;
        return matchesSearch && matchesSpecialization;
    });

    return (
        <PageLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Find Doctors</h1>
                <p className="text-gray-600 mt-1">Connect with qualified healthcare professionals</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1"
                >
                    <Card>
                        <CardContent className="p-4">
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-800 mb-2">Search</h3>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Search doctors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        fullWidth
                                    />
                                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-medium text-gray-800 mb-2">Specialization</h3>
                                <div className="space-y-2">
                                    <button
                                        className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedSpecialization === 'all'
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedSpecialization('all')}
                                    >
                                        All Specializations
                                    </button>
                                    {specializations.map(spec => (
                                        <button
                                            key={spec}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedSpecialization === spec
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => setSelectedSpecialization(spec)}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-3"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDoctors.map(doctor => (
                            <motion.div
                                key={doctor.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-start">
                                            <Avatar user={doctor} size="lg" className="mr-4" />
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-800">{doctor.name}</h3>
                                                <p className="text-sm text-gray-500">{doctor.specialization}</p>
                                                <div className="flex items-center mt-1">
                                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-600 ml-1">{doctor.rating}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                <span>Available for Online Consultation</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                <span>Next Available: Today</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {doctor.qualifications.map((qual, index) => (
                                                <div
                                                    key={index}
                                                    className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full inline-block mr-2"
                                                >
                                                    {qual}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex justify-between items-center">
                                            <Button variant="outline" size="sm">
                                                View Profile
                                            </Button>
                                            <Button size="sm">
                                                Book Appointment
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </PageLayout>
    );
};