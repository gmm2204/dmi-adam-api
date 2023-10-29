import { Request, Response } from "express";

export function welcome(req: Request, res: Response): Response {
  return res.json({ message: "Mortality Server API." });
}
