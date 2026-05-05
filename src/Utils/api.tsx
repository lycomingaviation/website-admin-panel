import { notification } from "antd";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Common API Function with Authorization Token
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} endpoint - The API endpoint (e.g., "/users")
 * @param {Object} [data] - The request payload for POST, PUT, etc. (optional for GET)
 * @param {Object} [options] - Additional options such as custom headers
 * @param {Function} [navigate] - The navigate function from `react-router-dom` (optional)
 * @returns {Promise<any>} - A Promise resolving to the API response
 */
const apiRequest = async (method?: any, endpoint?: any, data = {}, options = {}, navigate?: any) => {
  try {
    const token = localStorage.getItem("authToken"); // Or use a context/store
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      method,
      url: endpoint,
      data,
      ...options,
    };

    const response = await api(config);
    return response.data;
  } catch (error: any) {
    console.error(`Error during API request to ${endpoint}:`, error.response?.status, navigate);

    // Redirect to login on unauthorized (401)
    if (error.response?.status === 401) {
      notification.error({
        message:
          'Session Expired.',
      });
      localStorage.clear(); // Clear invalid token
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }

    throw error.response?.data || error.message;
  }
};

export default apiRequest;
