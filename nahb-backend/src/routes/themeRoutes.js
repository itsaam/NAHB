const express = require("express");
const router = express.Router();
const themeController = require("../controllers/themeController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");

// Routes publiques
router.get("/", themeController.getAllThemes);
router.get("/images", themeController.getAllImages);
router.get("/:id", themeController.getThemeById);

// Routes admin
router.post("/", authenticate, requireAdmin, themeController.createTheme);
router.put("/:id", authenticate, requireAdmin, themeController.updateTheme);
router.delete("/:id", authenticate, requireAdmin, themeController.deleteTheme);
router.post(
  "/:id/images",
  authenticate,
  requireAdmin,
  themeController.addImageToTheme
);
router.delete(
  "/images/:imageId",
  authenticate,
  requireAdmin,
  themeController.deleteThemeImage
);

module.exports = router;
