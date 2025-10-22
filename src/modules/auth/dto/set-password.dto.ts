import {  IsNotEmpty, IsString, Max, Min, MinLength } from "class-validator";

export class SetPasswordDTO { 
@IsNotEmpty()
@MinLength(3, { message: "Name is too short!"})
name!: string;

@IsNotEmpty()
@IsString()    
phoneNumber!: string;

@IsNotEmpty()
@IsString()
@MinLength(8, { message:"Password is to short!" })
password!: string
}