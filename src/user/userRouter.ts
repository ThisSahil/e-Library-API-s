import express from "express";
import { createUser, loginUser } from "./userController";

const userRouter = express.Router();

// userRoutes
userRouter.post("/register", createUser);

userRouter.post("/login", loginUser);

export default userRouter;
