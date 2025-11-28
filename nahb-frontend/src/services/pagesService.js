import api from "./api";

const pagesService = {
  getByStory: (storyId) => api.get(`/pages/story/${storyId}`),
  getById: (id) => api.get(`/pages/${id}`),
  create: (data) => api.post("/pages", data),
  update: (id, data) => api.put(`/pages/${id}`, data),
  delete: (id) => api.delete(`/pages/${id}`),
  addChoice: (pageId, data) => api.post(`/pages/${pageId}/choices`, data),
  deleteChoice: (pageId, choiceId) =>
    api.delete(`/pages/${pageId}/choices/${choiceId}`),
};

export default pagesService;
