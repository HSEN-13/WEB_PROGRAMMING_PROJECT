import { Router } from "express";

import * as controller from "./reviewsControllers.js";

import requireLogin from "../../middleware/requireLogin.js";

const router = Router();

router.get("/api/reviews", controller.list);

router.post("/api/reviews", requireLogin, controller.publish);

export default router;
