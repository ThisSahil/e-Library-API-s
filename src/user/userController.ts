import { NextFunction, Request, Response } from "express";

const createUser = async (rer: Request, res: Response, next: NextFunction) => {
  res.json({
    msg: "Yeh register karne ka route hai",
  });
};

export { createUser };
