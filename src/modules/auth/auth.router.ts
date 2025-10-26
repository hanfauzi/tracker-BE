import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { RegisterDTO } from "./dto/register.dto";
import { SetPasswordDTO } from "./dto/set-password.dto";
import { LoginDTO } from "./dto/login.dto";
import { CreateChildDTO } from "./dto/create-child.dto";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { LoginChildDTO } from "./dto/login-child.dto";
import { PairingChildDTO } from "./dto/pairing-child.dto";

export class AuthRouter {
  private router: Router;

  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.post(
      "/parent/register",
      validateBody(RegisterDTO),
      this.authController.parentRegister
    );

    this.router.patch(
      "/parent/set-password/:verifyToken",
      validateBody(SetPasswordDTO),
      this.authController.parentSetPassword
    );

    this.router.post(
      "/parent/login",
      validateBody(LoginDTO),
      this.authController.parentLogin
    );

    this.router.post("/auth/refresh", this.authController.refresh);
    this.router.post("/auth/logout", this.authController.logout);

    this.router.post(
      "/parent/create-child",
      validateBody(CreateChildDTO),
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["PARENT"]),
      this.authController.createChild
    );

    this.router.patch(
      "/child/pairing",
      validateBody(PairingChildDTO),
      this.authController.childPairing
    );

    this.router.post(
      "/child/login",
      validateBody(LoginChildDTO),
      this.authController.childLogin
    );
  };
  getRouter = () => {
    return this.router;
  };
}
