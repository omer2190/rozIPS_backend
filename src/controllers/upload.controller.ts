import { Request, Response } from "express";

export const uploadImage = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded." });
  }

  // Construct the URL for the uploaded file
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  res.status(200).json({
    msg: "File uploaded successfully",
    filePath: fileUrl,
  });
};
