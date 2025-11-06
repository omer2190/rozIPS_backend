import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller";
import upload from "../middlewares/upload.middleware";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

// @route   POST api/upload
// @desc    Upload an image
// @access  Private
router.post("/", auth, upload.single("image"), uploadImage);

export default router;
