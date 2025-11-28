import api from "./api";

const adminService = {
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

export default adminService;
