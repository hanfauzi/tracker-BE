import { sign, SignOptions } from "jsonwebtoken";

interface CreateTokenProps {
  payload: Record<string, unknown>;
  secretKey: string;
  options?: SignOptions;
}

export const createToken = ({ payload, secretKey, options }: CreateTokenProps) => {
  return sign(payload, secretKey, options);
};

