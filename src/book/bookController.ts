import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";
import { AuthRequest } from "../middlewares/authenticate";
import { json } from "stream/consumers";

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

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  const files = req.files as { [filename: string]: Express.Multer.File[] };

  const { title, genre } = req.body;

  try {
    const bookToUpdate = await bookModel.findOne({ _id: bookId });

    if (!bookToUpdate) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;

    if (bookToUpdate.author.toString() !== _req.userId) {
      return next(
        createHttpError(403, "You not have access to update other user book")
      );
    }

    let coverImagePath = "";
    if (files.coverImage) {
      const imageName = files.coverImage[0].filename;
      const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
      const coverImgagePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        imageName
      );

      const imageUploadResult = await cloudinary.uploader.upload(
        coverImgagePath,
        {
          filename_override: imageName,
          folder: "book-covers",
          format: coverImageMimeType,
        }
      );

      coverImagePath = imageUploadResult.secure_url;
      await fs.promises.unlink(coverImgagePath);
    }

    let bookFileURL = "";
    if (files.file) {
      const bookFileName = files.file[0].filename;
      const bookFileMimeType = "pdf";
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      const bookFileUploadsResult = await cloudinary.uploader.upload(
        bookFilePath,
        {
          resource_type: "raw",
          filename_override: bookFileName,
          format: bookFileMimeType,
          folder: "book-files",
        }
      );

      bookFileURL = bookFileUploadsResult.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { title, genre, file: bookFileURL, coverImage: coverImagePath },
      { new: true }
    );

    res.json(updatedBook);
  } catch (error) {
    return next(createHttpError(500, "Error while updating the resource"));
  }
};

const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await bookModel.find();
    return res.json(books);
  } catch (error) {
    return next(createHttpError(500, "Error while getting all books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    return res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error getting this single book"));
  }
};

const deleteBookByBookId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // check access of user to delete this book

  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "Access  denied to delete"));
  }

  //res.cloudinary.com/dmkqr1ygs/image/upload/v1715374354/book-covers/juwitwnv6psfzypoyv8y.jpg

  const imgLink = book.coverImage;
  const temp = imgLink.split("/");
  const imgPublicId = `${temp[temp.length - 2]}/${
    temp[temp.length - 1].split(".")[0]
  }`;

  const file = book.file;
  const fileSplits = file.split("/");
  const filePublicId = `${fileSplits.at(-2)}/${fileSplits.at(-1)}`;

  await cloudinary.uploader.destroy(imgPublicId);
  await cloudinary.uploader.destroy(filePublicId, { resource_type: "raw" });

  await bookModel.deleteOne({ _id: bookId });

  return res.status(204).json({ message: "Book Deleted successfully" });
};

export {
  createBook,
  updateBook,
  getAllBooks,
  getSingleBook,
  deleteBookByBookId,
};
