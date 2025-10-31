import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AppError } from "../../utils/app.error";
import {
  issueRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../../lib/refresh";
import { createToken } from "../../lib/jwt";

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

  parentLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await this.authService.parentLogin({
      email,
      password,
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });
    res.status(200).json({ accessToken });
  };

  refresh = async (req: Request, res: Response) => {
    const raw = req.cookies?.refresh_token as string | undefined;
    if (!raw) throw new AppError("No refresh token", 401);

    const row = await verifyRefreshToken(raw);
    if (!row) throw new AppError("Invalid/expired refresh token", 401);

    await revokeRefreshToken(raw);
    const newRefresh = await issueRefreshToken(row.userId);

    const accessToken = createToken({
      payload: { id: row.userId },
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "1hr" },
    });

    res.cookie("refresh_token", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    res.status(200).json({ accessToken });
  };

  logout = async (req: Request, res: Response) => {
    const raw = req.cookies?.refresh_token as string | undefined;
    if (raw) await revokeRefreshToken(raw);
    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    res.status(200).json({ message: "Logged out" });
  };

  createChild = async (req: Request, res: Response) => {
    const  parentId  = res.locals.payload.id;
    const { name } = req.body;
    const result = await this.authService.createChild({ parentId, name });
    res.status(200).json(result);
  };

  childPairing = async (req: Request, res: Response) => {
    const { childCode, pin } = req.body;
    const {accessToken, message} = await this.authService.childPairing({ childCode, pin });
    res.status(200).json({accessToken, message});
  };

  childLogin = async (req: Request, res: Response) => {
    const { familyCode, pin } = req.body;
    const { accessToken, refreshToken } = await this.authService.childLogin({
      familyCode,
      pin,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });
    res.status(200).json({ accessToken });
  };
}
