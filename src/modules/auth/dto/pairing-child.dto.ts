import { IsNotEmpty } from "class-validator";

export class PairingChildDTO {
  @IsNotEmpty()
  childCode!: string;

  @IsNotEmpty()
  pin!: string;
}
