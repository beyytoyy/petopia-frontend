import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext"; 
import { FilterIcon, SearchIcon } from 'lucide-react';
import { Dropdown } from "primereact/dropdown";
import { useAuth } from "./utils/auth";
import axios from "axios";
import "../components/css/vetPatients.css";

const PatientManagement = () => {
  const { role, clinicId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [toast] = useState(React.createRef());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPetType, setSelectedPetType] = useState(null);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    ownerName: "",
    petName: "",
    petType: "",
    services: "",
    date: null,
    medicalConcern: [],
  });
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceOptions, setServiceOptions] = useState([]); 
  const petTypeOptions = [
    { label: "Dog", value: "Dog" },
    { label: "Cat", value: "Cat" },
    { label: "Bird", value: "Bird" },
    { label: "Fish", value: "Fish" },
    { label: "Rabbit", value: "Rabbit" },
    { label: "Hamster", value: "Hamster" },
    { label: "Guinea Pig", value: "Guinea Pig" },
    { label: "Reptile", value: "Reptile" },
    { label: "Ferret", value: "Ferret" },
    { label: "Turtle", value: "Turtle" },
    { label: "Horse", value: "Horse" },
    { label: "Other", value: "Other" },
  ];

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [clinicId, role]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, selectedPetType]);

  const fetchAppointments = async () => {
    if (role !== "admin" && !clinicId) {
      console.warn("❌ clinicId is null, skipping API call.");
      return;
    }
  
    try {
      const url =
        role === "admin"
          ? `${process.env.REACT_APP_API_URL}/api/appointments/`
          : `${process.env.REACT_APP_API_URL}/api/appointments/clinics/${clinicId}`;
  
      const response = await axios.get(url);
      const filteredAppointments = response.data.filter(
        (appointment) => appointment.status === "Completed"
      );

      const uniquePets = new Set();
      const uniqueAppointments = filteredAppointments.filter((appointment) => {
        const petId = appointment.pet_id._id;
        if (!uniquePets.has(petId)) {
          uniquePets.add(petId);
          return true;
        }
        return false;
      });
  
      setAppointments(uniqueAppointments);
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch appointments.",
      });
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
  
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((appt) => {
        const petName = appt.petDetails?.toLowerCase() || "";
        const ownerName = appt.ownerName?.toLowerCase() || "";
        return (
          petName.includes(lowercasedSearchTerm) ||
          ownerName.includes(lowercasedSearchTerm)
        );
      });
    }
  
    if (selectedPetType) {
      filtered = filtered.filter(
        (appt) => appt.pet_id?.type === selectedPetType
      );
    }
  
    setFilteredAppointments(filtered);
  };

  const fetchServices = async () => {
    try {
      const url =
        role === "admin"
          ? `${process.env.REACT_APP_API_URL}/api/services`
          : `${process.env.REACT_APP_API_URL}/api/services/clinic/${clinicId}`;
  
      const response = await axios.get(url);
      const services = response.data;
  
      const formattedServices = services.map(service => ({
        label: service.name,
        value: service._id // Use the ObjectId here
      }));
  
      setServiceOptions(formattedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch services",
      });
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedOwnerId || !selectedPetId || !selectedServiceId || !newAppointment.date) {
        alert("Please fill out all required fields.");
        return;
    }

    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/appointments/clinic-book`, {
            owner_id: selectedOwnerId._id || selectedOwnerId,
            pet_id: selectedPetId,
            clinic_id: clinicId,
            service_id: selectedServiceId,
            date: newAppointment.date.toISOString(),
            status: "Confirmed",
            medical_concern: newAppointment.medicalConcern, // Ensure this is set correctly
        });

        setAppointments([...appointments, response.data.appointment]);
        setIsAddDialogVisible(false);
        setNewAppointment({
            ownerName: "",
            petName: "",
            petType: "",
            services: "",
            date: null,
            medicalConcern: [], // Reset this field
        });
        setSelectedOwnerId(null);
        setSelectedPetId(null);
        setSelectedServiceId(null);
    } catch (error) {
        console.error("Error adding appointment:", error);
        alert("Error adding appointment. Please try again.");
    }
};

  const actionAppointmentTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button 
          icon="pi pi-calendar" 
          onClick={() => {
            setSelectedOwnerId(rowData.owner_id);
            setSelectedPetId(rowData.pet_id);
            setIsAddDialogVisible(true);
          }} 
          style={{border: "none", color: "white", backgroundColor: "#14976f"}}
        />
      </div>
    );
  };

  const medicalHistoryTemplate = (rowData) => {
    const medicalHistory = rowData.pet_id?.medical_history; // Access the medical history
    return (
      <span>
        {Array.isArray(medicalHistory) && medicalHistory.length > 0
          ? medicalHistory.join(', ') 
          : 'No medical history'} 
      </span>
    );
  };

  return (
    <div className="vet-appointments-container">
      <Toast ref={toast} position="bottom-right" />

      <div className="patients-label">
          <h1 className="services-title font-bold" style={{ fontSize: "20px", marginBottom: "0px" }}>
              Patient Management
          </h1>
      </div>
      <span className="datatable-line"></span>

      <div className="flex-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
        <div style={{ position: "relative", flexGrow: 1, minWidth: "250px" }}>
          <SearchIcon size={20} style={{ 
              position: "absolute", 
              top: "40%", 
              left: "10px", 
              transform: "translateY(-50%)", 
              color: "#6c757d" 
          }} />
          <InputText
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Owner or Pet Name"
            style={{ 
                width: "100%", 
                paddingLeft: "3.5rem", 
                maxWidth: "400px"
            }}
          />
        </div>

        <div className="filter-group">
          <div style={{ display: "flex", alignItems: "center" }}>
            <FilterIcon size={24} />
          </div>

          <div style={{ position: "relative", flexGrow: 1 }}>
            <Dropdown
              value={selectedPetType}
              options={petTypeOptions}
              onChange={(e) => setSelectedPetType(e.value)}
              placeholder="Filter by Pet Type"
              className="p-inputtext-sm"
              showClear
              style={{
                height: "45px", 
                padding: "0 10px", 
                fontSize: "14px",
                minWidth: "150px", 
                marginBottom: "10px"
              }}
            />
          </div>
        </div>
      </div>

      <DataTable value={filteredAppointments} className="datatable" paginator rows={20}>
        <Column field="ownerName" header="Owner Name" />
        <Column field="pet_id.name" header="Pet Name" />
        <Column field="pet_id.type" header="Pet Type"/>
        <Column field="pet_id.breed" header="Pet Breed" />
        <Column header="Medical History" body={medicalHistoryTemplate} />
        <Column header="Actions" body={actionAppointmentTemplate} />
      </DataTable>

      <Dialog
        visible={isAddDialogVisible}
        header="Add Appointment"
        onHide={() => setIsAddDialogVisible(false)}
        className="p-fluid edit-appointment-dialog"
        style={{ width: "400px" }}
      >
        <div className="p-field">
          <label>Owner</label>
          <InputText value={`${selectedOwnerId?.firstname || ''} ${selectedOwnerId?.lastname || ''}`.trim()} readOnly className="w-full"/>
        </div>
        <div className="p-field">
          <label>Pet</label>
          <InputText value={selectedPetId?.name || ''} readOnly className="w-full"/>
        </div>
        <div className="p-field">
            <label>Medical Concerns</label>
            <InputText 
                value={newAppointment.medicalConcern.join(', ')} // Join array for display
                onChange={(e) => setNewAppointment({ 
                    ...newAppointment, 
                    medicalConcern: e.target.value.split(',').map(item => item.trim()) // Split input into array
                })} 
                placeholder="Enter medical concern"
                className="w-full"
            />
        </div>
        <div className="p-field">
          <label>Service</label>
          <Dropdown 
            value={selectedServiceId} 
            options={serviceOptions} 
            onChange={(e) => setSelectedServiceId(e.value)} 
            placeholder="Select a Service" 
            className="w-full"
          />
        </div>
        <div className="p-field">
          <label>Date</label>
          <InputText 
            type="date" 
            value={newAppointment.date ? newAppointment.date.toISOString().split('T')[0] : ''} 
            onChange={(e) => setNewAppointment({ ...newAppointment, date: new Date(e.target.value) })} 
            className="w-full"
          />
        </div>
        <Button label="Add Appointment" className="addapp-button" onClick={handleAddAppointment} /> 
      </Dialog>
    </div>
  );
};

export default PatientManagement;