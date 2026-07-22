import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://swapstyle-clothing-swap-marketplace.onrender.com/api',
  withCredentials: true
});

// Attach Authorization Token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Authentication Endpoints
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (formData) => API.post('/auth/register', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const fetchProfile = () => API.get('/auth/me');
export const updateProfile = (formData) => API.put('/auth/me', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Listings Endpoints
export const fetchListings = (params) => API.get('/listings', { params });
export const fetchListingById = (id) => API.get(`/listings/${id}`);
export const fetchMyListings = () => API.get('/listings/my');
export const createListing = (formData) => API.post('/listings', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateListing = (id, formData) => API.put(`/listings/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteListing = (id) => API.delete(`/listings/${id}`);
export const getSuggestedValue = (category, brand, condition) => 
  API.get('/listings/suggest-value', { params: { category, brand, condition } });

// Swap Request Endpoints
export const createSwapRequest = (swapData) => API.post('/swaps', swapData);
export const fetchMySwaps = () => API.get('/swaps');
export const fetchSwapById = (id) => API.get(`/swaps/${id}`);
export const updateSwapRequestStatus = (id, statusData) => API.put(`/swaps/${id}`, statusData);

// Chat Endpoints
export const fetchChatMessages = (swapRequestId) => API.get(`/chat/${swapRequestId}/messages`);
export const markChatAsRead = (swapRequestId) => API.put(`/chat/${swapRequestId}/read`);

// Notifications Endpoints
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => API.put('/notifications/read-all');

// Admin Endpoints
export const fetchAdminAnalytics = () => API.get('/admin/analytics');
export const fetchAdminUsers = () => API.get('/admin/users');
export const fetchAdminListings = () => API.get('/admin/listings');
export const fetchAdminSwaps = () => API.get('/admin/swaps');
export const deleteUserByAdmin = (id) => API.delete(`/admin/users/${id}`);
export const toggleUserActiveByAdmin = (id) => API.put(`/admin/users/${id}/toggle-active`);
export const resolveDisputeByAdmin = (id, disputeData) => API.put(`/admin/disputes/${id}`, disputeData);
export const changePassword = (passwordData) => API.put('/auth/change-password', passwordData);

export default API;
