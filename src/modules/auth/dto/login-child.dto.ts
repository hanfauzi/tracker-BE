import { IsNotEmpty, MinLength } from "class-validator";

export class LoginChildDTO {
  @IsNotEmpty()
  childCode!: string;

  @IsNotEmpty()
  pin!: string;
}
