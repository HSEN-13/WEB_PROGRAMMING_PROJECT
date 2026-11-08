import { Router } from "express";

import * as controller from "./products.controller.js";

import requireLogin from "../../shared/middleware/requireLogin.js";

import { upload } from "./products.upload.js";

const router = Router();

router.get("/api/products", controller.list);

router.get("/api/me/products", requireLogin, controller.mine);

router.patch("/api/products/:id/sold", requireLogin, controller.markSold);

router.get("/api/categories", controller.categories);

router.get("/api/products/:id", controller.details);

router.post(
  "/api/products",

  requireLogin,

  upload.array("images", 4),

  controller.create,
);

export default router;
