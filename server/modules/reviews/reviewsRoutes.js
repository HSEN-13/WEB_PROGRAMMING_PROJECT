import { Router } from "express";

import * as controller from "./reviews.controller.js";

import requireLogin from "../../shared/middleware/requireLogin.js";

const router = Router();

router.get("/api/reviews", controller.list);

router.post("/api/reviews", requireLogin, controller.publish);

export default router;
