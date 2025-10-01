import { Router } from "express";
import {
  register,
  change_password,
  verify2FA,
  resend2FACode,
  getWeightHistory,
  getTodayConsumption,
  getNutritionalRequirements,
  getProfile,
} from "../controllers/auth.Controller.js";
import { login } from "../controllers/login.Controller.js";
import { update_nutrition_requirements } from "../controllers/nutrition_requeriments.Controller.js";
import {
  send_email,
  send_whatsapp,
} from "../controllers/send_messages.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.put("/nutrition_requirements/:userId", update_nutrition_requirements);
router.put("/change_password/:userId", change_password);
router.post("/send_email", send_email);
router.post("/send_whatsapp", send_whatsapp);
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa", resend2FACode);

router.get("/profile/:userId", getProfile);
router.get("/nutritional-requirements/:userId", getNutritionalRequirements);
router.get("/weight-history/:userId", getWeightHistory);
router.get("/today-consumption/:userId", getTodayConsumption);
export default router;
