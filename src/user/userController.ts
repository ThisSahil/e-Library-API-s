import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  try {
    const user = await userModel.findOne({ email });

    if (user) {
      const error = createHttpError(400, "User already exists with this email");
      next(error);
    }
  } catch (err) {
    next(createHttpError(500, "Error while getting user"));
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      email,
      password: hashedPassword,
      name,
    });

    console.log("Hello");
    console.log(config.jwtSecret);
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    console.log("Hello");

    console.log(token);

    res.status(201).json({ accessToken: token });
  } catch (error) {
    next(createHttpError(500, "Error while creating user"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(createHttpError(404, "user with this email does not exists"));
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password as string
    );

    if (!validPassword) {
      return next(createHttpError(400, "username or password is incorrect"));
    }

    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "user logged In", token: token });
  } catch (error) {
    next(createHttpError(500, "Error while fetching user"));
  }
};

export { createUser, loginUser };
