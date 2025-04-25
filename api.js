async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }
    
    return response;
}