import { Controller, Post, Req, Res, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";

import { storage } from "src/utils/fileUpload";
import { UserAuthService } from "./userAuth.service";

@Controller("api")

export class UsertAuthController {
    constructor(private readonly userAuthService: UserAuthService) { }

    @Post("register")
    @UseInterceptors(AnyFilesInterceptor(storage))
    async stylistRegister(@UploadedFiles() files: any, @Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.stylistRegister(files, req, res)
    }

    @Post("login")
    async stylistLogin(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.stylistLogin(req, res)
    }

    @Post("verify-token")
    async stylistVerifyOTPConfirm(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.stylistVerifyOTPConfirm(req, res)
    }

    @Post('check-phone-number')
    async stylistCheckPhoneNumber(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.stylistCheckPhoneNumber(req, res)
    }

    @Post('check-stylist-status')
    async checkStylistStatus(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.checkStylistStatus(req, res)
    }

    @Post('c-register')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async customerRegister(@UploadedFiles() files: any, @Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.customerRegister(files, req, res)
    }

    @Post('c-login')
    async customerLogin(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.customerLogin(req, res)
    }

    @Post('c-verify-token')
    async customerVerifyOTPConfirm(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.customerVerifyOTPConfirm(req, res)
    }

    @Post('c-login-with-password')
    async customerLoginWithPassword(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.customerLoginWithPassword(req, res)
    }

    @Post("a-register")
    async adminRegister(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.adminRegister(req, res)
    }

    @Post('a-login')
    async adminLogin(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.adminLogin(req, res)
    }

    @Post("a-verify")
    async adminVerify(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.adminVerify(req, res)
    }

    @Post('a-forgot-password')
    async adminSendResetPasswordLink(@Req() req: Request, @Res() res: Response) {
        return await this.userAuthService.adminSendResetPasswordLink(req, res)
    }

    @Post('a-reset-password')
    async adminResetPassword(@Req() req: Request, @Res() res: Response){
        return await this.userAuthService.adminResetPassword(req,res)
    }

    @Post('enable-disable-admin')
    async enableDisableAdmin(@Req() req: Request, @Res() res: Response){
        return await this.userAuthService.enableDisableAdmin(req,res)
    }

    @Post('enable-disable-stylist')
    async enableDisableStylist(@Req() req: Request, @Res() res: Response){
        return await this.userAuthService.enableDisableStylist(req,res)
    }

    @Post('enable-disable-customer')
    async enableDisableCustomer(@Req() req: Request, @Res() res: Response){
        return await this.userAuthService.enableDisableCustomer(req,res)
    }
    
    @Post("authorize")
    async checkUserStatus(@Req() req: Request, @Res() res: Response){
        return await this.userAuthService.checkUserStatus(req,res)
    }
}