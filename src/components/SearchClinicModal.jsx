import { useState } from "react";
import { api } from "../services/api";

const SearchClinicModal = ({ isOpen, onClose, onResults, onSearchStart }) => {
    // Tabs: 'general', 'advanced', 'specific'
    const [activeTab, setActiveTab] = useState("general");

    // General Search
    const [generalQuery, setGeneralQuery] = useState("");

    // Advanced Filters (Name, Phone, Services)
    const [filters, setFilters] = useState({
        name: "",
        phone: "",
        services: ""
    });

    // Specific Lookup
    const [specific, setSpecific] = useState({
        type: "clinic_code", // clinic_code, doctor_name, address
        value: ""
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Reset fields when opening/closing? Maybe not needed for search.

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSpecificChange = (e) => {
        setSpecific({ ...specific, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        if (onSearchStart) onSearchStart();

        try {
            let results = [];

            if (activeTab === "general") {
                if (!generalQuery.trim()) {
                    throw new Error("Please enter a search term");
                }
                results = await api.searchClinics(generalQuery);
            }
            else if (activeTab === "advanced") {
                // Prepare filters
                const apiFilters = {};
                if (filters.name.trim()) apiFilters.name = filters.name.trim();
                if (filters.phone.trim()) apiFilters.phone = filters.phone.trim();
                if (filters.services.trim()) {
                    apiFilters.services = filters.services.split(',').map(s => s.trim()).filter(Boolean);
                }

                if (Object.keys(apiFilters).length === 0) {
                    // If empty, just fetch all? or warn?
                    // Let's fetch all (which essentially resets the list)
                }
                results = await api.fetchClinics(apiFilters);
            }
            else if (activeTab === "specific") {
                const val = specific.value.trim();
                if (!val) throw new Error("Please enter a value");

                if (specific.type === "clinic_code") {
                    results = await api.searchByClinicCode(val);
                } else if (specific.type === "doctor_name") {
                    results = await api.searchByDoctorName(val);
                } else if (specific.type === "address") {
                    results = await api.searchByAddress(val);
                }
            }

            onResults(results);
            onClose(); 

        } catch (err) {
            console.error(err);
            setError(err.message || "Search failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Search Clinics</h2>
                    <button className="icon-button" onClick={onClose}>×</button>
                </header>

                <div className="modal-body">
                    {/* Tabs */}
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            General
                        </button>
                        <button
                            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
                            onClick={() => setActiveTab('advanced')}
                        >
                            Filters
                        </button>
                        <button
                            className={`tab ${activeTab === 'specific' ? 'active' : ''}`}
                            onClick={() => setActiveTab('specific')}
                        >
                            Specific
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="search-form">

                        {activeTab === 'general' && (
                            <label className="label">
                                Search Term
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Type anything..."
                                    value={generalQuery}
                                    onChange={(e) => setGeneralQuery(e.target.value)}
                                />
                                <span className="hint">Searches across Name, Phone, Code, Doctor, Address</span>
                            </label>
                        )}

                        {activeTab === 'advanced' && (
                            <>
                                <label className="label">
                                    Clinic Name
                                    <input
                                        className="input"
                                        name="name"
                                        value={filters.name}
                                        onChange={handleFilterChange}
                                        placeholder="e.g. Health Plus"
                                    />
                                </label>
                                <label className="label">
                                    Phone
                                    <input
                                        className="input"
                                        name="phone"
                                        value={filters.phone}
                                        onChange={handleFilterChange}
                                        placeholder="e.g. 555-0123"
                                    />
                                </label>
                                <label className="label">
                                    Services
                                    <input
                                        className="input"
                                        name="services"
                                        value={filters.services}
                                        onChange={handleFilterChange}
                                        placeholder="Comma separated e.g. Dental, Cardio"
                                    />
                                </label>
                            </>
                        )}

                        {activeTab === 'specific' && (
                            <>
                                <label className="label">
                                    Search By
                                    <select
                                        className="input"
                                        name="type"
                                        value={specific.type}
                                        onChange={handleSpecificChange}
                                    >
                                        <option value="clinic_code">Clinic Code</option>
                                        <option value="doctor_name">Doctor Name</option>
                                        <option value="address">Address</option>
                                    </select>
                                </label>
                                <label className="label">
                                    Value
                                    <input
                                        className="input"
                                        name="value"
                                        value={specific.value}
                                        onChange={handleSpecificChange}
                                        placeholder="Enter value..."
                                    />
                                </label>
                            </>
                        )}

                        {error && <div className="error">{error}</div>}

                        <button type="submit" className="button primary full" disabled={loading}>
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SearchClinicModal;
