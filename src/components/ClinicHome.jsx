import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import AddClinicModal from "./AddClinicModal";
import SearchClinicModal from "./SearchClinicModal";

const initialFilters = {
  clinicId: "",
  clinicName: "",
  doctorName: "",
  address: "",
  phone: "",
  services: "",
};

const formatPhoneNumber = (value) => {
  if (!value) return value;
  let phoneNumber = value.toString().replace(/[^\d]/g, "");

  // Normalize 11 digit numbers starting with 1 to 10 digits
  if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
    phoneNumber = phoneNumber.slice(1);
  }

  const len = phoneNumber.length;
  if (len < 4) return `+1 ${phoneNumber}`;
  if (len < 7) {
    return `+1 (${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `+1 (${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
};

const ClinicHome = () => {

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Data state
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search + filters UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [openFilterKey, setOpenFilterKey] = useState(null); // which filter pill dropdown is open

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

  // Inline search submit (server-side search, keeps existing behavior)
  // Instant search: Filter client-side based on searchTerm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // No-op or just prevent reload, since filtering happens in render
  };

  const buildSearchSummary = (f) => {
    const parts = [];
    if (f.clinicId) parts.push(`Clinic ID: ${f.clinicId}`);
    if (f.clinicName) parts.push(`Clinic Name: ${f.clinicName}`);
    if (f.doctorName) parts.push(`Doctor Name: ${f.doctorName}`);
    if (f.address) parts.push(`Clinic Address: ${f.address}`);
    if (f.phone) parts.push(`Phone: ${f.phone}`);
    if (f.services) parts.push(`Services: ${f.services}`);
    return parts.join("; ");
  };

  // Filter helpers (purely client‑side on current clinic list)
  const setFilterValue = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Do NOT update searchTerm with summary, as it interferes with global filtering
      return next;
    });
  };

  const clearFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: "" };
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    setSearchTerm("");
    setOpenFilterKey(null);
    loadClinics();
  };

  // Flatten clinics: if a clinic has multiple services, create a row for each service.
  // This allows displaying the specific service phone in the Phone column.
  const processedClinics = useMemo(() => {
    const flatList = [];
    clinics.forEach(clinic => {
      const servicesArray = clinic.services || [];
      if (servicesArray.length > 0) {
        servicesArray.forEach((service, idx) => {
          let sName = service;
          let sPhone = clinic.phone; // default fallback

          if (typeof service === 'object') {
            sName = service.name;
            if (service.phone) sPhone = service.phone;
          }

          flatList.push({
            ...clinic,
            uniqueKey: `${clinic.clinic_code || clinic.clinicId || 'unknown'}_svc_${idx}`,
            displayService: sName,
            displayPhone: sPhone
          });
        });
      } else {
        // No services, just show clinic row
        flatList.push({
          ...clinic,
          uniqueKey: `${clinic.clinic_code || clinic.clinicId || 'unknown'}_nosvc`,
          displayService: "-",
          displayPhone: clinic.phone || "-"
        });
      }
    });
    return flatList;
  }, [clinics]);

  const visibleClinics = useMemo(() => {
    const f = filters;
    const term = searchTerm.trim().toLowerCase();

    return processedClinics.filter((row) => {
      const clinicId = (row.clinic_code || row.clinicId || "").toString().toLowerCase();
      const name = (row.name || "").toLowerCase();
      const doctor = (row.doctor_name || row.doctorName || "").toLowerCase();
      const address = (row.address || "").toLowerCase();

      // Use the specific phone for this row (likely service phone)
      const phone = (row.displayPhone || "").toLowerCase();
      const serviceText = (row.displayService || "").toLowerCase();

      const termDigits = term.replace(/\D/g, "");
      const phoneDigits = phone.replace(/\D/g, "");

      if (f.clinicId && !clinicId.includes(f.clinicId.toLowerCase())) return false;
      if (f.clinicName && !name.includes(f.clinicName.toLowerCase())) return false;
      if (f.doctorName && !doctor.includes(f.doctorName.toLowerCase())) return false;
      if (f.address && !address.includes(f.address.toLowerCase())) return false;

      const filterPhoneDigits = (f.phone || "").replace(/\D/g, "");
      if (filterPhoneDigits && !phoneDigits.includes(filterPhoneDigits)) return false;

      if (f.services && !serviceText.includes(f.services.toLowerCase())) return false;

      if (term) {
        const matchesGlobal =
          clinicId.includes(term) ||
          name.includes(term) ||
          doctor.includes(term) ||
          address.includes(term) ||
          (termDigits.length > 0 && phoneDigits.includes(termDigits)) ||
          serviceText.includes(term);

        if (!matchesGlobal) return false;
      }

      return true;
    });
  }, [processedClinics, filters, searchTerm]);

  const highlightText = (text, specificTerm) => {
    if (!text) return text;
    const strText = text.toString();

    // Terms to highlight: global search term + specific column filter
    const rawTerms = [searchTerm.trim(), specificTerm].filter(Boolean);

    if (rawTerms.length === 0) return strText;

    // Build regex patterns
    const patterns = rawTerms.map((term) => {
      return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape literal
    });

    // Add fuzzy digit patterns for phone-like searches
    rawTerms.forEach((term) => {
      const digits = term.replace(/\D/g, "");
      if (digits.length >= 3) {
        // e.g. "123" -> "1\D*2\D*3"
        // This allows matching "(123) 456" with "123456"
        const fuzzy = digits.split("").join("\\D*");
        patterns.push(fuzzy);
      }
    });

    try {
      const combinedPattern = `(${patterns.join("|")})`;
      const regex = new RegExp(combinedPattern, "gi");
      return strText.replace(regex, '<mark class="hl">$1</mark>');
    } catch (e) {
      // Fallback if regex fails
      return strText;
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="title" onClick={() => window.location.reload()} style={{ cursor: "pointer" }}>
          <h1>Clinic Directory</h1>
          <p className="subtitle">Find clinics details</p>
        </div>
      </header>

      {/* Search bar */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search clinic name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-actions">
          <button type="submit" className="button secondary">
            Search
          </button>
          <div className="search-actions-column">
            <button
              type="button"
              className="button secondary button-ghost"
              onClick={clearAllFilters}
            >
              Clear Filters
            </button>
          </div>
          {/* <button
            type="button"
            className="button primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Clinic
          </button> */}
        </div>
      </form>

      {/* Horizontal filter toolbar */}
      <div className="filter-toolbar">
        <FilterPill
          label={filters.clinicId ? `ID: ${filters.clinicId}` : "+ Clinic ID"}
          placeholder="Filter by clinic ID"
          type="text"
          value={filters.clinicId}
          isActive={!!filters.clinicId}
          isOpen={openFilterKey === "clinicId"}
          onOpen={() => setOpenFilterKey("clinicId")}
          onClose={() => setOpenFilterKey(null)}
          onApply={(val) => {
            setFilterValue("clinicId", val);
            setOpenFilterKey(null);
          }}
          onClear={() => {
            clearFilter("clinicId");
            setOpenFilterKey(null);
          }}
        />
        <FilterPill
          label={filters.doctorName ? `Doc: ${filters.doctorName}` : "+ Doctor Name"}
          placeholder="Filter by doctor name"
          type="text"
          value={filters.doctorName}
          isActive={!!filters.doctorName}
          isOpen={openFilterKey === "doctorName"}
          onOpen={() => setOpenFilterKey("doctorName")}
          onClose={() => setOpenFilterKey(null)}
          onApply={(val) => {
            setFilterValue("doctorName", val);
            setOpenFilterKey(null);
          }}
          onClear={() => {
            clearFilter("doctorName");
            setOpenFilterKey(null);
          }}
        />
        <FilterPill
          label={filters.address ? `Addr: ${filters.address}` : "+ Clinic Address"}
          placeholder="Filter by address"
          type="text"
          value={filters.address}
          isActive={!!filters.address}
          isOpen={openFilterKey === "address"}
          onOpen={() => setOpenFilterKey("address")}
          onClose={() => setOpenFilterKey(null)}
          onApply={(val) => {
            setFilterValue("address", val);
            setOpenFilterKey(null);
          }}
          onClear={() => {
            clearFilter("address");
            setOpenFilterKey(null);
          }}
        />
        <FilterPill
          label={filters.phone ? `Ph: ${filters.phone}` : "+ Phone Number"}
          placeholder="Filter by phone"
          type="text"
          value={filters.phone}
          isActive={!!filters.phone}
          isOpen={openFilterKey === "phone"}
          onOpen={() => setOpenFilterKey("phone")}
          onClose={() => setOpenFilterKey(null)}
          onApply={(val) => {
            setFilterValue("phone", val);
            setOpenFilterKey(null);
          }}
          onClear={() => {
            clearFilter("phone");
            setOpenFilterKey(null);
          }}
        />
        <FilterPill
          label={filters.services ? `Svc: ${filters.services}` : "+ Services"}
          placeholder="Filter by services"
          type="text"
          value={filters.services}
          isActive={!!filters.services}
          isOpen={openFilterKey === "services"}
          onOpen={() => setOpenFilterKey("services")}
          onClose={() => setOpenFilterKey(null)}
          onApply={(val) => {
            setFilterValue("services", val);
            setOpenFilterKey(null);
          }}
          onClear={() => {
            clearFilter("services");
            setOpenFilterKey(null);
          }}
        />
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button className="button secondary button-sm" onClick={loadClinics}>
            Retry
          </button>
        </div>
      )}

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
                <th>Twilio number</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty">Loading...</td>
                </tr>
              ) : visibleClinics.length === 0 ? (
                /* If backend returned no rows at all */
                <tr>
                  <td colSpan="6" className="empty">
                    No clinics found.
                  </td>
                </tr>
              ) : (
                visibleClinics.map((row) => (
                  <tr key={row.uniqueKey}>
                    <td dangerouslySetInnerHTML={{ __html: highlightText(row.clinic_code || row.clinicId || "-", filters.clinicId) }} />
                    <td dangerouslySetInnerHTML={{ __html: highlightText(row.name || "-", filters.clinicName) }} />
                    <td dangerouslySetInnerHTML={{ __html: highlightText(row.doctor_name || row.doctorName || "-", filters.doctorName) }} />
                    <td dangerouslySetInnerHTML={{ __html: highlightText(row.address || "-", filters.address) }} />
                    {/* Display the service-specific phone number */}
                    <td dangerouslySetInnerHTML={{ __html: highlightText(formatPhoneNumber(row.displayPhone) || "-", filters.phone) }} />
                    <td className="services-cell">
                      <span
                        className="tag"
                        dangerouslySetInnerHTML={{ __html: highlightText(row.displayService, filters.services) }}
                      />
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

// Reusable filter dropdown pill
const FilterPill = ({
  label,
  placeholder,
  type = "text",
  value,
  isActive,
  isOpen,
  onOpen,
  onClose,
  onApply,
  onClear,
}) => {
  const [draft, setDraft] = useState(value || "");

  // keep local input in sync when external value changes
  useEffect(() => {
    setDraft(value || "");
  }, [value, isOpen]);

  const handleApply = () => {
    onApply(draft.trim());
  };

  const handleClear = () => {
    setDraft("");
    onClear();
  };

  return (
    <div className="filter-pill-wrapper">
      <button
        type="button"
        className={`filter-pill ${isActive ? "filter-pill--active" : ""}`}
        onClick={() => (isOpen ? onClose() : onOpen())}
      >
        {label}
      </button>
      {isOpen && (
        <div className="filter-dropdown-panel">
          <div className="filter-field">
            <span className="filter-field-label">{label.replace("+ ", "")}</span>
            <div className="filter-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type={type}
                className="filter-input"
                placeholder={placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="button secondary button-sm"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="button primary button-sm"
              onClick={handleApply}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

