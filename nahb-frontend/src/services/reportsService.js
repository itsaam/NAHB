import api from "./api";

const reportsService = {
  create: (data) => api.post("/reports", data),
  getMy: () => api.get("/reports/my"),
};

export default reportsService;
