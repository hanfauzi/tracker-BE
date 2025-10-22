import { IsEmail, IsNotEmpty } from "class-validator";

export class RegisterDTO { 
    @IsEmail()
    @IsNotEmpty()
    email! : string;
}