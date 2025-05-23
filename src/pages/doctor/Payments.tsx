import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, IndianRupeeIcon } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';

export const DoctorPayments = () => {
  // Mock payment data
  const mockPayments = [
    {
      id: 'p1',
      patientName: 'John Doe',
      amount: 150,
      date: new Date('2025-03-10'),
      status: 'completed',
      type: 'Consultation',
    },
    {
      id: 'p2',
      patientName: 'Jane Smith',
      amount: 200,
      date: new Date('2025-03-09'),
      status: 'completed',
      type: 'Follow-up',
    },
    {
      id: 'p3',
      patientName: 'Mike Johnson',
      amount: 100,
      date: new Date('2025-03-08'),
      status: 'pending',
      type: 'Consultation',
    },
  ];

  const stats = {
    totalEarnings: 2500,
    monthlyEarnings: 1200,
    pendingPayments: 300,
    completedSessions: 15,
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-600 mt-1">Track your earnings and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <IndianRupeeIcon className="h-6 w-6 text-primary-600" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Total Earnings</h3>
              <p className="text-2xl font-bold text-gray-800">₹{stats.totalEarnings}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-secondary-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-secondary-600" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Monthly Earnings</h3>
              <p className="text-2xl font-bold text-gray-800">₹{stats.monthlyEarnings}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-warning-50 p-3 rounded-full">
                  <IndianRupeeIcon className="h-6 w-6 text-warning-500" />
                </div>
                <ArrowDownRight className="h-6 w-6 text-warning-500" />
              </div>
              <h3 className="text-sm text-gray-600">Pending Payments</h3>
              <p className="text-2xl font-bold text-gray-800">₹{stats.pendingPayments}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-success-50 p-3 rounded-full">
                  <IndianRupeeIcon className="h-6 w-6 text-success-500" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Completed Sessions</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.completedSessions}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
          <Button variant="outline" size="sm">Download Report</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Patient</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockPayments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{payment.patientName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{payment.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {format(payment.date, 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">₹{payment.amount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ₹{
                          payment.status === 'completed'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-warning-50 text-warning-700'
                        }`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};