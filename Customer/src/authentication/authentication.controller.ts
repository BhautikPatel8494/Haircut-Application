import { Body, Controller, Get, Post, Req, Res, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { Request, Response } from "express";

import { AuthenticationService } from "./authentication.service";
import { CurrentUser } from "./guard/user.decorator";
import { CommonMemberDto, CreateFamilyMemberDto, CurrentUserDto, UpdateFamilyMemberDto, UpdateUserDto } from "./authentication.dto";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { storage } from "../utils/upload";

@Controller('api')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService
    ) { }

    @Post('c-update-profile-image')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async customerUpdateProfileImage(@CurrentUser() user: CurrentUserDto, @UploadedFiles() files: any, @Res() res: Response) {
        return await this.authenticationService.customerUpdateProfileImage(user, files, res);
    }

    @Post('c-update-profile')
    async customerUpdateProfile(@CurrentUser() user: CurrentUserDto, @Body() userBody: UpdateUserDto, @Res() res: Response) {
        return await this.authenticationService.customerUpdateProfile(user, userBody, res)
    }

    @Post('add-family-member')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async addFamilyMember(@CurrentUser() user: CurrentUserDto, @UploadedFiles() files: any, @Body() familyMemberBody: CreateFamilyMemberDto, @Res() res: Response) {
        return await this.authenticationService.addFamilyMember(user, files, familyMemberBody, res);
    }

    @Post('update-family-member-profile')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async updateFamilyMemberProfile(@CurrentUser() user: CurrentUserDto, @UploadedFiles() files: any, @Body() familyMemberBody: UpdateFamilyMemberDto, @Res() res: Response) {
        return await this.authenticationService.updateFamilyMemberProfile(user, files, familyMemberBody, res)
    }

    @Get('list-all-profiles')
    async listAllProfiles(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.authenticationService.listAllProfiles(user, res);
    }

    @Post('delete-family-member-profile')
    async deleteFamilyMemberProfile(@CurrentUser() user: CurrentUserDto, @Body() familyMemberBody: CommonMemberDto, @Res() res: Response) {
        return await this.authenticationService.deleteFamilyMemberProfile(user, familyMemberBody, res);
    }

    @Post('make-profile-default')
    async makeProfileDefault(@CurrentUser() user: CurrentUserDto, @Body() familyMemberBody: CommonMemberDto, @Res() res: Response) {
        return await this.authenticationService.makeProfileDefault(user, familyMemberBody, res);
    }

    @Get('get-profile')
    async getProfile(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
        return await this.authenticationService.getProfile(user, res);
    }

    @Post('booking-listing')
    async bookingListing(@CurrentUser() user: CurrentUserDto, @Req() filterBody: Request, @Res() res: Response) {
        return await this.authenticationService.bookingListing(user, filterBody, res);
    }
}