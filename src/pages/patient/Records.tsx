import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Download,
  Eye,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../auth/AuthContext";
import { format } from "date-fns";

// Define record type interface
interface MedicalRecord {
  _id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  title: string;
  description: string;
  type: string;
  fileUrl?: string;
}

// Define doctor type interface
interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
  profileImageUrl?: string;
}

export const Records = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New record state
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
    patientId: currentUser?._id || "",
    date: new Date(),
    title: "",
    description: "",
    type: "lab_report",
    doctorId: "",
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Doctor-related states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Record deletion states
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch medical records when component mounts
  useEffect(() => {
    fetchRecords();
    fetchDoctors();
  }, [currentUser]);

  // Fetch records from API
  const fetchRecords = async () => {
    if (!currentUser?._id) return;

    setLoading(true);
    setError("");

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${backendUrl}/medical-records/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch medical records");
      }

      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("Failed to load medical records. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors from API
  const fetchDoctors = async () => {
    setLoadingDoctors(true);

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${backendUrl}/users?role=doctor`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const { users } = await response.json();
      setDoctors(users);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDropdown(false);
    setNewRecord((prev) => ({
      ...prev,
      doctorId: doctor._id,
    }));
  };

  // Handle record deletion
  const handleDeleteRecord = async (recordId: string) => {
    setDeleting(true);
    setError("");

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${backendUrl}/medical-records/${recordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      // Remove record from the state
      setRecords((prev) => prev.filter((record) => record._id !== recordId));
    } catch (error: any) {
      console.error("Error deleting record:", error);
      setError(error.message || "Failed to delete record. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
      (doctor.specialization &&
        doctor.specialization
          .toLowerCase()
          .includes(doctorSearchTerm.toLowerCase()))
  );

  if (!currentUser) return null;

  // Record types for dropdown
  const recordTypes = [
    { value: "lab_report", label: "Lab Report" },
    { value: "prescription", label: "Prescription" },
    { value: "imaging", label: "Imaging" },
    { value: "discharge_summary", label: "Discharge Summary" },
    { value: "vaccination", label: "Vaccination Record" },
    { value: "medical_certificate", label: "Medical Certificate" },
    { value: "other", label: "Other" },
  ];

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError("");

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      // If there's a file, handle it separately
      let fileUrl = undefined;
      if (selectedFile) {
        // Create form data just for the file upload
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);

        // Upload the file first
        const fileUploadResponse = await fetch(`${backendUrl}/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fileFormData,
        });

        if (!fileUploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const fileData = await fileUploadResponse.json();
        fileUrl = fileData.url; // Assuming the server returns the file URL
      }

      // Prepare record data as JSON
      const recordData = {
        ...newRecord,
        date:
          newRecord.date instanceof Date
            ? newRecord.date.toISOString()
            : new Date().toISOString(),
        fileUrl: fileUrl,
      };

      // Send JSON data to backend
      const response = await fetch(`${backendUrl}/medical-records`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload record");
      }

      const data = await response.json();
      console.log("Record uploaded:", data);

      // Close modal and reset form after successful upload
      setIsModalOpen(false);
      setNewRecord({
        patientId: currentUser?._id || "",
        date: new Date(),
        title: "",
        description: "",
        type: "lab_report",
        doctorId: "",
      });
      setSelectedFile(null);
      setSelectedDoctor(null);

      // Refetch records to show the new one
      fetchRecords();
    } catch (error: any) {
      console.error("Error uploading record:", error);
      setError(error.message || "Failed to upload record. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter records based on search term
  const filteredRecords = records.filter(
    (record) =>
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medical Records</h1>
          <p className="text-gray-600 mt-1">
            View and manage your medical records
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
          <p className="text-error-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">
            No medical records found
          </h3>
          <p className="text-gray-500 mt-2">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "Upload your first medical record to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRecords.map((record) => (
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
                          <h3 className="font-medium text-gray-800">
                            {record.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {record.fileUrl && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(record.fileUrl, "_blank")
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = record.fileUrl!;
                                  a.download = record.title;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-500 hover:text-error-700 hover:bg-error-50"
                            onClick={() => {
                              setRecordToDelete(record._id);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          {record.description}
                        </p>
                      </div>
                      <div className="mt-4">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                          {record.type
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Upload Medical Record
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title*
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={newRecord.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Blood Test Results"
                    required
                    fullWidth
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newRecord.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the document"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date*
                    </label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={
                        newRecord.date instanceof Date
                          ? format(newRecord.date, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : new Date();
                        setNewRecord((prev) => ({
                          ...prev,
                          date,
                        }));
                      }}
                      required
                      fullWidth
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Record Type*
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={newRecord.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {recordTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label
                    htmlFor="doctorId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Associated Doctor*
                  </label>
                  <div className="relative">
                    <Input
                      id="doctorSearch"
                      value={selectedDoctor?.name || doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      onFocus={() => setShowDoctorDropdown(true)}
                      placeholder="Search for a doctor..."
                      fullWidth
                      required
                      className={selectedDoctor ? "border-primary-500" : ""}
                    />

                    {selectedDoctor && (
                      <div className="absolute right-3 top-2.5 flex items-center">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full mr-1">
                          Selected
                        </span>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            setSelectedDoctor(null);
                            setDoctorSearchTerm("");
                            setNewRecord((prev) => ({
                              ...prev,
                              doctorId: "",
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {showDoctorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                        {loadingDoctors ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                            <span className="ml-2">Loading doctors...</span>
                          </div>
                        ) : filteredDoctors.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No doctors found
                          </div>
                        ) : (
                          <ul>
                            {filteredDoctors.map((doctor) => (
                              <li
                                key={doctor._id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
                                onClick={() => handleDoctorSelect(doctor)}
                              >
                                {doctor.profileImageUrl ? (
                                  <img
                                    src={doctor.profileImageUrl}
                                    alt={doctor.name}
                                    className="w-8 h-8 rounded-full mr-3"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3">
                                    {doctor.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {doctor.name}
                                  </div>
                                  {doctor.specialization && (
                                    <div className="text-xs text-gray-500">
                                      {doctor.specialization}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="p-2 border-t border-gray-100">
                          <button
                            type="button"
                            className="w-full text-xs text-gray-500 hover:text-gray-700 text-center p-2"
                            onClick={() => setShowDoctorDropdown(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedDoctor && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md flex items-center">
                      {selectedDoctor.profileImageUrl ? (
                        <img
                          src={selectedDoctor.profileImageUrl}
                          alt={selectedDoctor.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3">
                          {selectedDoctor.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{selectedDoctor.name}</div>
                        {selectedDoctor.specialization && (
                          <div className="text-xs text-gray-500">
                            {selectedDoctor.specialization}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="file"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Upload File (optional)
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      {selectedFile ? selectedFile.name : "Choose file"}
                      <input
                        type="file"
                        id="file"
                        name="file"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, JPG, or PNG files. Max size 10MB.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !selectedDoctor}>
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>Upload Record</>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Confirm Deletion
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this medical record? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRecordToDelete(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  className="bg-error-500 hover:bg-error-600 text-white"
                  onClick={() =>
                    recordToDelete && handleDeleteRecord(recordToDelete)
                  }
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>Delete</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};
