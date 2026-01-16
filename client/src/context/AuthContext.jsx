import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Helper to fetch with auth capabilities
    const authFetch = async (url, options = {}) => {
        let accessToken = localStorage.getItem('accessToken');

        // Base headers
        const headers = {
            ...(options.headers || {})
        };

        // Only set JSON content type if not FormData and not already set
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let response = await fetch(url, { ...options, headers });

        // Handle Token Expiry
        if (response.status === 401) {
            console.log('Access token expired, attempting refresh...');
            try {
                const refreshed = await refreshToken();
                if (refreshed) {
                    // Retry original request with new token
                    accessToken = localStorage.getItem('accessToken');
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    response = await fetch(url, { ...options, headers });
                } else {
                    logout(); // Refresh failed
                    throw new Error('Session expired');
                }
            } catch (err) {
                logout();
                throw err;
            }
        }

        return response;
    };

    const refreshToken = async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) return false;

        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Refresh failed', error);
        }
        return false;
    };

    useEffect(() => {
        // Check local storage for user and tokens
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');

        // Only set user if we have a token too
        if (storedUser && storedAccessToken) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (role, email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                // Verify role matches
                if (!data.roles.includes(role)) {
                    throw new Error(`Invalid role. You are not a ${role}.`);
                }

                // Store Data
                const userObj = {
                    _id: data._id,
                    email: data.email,
                    name: data.name,
                    roles: data.roles
                };

                setUser(userObj);
                localStorage.setItem('user', JSON.stringify(userObj));
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                return data; // success
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (payload) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.ok) {
                const userObj = {
                    _id: data._id,
                    email: data.email,
                    name: data.name,
                    roles: data.roles
                };

                setUser(userObj);
                localStorage.setItem('user', JSON.stringify(userObj));
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                return data;
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: storedRefreshToken })
                });
            } catch (err) {
                console.error('Logout API call failed', err);
            }
        }

        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, authFetch }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
