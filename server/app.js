import express from "express";

import session from "./config/session.js";

import { uploadsFolder } from "./modules/products/productUpload.js";

import authRoutes from "./modules/auth/authRoutes.js";

import productsRoutes from "./modules/products/productsRoutes.js";

import offersRoutes from "./modules/offers/offersRoutes.js";

import reviewsRoutes from "./modules/reviews/reviewsRoutes.js";

import ordersRoutes from "./modules/orders/ordersRoutes.js";

import errorHandler from "./middleware/errorHandler.js";

import healthRoutes from "./health/health.routs.js";

const app = express();

app.use(express.json());

app.use(session);

app.use("/uploads", express.static(uploadsFolder));

app.use(authRoutes);

app.use(productsRoutes);

app.use(offersRoutes);

app.use(reviewsRoutes);

app.use(ordersRoutes);

app.use(errorHandler);

app.use(healthRoutes);

export default app;
