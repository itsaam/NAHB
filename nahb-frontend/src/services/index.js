// Export centralisé de tous les services
export { default as api } from "./api";
export { default as authService } from "./authService";
export { default as storiesService } from "./storiesService";
export { default as pagesService } from "./pagesService";
export { default as gameService } from "./gameService";
export { default as reviewsService } from "./reviewsService";
export { default as reportsService } from "./reportsService";
export { default as adminService } from "./adminService";
export { default as themesService } from "./themesService";
export { default as imageSuggestionsService } from "./imageSuggestionsService";

// Compatibilité avec les anciens imports (authAPI, storiesAPI, etc.)
export {
  authAPI,
  storiesAPI,
  pagesAPI,
  gameAPI,
  reviewsAPI,
  reportsAPI,
  adminAPI,
  themesAPI,
  imageSuggestionsAPI,
} from "./api";
