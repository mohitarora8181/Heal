import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Clock,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Avatar } from "../../components/common/Avatar";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export const Payments = () => {
  const [totalPayment, setTotalPayment] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const { currentUser } = useAuth();

  useEffect(() => {
    console.log(
      `${import.meta.env.VITE_BACKEND_URL}/payments/${currentUser?._id}/history`
    );
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/payments/${
            currentUser?._id
          }/history`
        );
        const data = await response.json();

        console.log("Payment History Data:", data);

        setPaymentHistory(data);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };
    fetchPaymentHistory();

    const fetchTotalPayment = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/payments/totalPaidByPatient/${
            currentUser?._id
          }`
        );
        const data = await response.json();
        setTotalPayment(data.totalPaid);
      } catch (error) {
        console.error("Error fetching total payment:", error);
      }
    };
    fetchTotalPayment();
  }, []);

  const stats = {
    totalSpent: totalPayment || 0,
    pendingPayments: 200,
    nextPayment: 150,
    savedCards: 2,
  };

  const paymentMethods = [
    {
      id: "card1",
      type: "visa",
      last4: "4242",
      expiry: "12/25",
      isDefault: true,
    },
    {
      id: "card2",
      type: "mastercard",
      last4: "8888",
      expiry: "09/24",
      isDefault: false,
    },
  ];

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-600 mt-1">
          Manage your payments and billing information
        </p>
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
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Total Spent</h3>
              <p className="text-2xl font-bold text-gray-800">
                ₹{stats.totalSpent}
              </p>
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
                <div className="bg-warning-50 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-warning-500" />
                </div>
                <ArrowDownRight className="h-6 w-6 text-warning-500" />
              </div>
              <h3 className="text-sm text-gray-600">Pending Payments</h3>
              <p className="text-2xl font-bold text-gray-800">
                ₹{stats.pendingPayments}
              </p>
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
                <div className="bg-secondary-100 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-secondary-600" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Next Payment</h3>
              <p className="text-2xl font-bold text-gray-800">
                ₹{stats.nextPayment}
              </p>
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
                <div className="bg-accent-100 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-accent-600" />
                </div>
                <ArrowUpRight className="h-6 w-6 text-success-500" />
              </div>
              <h3 className="text-sm text-gray-600">Saved Cards</h3>
              <p className="text-2xl font-bold text-gray-800">
                {stats.savedCards}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Payment History
              </h2>
              <Button variant="outline" size="sm">
                Download Statement
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Doctor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment: any) => {
                      const doctor = payment.doctorId;
                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {doctor && (
                                <Avatar
                                  user={doctor}
                                  size="sm"
                                  className="mr-2"
                                />
                              )}
                              <span className="font-medium text-gray-800">
                                {doctor?.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">
                              {payment.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">
                              {format(payment.date, "MMM d, yyyy")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-800">
                              ₹{payment.amount}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ₹{payment.status === 'completed'
                                                                    ? 'bg-success-50 text-success-700'
                                                                    : 'bg-warning-50 text-warning-700'
                                                                }`}
                            >
                              {payment.status.charAt(0).toUpperCase() +
                                payment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Payment Methods
              </h2>
              <Button size="sm">Add New</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="p-4 border border-gray-100 rounded-lg hover:border-primary-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-800 capitalize">
                          {method.type}
                        </span>
                      </div>
                      {method.isDefault && (
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      •••• {method.last4} | Expires {method.expiry}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      {!method.isDefault && (
                        <Button variant="outline" size="sm">
                          Set as Default
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
};
