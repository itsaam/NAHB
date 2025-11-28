import api from "./api";

const gameService = {
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

export default gameService;
