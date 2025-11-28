import api from "./api";

const reviewsService = {
  create: (data) => api.post("/reviews", data),
  getByStory: (storyId) => api.get(`/reviews/story/${storyId}`),
  getMy: () => api.get("/reviews/my"),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default reviewsService;
