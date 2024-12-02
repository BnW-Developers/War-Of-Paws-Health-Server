import express from "express";
import { CheckController } from "../controllers/check.controller.js";

const router = express.Router();

const checkController = new CheckController();

// router.post("/이름뭘로짓지", checkController.이름뭘로짓지);

export default router;
