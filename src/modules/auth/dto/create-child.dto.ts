import { IsNotEmpty, MinLength } from "class-validator";

export class CreateChildDTO {
  parentId!: string;

  @IsNotEmpty()
  @MinLength(3, {message:"Name is to short!"})
  name!: string
}
