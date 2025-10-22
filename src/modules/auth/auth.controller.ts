import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  parentRegister = async (req: Request, res: Response) => {
    const result = await this.authService.parentRegister(req.body);
    res.status(200).json(result);
  };

  parentSetPassword = async (req: Request, res: Response) => {
    const { name, phoneNumber, password } = req.body;
    const { verifyToken } = req.params;
    const result = await this.authService.parentSetPassword({
      name,
      phoneNumber,
      password,
      verifyToken,
    });
    res.status(200).json(result);
  };

  parentLogin = async ( req: Request, res: Response) => {
    const {email, password} = req.body
    const result = await this.authService.parentLogin({email,password})
    res.status(200).json(result)
  }
}
