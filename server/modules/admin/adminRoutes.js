import { Router } from "express";
import { deleteListing, listRecords } from "./adminController.js";

const router = Router();

router.get("/:section", listRecords);
router.delete("/listings/:id", deleteListing);

export default router;
