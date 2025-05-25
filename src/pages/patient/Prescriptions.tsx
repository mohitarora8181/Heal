import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Download } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../auth/AuthContext";
import { format } from "date-fns";
import { handleDownloadPrescription } from "../../utils/downloadPrescription";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
    email?: string;
  };
  medications: Medication[];
  instructions: string;
  date: Date;
  refillable: boolean;
  refills: number;
}

export const Prescriptions = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, [currentUser]);

  const fetchPrescriptions = async () => {
    if (!currentUser?._id) return;

    setLoading(true);
    setError("");

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${backendUrl}/prescriptions?userRole=patient&userId=${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }

      const data = await response.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setError("Failed to load prescriptions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };



  const filteredPrescriptions = prescriptions.filter((p) =>
    p.medications.some((med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
          <p className="text-error-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No prescriptions found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "You don't have any prescriptions yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPrescriptions.map((prescription) => (
            <motion.div
              key={prescription._id}
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
                          <h3 className="font-medium text-gray-800">
                            Prescription from Dr. {prescription.doctorId?.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(prescription.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPrescription(prescription)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Medications
                        </h4>
                        <div className="space-y-2">
                          {prescription.medications.map((med, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex justify-between">
                                <h5 className="font-medium text-gray-800">
                                  {med.name}
                                </h5>
                                <span className="text-sm text-gray-600">
                                  {med.dosage}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {med.frequency} • {med.duration}
                              </p>
                              {med.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {med.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </h4>
                        <p className="text-sm text-gray-600">{prescription.instructions}</p>
                      </div>

                      {prescription.refillable && (
                        <div className="mt-4 flex items-center">
                          <span className="text-sm text-gray-600">
                            Refills remaining: {prescription.refills}
                          </span>
                          {prescription.refills > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-4"
                            >
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
      )}
    </PageLayout>
  );
};
