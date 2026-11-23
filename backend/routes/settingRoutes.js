import express from "express";
import adminAuth from '../middleware/adminAuth.js';
import { getSettings, updateSettings ,changeEmail,changePassword} from "../controllers/settingController.js";

const settingRoutes = express.Router();

settingRoutes.get("/", adminAuth, getSettings);
settingRoutes.put("/", adminAuth, updateSettings);

settingRoutes.put("/change-email", adminAuth, changeEmail);

settingRoutes.put("/change-password", adminAuth, changePassword);



export default settingRoutes;
