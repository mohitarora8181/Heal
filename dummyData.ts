import type { Patient, Doctor, Appointment, MedicalRecord, Prescription } from './types';

export const mockPatients: Patient[] = [
    {
        _id:'p1',
        name: 'John Doe',
        email: 'patient@example.com',
        role: 'patient',
        profileImageUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        medicalHistory: 'Hypertension, Diabetes Type 2',
        allergies: ['Penicillin', 'Peanuts'],
        medications: [
            {
                _id:'m1',
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'Twice daily',
                startDate: new Date('2023-01-15'),
            },
            {
                _id:'m2',
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'Once daily',
                startDate: new Date('2023-02-20'),
            },
        ],
    },
    {
        _id:'p2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'patient',
        profileImageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        allergies: ['Sulfa drugs'],
        medicalHistory: 'Asthma',
    },
];

export const mockDoctors: Doctor[] = [
    {
        _id:'d1',
        name: 'Dr. Sarah Johnson',
        email: 'doctor@example.com',
        role: 'doctor',
        profileImageUrl: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
        specialization: 'Cardiology',
        qualifications: ['MD', 'Ph.D. in Cardiovascular Medicine'],
        certifications: ['American Board of Internal Medicine', 'Cardiovascular Disease'],
        availability: [
            {
                day: 'monday',
                startTime: '09:00',
                endTime: '17:00',
            },
            {
                day: 'wednesday',
                startTime: '09:00',
                endTime: '17:00',
            },
            {
                day: 'friday',
                startTime: '09:00',
                endTime: '13:00',
            },
        ],
        rating: 4.8,
    },
    {
        _id:'d2',
        name: 'Dr. Michael Chen',
        email: 'michael@example.com',
        role: 'doctor',
        profileImageUrl: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg',
        specialization: 'Neurology',
        qualifications: ['MD', 'Residency in Neurology'],
        certifications: ['American Board of Psychiatry and Neurology'],
        availability: [
            {
                day: 'tuesday',
                startTime: '08:00',
                endTime: '16:00',
            },
            {
                day: 'thursday',
                startTime: '08:00',
                endTime: '16:00',
            },
        ],
        rating: 4.9,
    },
];

export const mockAppointments: Appointment[] = [
    {
        _id:'a1',
        patientId: 'p1',
        doctorId: 'd1',
        date: new Date('2025-06-20T10:00:00'),
        duration: 30,
        status: 'scheduled',
        type: 'video',
    },
    {
        _id:'a2',
        patientId: 'p1',
        doctorId: 'd2',
        date: new Date('2025-06-25T14:30:00'),
        duration: 45,
        status: 'scheduled',
        type: 'audio',
        isUrgent: true,
    },
    {
        _id:'a3',
        patientId: 'p2',
        doctorId: 'd1',
        date: new Date('2025-05-15T11:00:00'),
        duration: 30,
        status: 'completed',
        type: 'video',
        notes: 'Follow-up required in 2 weeks',
    },
];

export const mockMedicalRecords: MedicalRecord[] = [
    {
        _id:'mr1',
        patientId: 'p1',
        doctorId: 'd1',
        date: new Date('2025-05-10'),
        title: 'Blood Test Results',
        description: 'Comprehensive metabolic panel shows elevated glucose levels.',
        type: 'lab_report',
    },
    {
        _id:'mr2',
        patientId: 'p1',
        doctorId: 'd2',
        date: new Date('2025-04-22'),
        title: 'Brain MRI',
        description: 'No significant abnormalities detected.',
        type: 'scan',
    },
];

export const mockPrescriptions: Prescription[] = [
    {
        _id:'pr1',
        patientId: 'p1',
        doctorId: 'd1',
        date: new Date('2025-05-10'),
        medications: [
            {
                name: 'Atorvastatin',
                dosage: '20mg',
                frequency: 'Once daily at bedtime',
                duration: '30 days',
            },
        ],
        instructions: 'Take with water. Avoid grapefruit juice.',
        refillable: true,
        refills: 2,
    },
    {
        _id:'pr2',
        patientId: 'p2',
        doctorId: 'd2',
        date: new Date('2025-05-05'),
        medications: [
            {
                name: 'Albuterol',
                dosage: '90mcg',
                frequency: 'As needed for shortness of breath',
                duration: 'Ongoing',
            },
        ],
        instructions: 'Use inhaler 15-30 minutes before exercise if needed.',
        refillable: true,
        refills: 5,
    },
];