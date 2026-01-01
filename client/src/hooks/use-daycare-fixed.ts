// Helper to get auth headers from localStorage
const getAuthHeaders = (): HeadersInit => {
    try {
        const userStr = localStorage.getItem('auth_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.email) {
                return {
                    'Content-Type': 'application/json',
                    'x-user-name': user.email
                };
            }
        }
    } catch (e) {
        console.error("Error parsing auth user for headers:", e);
    }
    return { 'Content-Type': 'application/json' };
};

// Add this helper to the top of use-daycare.ts
// Then update ALL fetch() calls to include `headers: getAuthHeaders()`
// For example, change:
//   const response = await fetch("/api/daycare/stats");
// To:
//   const response = await fetch("/api/daycare/stats", { headers: getAuthHeaders() });
