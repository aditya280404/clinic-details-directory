const API_PREFIX = '/api/clinics';

/**
 * Helper to handle response
 */
async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API Error: ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    // Get all clinics with optional filters
    fetchClinics: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.phone) params.append('phone', filters.phone);
        if (filters.services) {
            // If services is array
            if (Array.isArray(filters.services)) {
                filters.services.forEach(s => params.append('services', s));
            } else {
                params.append('services', filters.services);
            }
        }

        const queryString = params.toString();
        const url = queryString ? `${API_PREFIX}?${queryString}` : `${API_PREFIX}`;

        const res = await fetch(url);
        return handleResponse(res);
    },

    // Add a new clinic
    addClinic: async (clinic) => {
        const res = await fetch(`${API_PREFIX}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clinic),
        });
        return handleResponse(res);
    },

    // Search/Filter (General query)
    searchClinics: async (query) => {
        const res = await fetch(`${API_PREFIX}/search?q=${encodeURIComponent(query)}`);
        return handleResponse(res);
    },

    // Search by specific fields
    searchByName: async (name) => {
        const res = await fetch(`${API_PREFIX}/by-name/${encodeURIComponent(name)}`);
        return handleResponse(res);
    },

    searchByPhone: async (phone) => {
        const res = await fetch(`${API_PREFIX}/by-phone/${encodeURIComponent(phone)}`);
        return handleResponse(res);
    },

    searchByAddress: async (address) => {
        const res = await fetch(`${API_PREFIX}/by-address?address=${encodeURIComponent(address)}`);
        return handleResponse(res);
    },

    searchByClinicCode: async (code) => {
        const res = await fetch(`${API_PREFIX}/by-clinic-code/${encodeURIComponent(code)}`);
        return handleResponse(res);
    },

    searchByDoctorName: async (name) => {
        const res = await fetch(`${API_PREFIX}/by-doctor-name/${encodeURIComponent(name)}`);
        return handleResponse(res);
    },

    searchByServices: async (services) => {
        // Services is expected to be an array of strings
        const queryParams = services.map(s => `services=${encodeURIComponent(s)}`).join('&');
        const res = await fetch(`${API_PREFIX}/by-services?${queryParams}`);
        return handleResponse(res);
    }
};
