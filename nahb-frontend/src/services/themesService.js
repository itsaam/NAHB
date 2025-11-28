import api from "./api";

const themesService = {
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

export default themesService;
