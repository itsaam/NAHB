import api from "./api";

const storiesService = {
  getAll: (params) => api.get("/stories", { params }),
  getById: (id) => api.get(`/stories/${id}`),
  getMy: () => api.get("/stories/my"),
  create: (data) => api.post("/stories", data),
  update: (id, data) => api.put(`/stories/${id}`, data),
  delete: (id) => api.delete(`/stories/${id}`),
};

export default storiesService;
