import { Role } from "../../generated/prisma";
import { createToken } from "../../lib/jwt";
import { generatePin } from "../../lib/pin";
import { randomToken } from "../../lib/token";
import { AppError } from "../../utils/app.error";
import { PasswordService } from "../password/password.service";
import prisma from "../prisma/prisma.service";
import { CreateChildDTO } from "./dto/create-child.dto";
import { LoginChildDTO } from "./dto/login-child.dto";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { SetPasswordDTO } from "./dto/set-password.dto";

export class AuthService {
  private passwordService: PasswordService;
  constructor() {
    this.passwordService = new PasswordService();
  }
  parentRegister = async ({ email }: RegisterDTO) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError("Email is required!", 400);
    }

    const existingParent = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingParent?.email === email) {
      throw new AppError("Email already used!", 400);
    }

    const token = randomToken();

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: "PARENT",
        verifyToken: token,
      },
    });

    return { message: "Account created succesfully! Please set your password" };
  };

  parentSetPassword = async ({
    name,
    phoneNumber,
    password,
    verifyToken,
  }: SetPasswordDTO & { verifyToken: string }) => {
    if (!verifyToken) throw new AppError("Token is required!", 400);

    const parent = await prisma.user.findFirst({
      where: { verifyToken, role: Role.PARENT },
    });

    if (!parent) {
      throw new AppError("Invalid or expirede token!", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(password);
    await prisma.user.update({
      where: { id: parent.id },
      data: { name, phoneNumber, password: hashedPassword, verifyToken: null },
    });

    return { message: "Your account has been set. You can login now!" };
  };

  parentLogin = async ({ email, password }: LoginDTO) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError("Email is required!", 400);
    }
    if (!password) {
      throw new AppError("Password is required!", 400);
    }

    const parent = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!parent) {
      throw new AppError("Account not registered!", 404);
    }
    if (!parent.password) {
      throw new AppError("Account has not been set!", 400);
    }

    const comparedPassword = await this.passwordService.comparePassword(
      password,
      parent.password
    );

    if (!comparedPassword) {
      throw new AppError("Invalid Password!", 400);
    }

    const payload = {
      id: parent.id,
      role: parent.role,
    };

    const accessToken = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "1hr" },
    });

    return { accessToken };
  };

  createChild = async ({ parentId, name }: CreateChildDTO) => {
    const pin = generatePin();
    const hashedPin = await this.passwordService.hashPassword(pin);
    const childCode = randomToken().slice(0, 16);
    const codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const child = await prisma.user.create({
      data: {
        name,
        role: Role.CHILD,
        parentId,
        pinHash: hashedPin,
        childCode,
        codeExpiresAt,
      },
      select: { id: true, name: true, childCode: true, codeExpiresAt: true },
    });

    return { ...child, pin };
  };

  childLogin = async ({ childCode, pin }: LoginChildDTO) => {
    const child = await prisma.user.findFirst({
      where: { childCode, role: Role.CHILD },
    });

    if (!child) {
      throw new AppError("Invalid Code!", 401);
    }

    if (child.codeExpiresAt && child.codeExpiresAt < new Date()) {
      throw new AppError("Code Expired!", 401);
    }

    const childPin = await this.passwordService.comparePassword(
      pin,
      child.pinHash!
    );

    await prisma.user.update({
      where: { id: child.id },
      data: {
        childCode: null,
        codeExpiresAt: null,
      },
    });

    const payload = {
      id: child.id,
      role: child.role,
      name: child.name,
    };

    const accessToken = createToken({
      payload,
      secretKey: process.env.JWT_SECRET_KEY!,
      options: { expiresIn: "1hr" },
    });

    return { accessToken}
  };
}
