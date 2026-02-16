import { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isRefreshing = useRef(false);
    const failedQueue = useRef([]);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const processQueue = (error, token = null) => {
        failedQueue.current.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue.current = [];
    };

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const username = localStorage.getItem('username');

        if (accessToken && username) {
            setUser({ username, accessToken });
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        setLoading(false);

        // Axios Interceptor for Automatic Refresh
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (isRefreshing.current) {
                        return new Promise((resolve, reject) => {
                            failedQueue.current.push({ resolve, reject });
                        }).then(token => {
                            originalRequest.headers['Authorization'] = 'Bearer ' + token;
                            return axios(originalRequest);
                        }).catch(err => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    isRefreshing.current = true;

                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        logout();
                        return Promise.reject(error);
                    }

                    try {
                        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        const { accessToken: newAccessToken } = data;

                        localStorage.setItem('accessToken', newAccessToken);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                        processQueue(null, newAccessToken);

                        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        processQueue(refreshError, null);
                        logout();
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing.current = false;
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { username, password });
            const { accessToken, refreshToken, username: user } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('username', user);

            setUser({ username: user, accessToken });
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const signup = async (username, password) => {
        try {
            await axios.post(`${API_URL}/auth/signup`, { username, password });
            return true;
        } catch (error) {
            console.error('Signup failed', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await axios.post(`${API_URL}/auth/logout`);
            }
        } catch (error) {
            console.error('Logout failed on backend', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
