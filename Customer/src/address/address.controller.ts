import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { Response } from 'express'

import { CurrentUser } from "../authentication/guard/user.decorator";
import { AddressService } from "./address.service";
import { ActivateAddressDto, CreateAddressDto, DeleteAddressDto } from "./address.dto";
import { CurrentUserDto } from "../authentication/authentication.dto";

@Controller('api')
export class AddressController {
    constructor(private addressService: AddressService) { }

    @Post('add-location')
    async addLocation(@CurrentUser() user: CurrentUserDto, @Body() addressBody: CreateAddressDto, @Res() res: Response) {
        return await this.addressService.addLocation(user, addressBody, res)
    }

    @Get('list-addresses')
    async listAddresses(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.addressService.listAddresses(user, res);
    }

    @Post('delete-address')
    async deleteAddress(@CurrentUser() user: CurrentUserDto, @Body() addressBody: DeleteAddressDto, @Res() res: Response) {
        return await this.addressService.deleteAddress(user, addressBody, res);
    }

    @Post('activate-address')
    async activateAddress(@CurrentUser() user: CurrentUserDto, @Body() addressBody: ActivateAddressDto, @Res() res: Response) {
        return await this.addressService.activateAddress(user, addressBody, res);
    }
}