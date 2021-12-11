import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUserDto } from "../home/dto/currentUser";
import { AuthenticationService } from "./authentication.service";
import { CurrentUser } from "./guard/user.decorator";

@Controller('api')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) { }

    @Post('c-update-profile-image')
    async customerUpdateProfileImage(@CurrentUser() user: CurrentUserDto, @Req() req: any, @Res() res: Response) {
        return await this.authenticationService.customerUpdateProfileImage(user, req, res);
    }

    @Post('c-update-profile')
    async customerUpdateProfile(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.authenticationService.customerUpdateProfile(user, req, res)
    }

    @Post('add-family-member')
    async addFamilyMember(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.authenticationService.addFamilyMember(user, req, res);
    }

    @Post('update-family-member-profile')
    async updateFamilyMemberProfile(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.authenticationService.updateFamilyMemberProfile(user, req, res)
    }

    @Get('list-all-profiles')
    async listAllProfiles(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.authenticationService.listAllProfiles(user, res);
    }

    @Post('delete-family-member-profile')
    async deleteFamilyMemberProfile(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.authenticationService.deleteFamilyMemberProfile(user, req, res);
    }

    @Post('make-profile-default')
    async makeProfileDefault(@CurrentUser() user: CurrentUserDto, @Req() req: Request, @Res() res: Response) {
        return await this.authenticationService.makeProfileDefault(user, req, res);
    }
}