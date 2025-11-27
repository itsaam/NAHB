import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  checkStatus: () => api.get("/auth/status"),
  updateProfile: (data) => api.put("/auth/profile", data),
  updatePassword: (data) => api.put("/auth/password", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

// ==================== STORIES ====================
export const storiesAPI = {
  getAll: (params) => api.get("/stories", { params }),
  getById: (id) => api.get(`/stories/${id}`),
  getMy: () => api.get("/stories/my"),
  create: (data) => api.post("/stories", data),
  update: (id, data) => api.put(`/stories/${id}`, data),
  delete: (id) => api.delete(`/stories/${id}`),
};

// ==================== PAGES ====================
export const pagesAPI = {
  getByStory: (storyId) => api.get(`/pages/story/${storyId}`),
  getById: (id) => api.get(`/pages/${id}`),
  create: (data) => api.post("/pages", data),
  update: (id, data) => api.put(`/pages/${id}`, data),
  delete: (id) => api.delete(`/pages/${id}`),
  addChoice: (pageId, data) => api.post(`/pages/${pageId}/choices`, data),
  deleteChoice: (pageId, choiceId) =>
    api.delete(`/pages/${pageId}/choices/${choiceId}`),
};

// ==================== GAME ====================
export const gameAPI = {
  start: (storyMongoId) => api.post("/game/start", { storyMongoId }),
  makeChoice: (sessionId, choiceId) =>
    api.post(`/game/session/${sessionId}/choice`, { choiceId }),
  makeChoiceWithTarget: (sessionId, targetPageId) =>
    api.post(`/game/session/${sessionId}/navigate`, { targetPageId }),
  getHistory: (sessionId) => api.get(`/game/session/${sessionId}/history`),
  getMySessions: () => api.get("/game/my-sessions"),
  getUnlockedEndings: (storyId) => api.get(`/game/story/${storyId}/endings`),
  getPathStats: (sessionId) => api.get(`/game/session/${sessionId}/stats`),
  getMyActivities: () => api.get("/game/my-activities"),
};

// ==================== REVIEWS ====================
export const reviewsAPI = {
  create: (data) => api.post("/reviews", data),
  getByStory: (storyId) => api.get(`/reviews/story/${storyId}`),
  getMy: () => api.get("/reviews/my"),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  create: (data) => api.post("/reports", data),
  getMy: () => api.get("/reports/my"),
};

// ==================== ADMIN ====================
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  getStories: () => api.get("/admin/stories"),
  getReports: (status) => api.get("/admin/reports", { params: { status } }),
  banUser: (userId, banType = "full", reason = "") =>
    api.post(`/admin/users/${userId}/ban`, { banType, reason }),
  unbanUser: (userId) => api.post(`/admin/users/${userId}/unban`),
  suspendStory: (storyId) => api.post(`/admin/stories/${storyId}/suspend`),
  unsuspendStory: (storyId) => api.post(`/admin/stories/${storyId}/unsuspend`),
  handleReport: (reportId, status) =>
    api.put(`/admin/reports/${reportId}`, { status }),
};

// ==================== THEMES ====================
export const themesAPI = {
  getAll: () => api.get("/themes"),
  getById: (id) => api.get(`/themes/${id}`),
  create: (data) => api.post("/themes", data),
  update: (id, data) => api.put(`/themes/${id}`, data),
  delete: (id) => api.delete(`/themes/${id}`),
  addImage: (themeId, data) => api.post(`/themes/${themeId}/images`, data),
  deleteImage: (imageId) => api.delete(`/themes/images/${imageId}`),
  getAllImages: (themeId) =>
    api.get("/themes/images", { params: { theme_id: themeId } }),
};

// ==================== IMAGE SUGGESTIONS ====================
export const imageSuggestionsAPI = {
  suggest: (data) => api.post("/image-suggestions", data),
  getMy: () => api.get("/image-suggestions/my"),
  getAll: (params) => api.get("/image-suggestions", { params }),
  approve: (id) => api.post(`/image-suggestions/${id}/approve`),
  reject: (id) => api.post(`/image-suggestions/${id}/reject`),
};

export default api;
