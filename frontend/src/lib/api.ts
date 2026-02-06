import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (formData: FormData) => api.post('/token', formData),
    register: (data: any) => api.post('/users', data),
};

export const hotelApi = {
    getHotels: () => api.get('/hotels'),
    getHotel: (id: number) => api.get(`/hotels/${id}`),
    createHotel: (data: any) => api.post('/hotels', data),
    updateHotel: (id: number, data: any) => api.put(`/hotels/${id}`, data),
    deleteHotel: (id: number) => api.delete(`/hotels/${id}`),
};

export const roomTypeApi = {
    createRoomType: (data: any) => api.post('/room-types', data),
    getAdjustmentHistory: (id: number) => api.get(`/room-types/${id}/history`),
};

export const adjustmentApi = {
    createAdjustment: (data: any) => api.post('/rate-adjustments', data),
};

export default api;
