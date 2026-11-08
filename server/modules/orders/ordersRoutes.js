import { Router } from "express";

import * as controller from "./orders.controller.js";

import requireLogin from "../../shared/middleware/requireLogin.js";

const router = Router();

router.get("/api/checkout/:productId", requireLogin, controller.checkout);

router.post("/api/checkout/:productId", requireLogin, controller.buy);

router.get("/api/me/orders/:view", requireLogin, controller.list);

router.patch("/api/orders/:id/status", requireLogin, controller.changeStatus);

export default router;
