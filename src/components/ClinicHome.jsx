import { useEffect, useState } from "react";
import { api } from "../services/api";
import AddClinicModal from "./AddClinicModal";
import SearchClinicModal from "./SearchClinicModal";

const ClinicHome = () => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Data state
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    setLoading(true);
    try {
      const data = await api.fetchClinics();
      setClinics(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load clinics. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Add new clinic
  const handleAddClinic = async (clinicData) => {
    try {
      // Map frontend fields to backend fields
      const payload = {
        name: clinicData.name,
        phone: clinicData.phone,
        clinic_code: clinicData.clinicId,
        doctor_name: clinicData.doctorName,
        address: clinicData.address,
        services: clinicData.services
      };
      await api.addClinic(payload);
      loadClinics(); // Refresh list
      setIsAddModalOpen(false);
    } catch (err) {
      alert(`Error adding clinic: ${err.message}`);
    }
  };

  // Handle search results
  const handleSearchResults = (results) => {
    setClinics(results);
    setIsSearchModalOpen(false); // Close modal and show results in table
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="title" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          <h1>Clinic Directory</h1>
          <p className="subtitle">Find clinics details</p>
        </div>

        <div className="controls">
          {/* Search Button */}
          <button
            className="button secondary"
            onClick={() => setIsSearchModalOpen(true)}
          >
            🔍 Search Clinics
          </button>

          {/* Add clinic button */}
          <button
            className="button primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Clinic
          </button>
        </div>
      </header>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Main table */}
      <section className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Clinic ID</th>
                <th>Clinic Name</th>
                <th>Doctor Name</th>
                <th>Clinic Address</th>
                <th>Phone Number</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty">Loading...</td>
                </tr>
              ) : clinics.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty">
                    No clinics found.
                  </td>
                </tr>
              ) : (
                clinics.map((clinic, idx) => (
                  <tr key={`${clinic.id || idx}`}>
                    {/* Backend returns snake_case mostly, but Pydantic Schema might be camelCase if configured? 
                        Let's check ClinicOut. 
                        Wait, ClinicOut is defined in backend. 
                        Usually FastAPI uses JSON which preserves field names unless aliased.
                        ClinicOut matches Pydantic model. 
                        Let's check backend or just handle snake_case.
                        The payload in `add_clinic` uses `clinic_service.add_clinic`.
                        The response model is `ClinicOut`.
                        Let's assume fields match database model or standard Pydantic.
                        I'll try snake_case first (clinic_code, doctor_name) and fallback.
                    */}
                    <td>{clinic.clinic_code || clinic.clinicId || "-"}</td>
                    <td>{clinic.name}</td>
                    <td>{clinic.doctor_name || clinic.doctorName || "-"}</td>
                    <td>{clinic.address || "-"}</td>
                    <td>{clinic.phone}</td>
                    <td className="services-cell">
                      {clinic.services && clinic.services.map((service, serviceIdx) => (
                        <span className="tag" key={serviceIdx}>
                          {typeof service === 'object' ? service.name : service}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Modal */}
      <AddClinicModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClinic}
      />

      {/* Search Modal */}
      <SearchClinicModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onResults={handleSearchResults}
      />
    </div>
  );
};

export default ClinicHome;

