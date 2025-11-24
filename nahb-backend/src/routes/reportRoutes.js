const express = require("express");
const router = express.Router();
const { createReport, getMyReports } = require("../controllers/reportController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validate,
  createReportSchema,
} = require("../middlewares/validateMiddleware");

/**
 * @route   POST /api/reports
 * @desc    Créer un signalement
 * @access  Privé
 */
router.post("/", authenticate, validate(createReportSchema), createReport);

/**
 * @route   GET /api/reports/my
 * @desc    Récupérer mes signalements
 * @access  Privé
 */
router.get("/my", authenticate, getMyReports);

module.exports = router;

