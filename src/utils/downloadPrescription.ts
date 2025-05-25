import { format } from "date-fns";
//@ts-ignore
import html2pdf from "html2pdf.js";

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

export const handleDownloadPrescription = async (prescription: Prescription) => {
    try {
        const element = document.createElement('div');
        element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center; color: #2980b9;">Medical Prescription</h1>
          <hr style="margin: 20px 0;"/>
          
          <div style="margin-bottom: 20px;">
            <h2>Dr. ${prescription.doctorId.name}</h2>
            ${prescription.doctorId.email ? `<p>Email: ${prescription.doctorId.email}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>Patient: ${prescription.patientId.name}</h3>
            <p>Email: ${prescription.patientId.email}</p>
            <p>Prescription Date: ${format(new Date(prescription.date), "MMMM d, yyyy")}</p>
          </div>
          
          <hr style="margin: 20px 0;"/>
          
          <h3>Medications</h3>
          <hr style="margin: 10px 0;"/>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #2980b9; color: white;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">Medication</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">Dosage</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">Frequency</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">Duration</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.medications.map(med => `
                <tr style="background-color: ${prescription.medications.indexOf(med) % 2 === 0 ? '#f5f5f5' : 'white'};">
                  <td style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">${med.name}</td>
                  <td style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">${med.dosage}</td>
                  <td style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">${med.frequency}</td>
                  <td style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">${med.duration}</td>
                  <td style="padding: 8px; text-align: left; border: 1px solid #ddd; vertical-align: middle;">${med.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px;">
            <h3>Instructions</h3>
            <p>${prescription.instructions}</p>
          </div>
          
          ${prescription.refillable ? `
            <div style="margin-top: 20px;">
              <h3>Refill Information</h3>
              <p>This prescription is refillable. Refills remaining: ${prescription.refills}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 40px;">
            <hr style="width: 200px; margin-left: 0;"/>
            <p>Doctor's Signature</p>
          </div>
          
          <div style="margin-top: 40px; font-size: 12px;">
            <p>Generated on ${format(new Date(), "MMMM d, yyyy, h:mm a")}</p>
          </div>
        </div>
      `;

        // Generate and download PDF
        html2pdf().from(element).save(`Prescription-${prescription._id}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to download the prescription. Please try again.");
    }
};