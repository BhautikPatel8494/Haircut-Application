import { IsNotEmpty } from "class-validator";

class AddressDto {
    active: boolean
}

export class UserDto {
    @IsNotEmpty()
    firstname: string

    experience: string

    distance: number

    location: {
        type: string,
        coordinates: ["", ""]
    }
    adressses: [AddressDto]
}