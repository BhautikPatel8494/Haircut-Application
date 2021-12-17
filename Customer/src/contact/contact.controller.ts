import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { Response } from "express";

import { ContactService } from "./contact.service";
import { CurrentUser } from "../authentication/guard/user.decorator";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { CreateContactDto, DeleteContact } from "./contact.dto";

@Controller('api')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    @Post('create-contact')
    async createContact(@CurrentUser() user: CurrentUserDto, @Body() contactBody: CreateContactDto, @Res() res: Response) {
        return await this.contactService.createContact(user, contactBody, res);
    }

    @Get('list-contacts')
    async listContacts(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.contactService.listContacts(user, res)
    }

    @Post('delete-contact')
    async deleteContact(@Body() contactBody: DeleteContact, @Res() res: Response) {
        return await this.contactService.deleteContact(contactBody, res)
    }
}