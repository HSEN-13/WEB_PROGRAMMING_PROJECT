import { Router } from "express";

import * as controller from "./auth.controller.js";

const router = Router();

router.post("/api/signup", controller.signup);

router.post("/api/login", controller.login);

router.get("/api/me", controller.me);

router.post("/api/logout", controller.logout);

export default router;
