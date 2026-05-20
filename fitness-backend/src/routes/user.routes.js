import express from "express";
import { latestPlan, login, register } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/:userId/latest", latestPlan);

export default router;
