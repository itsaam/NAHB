import api from "./api";

const imageSuggestionsService = {
  suggest: (data) => api.post("/image-suggestions", data),
  getMy: () => api.get("/image-suggestions/my"),
  getAll: (params) => api.get("/image-suggestions", { params }),
  approve: (id) => api.post(`/image-suggestions/${id}/approve`),
  reject: (id) => api.post(`/image-suggestions/${id}/reject`),
};

export default imageSuggestionsService;
