import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../components/utils/auth";
import VerificationQRCode from "../components/VerificationQRCode";
import { Toast } from "primereact/toast"
import "./css/verifyAppointment.css"; // ⬅️ Import the CSS

const VerifyAppointment = () => {
  const auth = useAuth();
  const role = auth?.role || null;
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState(null);
  const navigate = useNavigate();
  const toast = React.useRef(null);

  useEffect(() => {
    if (appointmentId) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/api/appointments/qr/${appointmentId}`)
        .then((res) => setAppointment(res.data))
        .catch((err) => console.error(err));
    }
  }, [appointmentId]);

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const updateData = { status };

      if (status === "Confirmed") {
        updateData.confirmedAt = new Date();
        updateData.completedAt = null;
        updateData.rejectedAt = null;
      } else if (status === "Completed") {
        updateData.completedAt = new Date();
        updateData.confirmedAt = null;
        updateData.rejectedAt = null;

        // Append medical_concern to pet's medical_history
        const medicalConcern = appointment.medical_concern;
        const petId = appointment.pet_id; 

        // Update the pet's medical history
        await axios.put(`${process.env.REACT_APP_API_URL}/api/pets/update/${petId}`, {
          medical_history: medicalConcern // Append the medical concern
        });
      } else if (status === "Cancelled") {
        updateData.rejectedAt = new Date();
        updateData.confirmedAt = null;
        updateData.completedAt = null;
      }

      await axios.put(`${process.env.REACT_APP_API_URL}/api/appointments/update/${id}`, updateData);
      showToast("success", "Updated", `Appointment marked as ${status}.`);
      navigate(`/vet-appointments`);
    } catch (error) {
      showToast("error", "Error", "Failed to update appointment status.");
    }
  };

  if (!appointment) {
    return (
      <div className="verify-container">
        <p className="loading-text">Loading appointment details...</p>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <Toast ref={toast} />
      <div className="verify-card">
        <h2 className="verify-title">📅 Verify Appointment</h2>

        <div className="info">
          <p><strong>🐶 Pet:</strong> {appointment.petDetails}</p>
          <p><strong>🐶 Service:</strong> {appointment.service_id.name}</p>
          <p><strong>👤 Owner:</strong> {appointment.ownerName}</p>
          <p><strong>📆 Date:</strong> {appointment.date}</p>
        </div>

        {role === "clinic" ? (
          <div className="button-group">
            <button
              className="verify-button accept"
              onClick={() => updateAppointmentStatus(appointment._id, "In-progress")}
            >
              Start Appointment
            </button>
          </div>
        ) : (
          <p className="note">
            ⚠️ You do not have permission to modify this appointment.
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyAppointment;