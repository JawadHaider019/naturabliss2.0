// routes/deliverySettingsRoutes.js
import express from "express";
import adminAuth from '../middleware/adminAuth.js';
import { getDeliverySettings, saveDeliverySettings } from "../controllers/deliverySettingsController.js";

const router = express.Router();

// Get latest delivery settings
router.get("/", getDeliverySettings);

// Save/update delivery settings
router.post("/", adminAuth, saveDeliverySettings);

export default router;
