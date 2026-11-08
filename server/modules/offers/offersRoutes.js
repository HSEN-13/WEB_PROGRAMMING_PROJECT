import { Router } from "express";

import * as controller from "./offers.controller.js";

import requireLogin from "../../shared/middleware/requireLogin.js";

const router = Router();

router.post("/api/products/:id/offers", requireLogin, controller.create);

router.get("/api/me/offers/:view", requireLogin, controller.list);

router.patch("/api/offers/:id/decision", requireLogin, controller.decide);

export default router;
