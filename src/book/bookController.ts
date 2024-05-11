import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [filename: string]: Express.Multer.File[] };

  const { title, genre } = req.body;

  try {
    const fileName = files.coverImage[0].filename;
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );

    const imageUploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFileMimeType = "pdf";
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const boolFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-files",
        format: bookFileMimeType,
      }
    );

    console.log(imageUploadResult);

    console.log(boolFileUploadResult);

    const newBook = await bookModel.create({
      title,
      genre,
      author: "6632ad89770d578d925b7fe1",
      file: boolFileUploadResult.secure_url,
      coverImage: imageUploadResult.secure_url,
    });

    await fs.promises.unlink(bookFilePath);
    await fs.promises.unlink(filePath);

    res.status(201).json({ message: "New book added", id: newBook._id });
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error while uploading files"));
  }
};

export { createBook };
