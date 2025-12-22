import { useEffect, useState } from "react";

// Initial form state
const initialForm = {
  clinicId: "",
  name: "",
  doctorName: "",
  address: "",
  services: [] // Changed to array for dynamic inputs
};

const AddClinicModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Reset form each time the modal opens
  // Reset form each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ ...initialForm, services: [{ name: "", phone: "" }] }); // Start with one empty service
      setErrors({});
    }
  }, [isOpen]);

  // Handle main input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle service input changes
  const handleServiceChange = (index, field, value) => {
    const newServices = [...form.services];
    newServices[index][field] = value;
    setForm((prev) => ({ ...prev, services: newServices }));
  };

  // Add new service row
  const addService = () => {
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", phone: "" }],
    }));
  };

  // Remove service row
  const removeService = (index) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = {
      clinicId: form.clinicId.trim(),
      name: form.name.trim(),
      doctorName: form.doctorName.trim(),
      address: form.address.trim(),
      // Filter out empty services
      services: form.services
        .map(s => ({ name: s.name.trim(), phone: s.phone.trim() }))
        .filter(s => s.name || s.phone),
    };

    // Simple validation
    const nextErrors = {};
    if (!trimmed.clinicId) nextErrors.clinicId = "Clinic ID is required";
    if (!trimmed.name) nextErrors.name = "Clinic name is required";
    if (!trimmed.doctorName) nextErrors.doctorName = "Doctor name is required";
    if (!trimmed.address) nextErrors.address = "Clinic address is required";



    if (trimmed.services.length === 0)
      nextErrors.services = "At least one service is required";

    // Phone validation regex
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    // Check for incomplete services
    const incompleteService = trimmed.services.some(s => !s.name || !s.phone);
    if (incompleteService && trimmed.services.length > 0) {
      nextErrors.services = "All added services must have both name and phone";
    }

    // Check for valid service phone numbers
    const invalidServicePhone = trimmed.services.some(s => s.phone && !phoneRegex.test(s.phone));
    if (invalidServicePhone && !nextErrors.services) {
      nextErrors.services = "All service phone numbers must be valid (min 10 digits)";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;



    // Pass data to parent
    onSubmit(trimmed);
    onClose();
  };

  // Do not render if closed
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add Clinic</h2>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Clinic ID */}
          <label className="label">
            Clinic ID
            <input
              type="text"
              name="clinicId"
              className={`input ${errors.clinicId ? "input-error" : ""}`}
              placeholder="e.g., CLIN-001"
              value={form.clinicId}
              onChange={handleChange}
            />
            {errors.clinicId && <span className="error">{errors.clinicId}</span>}
          </label>

          {/* Clinic Name */}
          <label className="label">
            Clinic Name
            <input
              type="text"
              name="name"
              className={`input ${errors.name ? "input-error" : ""}`}
              placeholder="e.g., Downtown Health Clinic"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </label>

          {/* Doctor Name */}
          <label className="label">
            Doctor Name
            <input
              type="text"
              name="doctorName"
              className={`input ${errors.doctorName ? "input-error" : ""}`}
              placeholder="e.g., Dr. John Smith"
              value={form.doctorName}
              onChange={handleChange}
            />
            {errors.doctorName && <span className="error">{errors.doctorName}</span>}
          </label>

          {/* Clinic Address */}
          <label className="label">
            Clinic Address
            <input
              type="text"
              name="address"
              className={`input ${errors.address ? "input-error" : ""}`}
              placeholder="e.g., 123 Main St, City, State 12345"
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && <span className="error">{errors.address}</span>}
          </label>



          {/* Services Dynamic List */}
          <div className="label">
            Services
            {form.services.map((service, index) => (
              <div key={index} className="service-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Service Name"
                  className={`input ${errors.services ? "input-error" : ""}`}
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Service Phone"
                  className={`input ${errors.services ? "input-error" : ""}`}
                  value={service.phone}
                  onChange={(e) => handleServiceChange(index, "phone", e.target.value)}
                  style={{ flex: 1 }}
                />
                {form.services.length > 1 && (
                  <button type="button" className="button secondary button-sm" onClick={() => removeService(index)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="button secondary button-sm" onClick={addService} style={{ marginTop: '4px' }}>
              + Add Service
            </button>
            {errors.services && <span className="error" style={{ display: 'block', marginTop: '4px' }}>{errors.services}</span>}
          </div>

          <button type="submit" className="button primary full">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClinicModal;

