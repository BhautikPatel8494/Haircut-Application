import { Body, Controller, Post, Res, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

import { storage } from "../utils/fileUpload";
import { AdminForgotPasswordDto, AdminLoginDto, AdminRegisterDto, AdminResetPasswordDto, AdminVerifyDto, CheckStylistStatusDto, CheckUserStatusDto, CustomerLoginDto, CustomerLoginWithPassword, CustomerRegisterDto, CustomerVerifyOTPConfirmDto, EnableDisableAdminDto, EnableDisableCustomerDto, EnableDisableStylistDto, StylistCheckPhoneNumberDto, StylistLoginDto, StylistRegisterDto, StylistVerifyOTPConfirmDto } from "./userAuth.dto";
import { UserAuthService } from "./userAuth.service";

@Controller("api")
export class UserAuthController {
    constructor(private readonly userAuthService: UserAuthService) { }

    @Post("register")
    @UseInterceptors(AnyFilesInterceptor(storage))
    async stylistRegister(@UploadedFiles() files: any, @Body() stylistDetail: StylistRegisterDto, @Res() res: Response) {
        return await this.userAuthService.stylistRegister(files, stylistDetail, res)
    }

    @Post("login")
    async stylistLogin(@Body() stylistLogin: StylistLoginDto, @Res() res: Response) {
        return await this.userAuthService.stylistLogin(stylistLogin, res)
    }

    @Post("verify-token")
    async stylistVerifyOTPConfirm(@Body() verifyOtp: StylistVerifyOTPConfirmDto, @Res() res: Response) {
        return await this.userAuthService.stylistVerifyOTPConfirm(verifyOtp, res)
    }

    @Post('check-phone-number')
    async stylistCheckPhoneNumber(@Body() checkPhoneNumber: StylistCheckPhoneNumberDto, @Res() res: Response) {
        return await this.userAuthService.stylistCheckPhoneNumber(checkPhoneNumber, res)
    }

    @Post('check-stylist-status')
    async checkStylistStatus(@Body() checkStatus: CheckStylistStatusDto, @Res() res: Response) {
        return await this.userAuthService.checkStylistStatus(checkStatus, res)
    }

    @Post('c-register')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async customerRegister(@UploadedFiles() files: any, @Body() customerLogin: CustomerRegisterDto, @Res() res: Response) {
        return await this.userAuthService.customerRegister(files, customerLogin, res)
    }

    @Post('c-login')
    async customerLogin(@Body() customerLogin: CustomerLoginDto, @Res() res: Response) {
        return await this.userAuthService.customerLogin(customerLogin, res)
    }

    @Post('c-verify-token')
    async customerVerifyOTPConfirm(@Body() verifyOtp: CustomerVerifyOTPConfirmDto, @Res() res: Response) {
        return await this.userAuthService.customerVerifyOTPConfirm(verifyOtp, res)
    }

    @Post('c-login-with-password')
    async customerLoginWithPassword(@Body() customerLoginDetail: CustomerLoginWithPassword, @Res() res: Response) {
        return await this.userAuthService.customerLoginWithPassword(customerLoginDetail, res)
    }

    @Post("a-register")
    async adminRegister(@Body() adminDetail: AdminRegisterDto, @Res() res: Response) {
        return await this.userAuthService.adminRegister(adminDetail, res)
    }

    @Post('a-login')
    async adminLogin(@Body() loginDetail: AdminLoginDto, @Res() res: Response) {
        return await this.userAuthService.adminLogin(loginDetail, res)
    }

    @Post("a-verify")
    async adminVerify(@Body() verifyAdmin: AdminVerifyDto, @Res() res: Response) {
        return await this.userAuthService.adminVerify(verifyAdmin, res)
    }

    @Post('a-forgot-password')
    async adminSendResetPasswordLink(@Body() adminForgotPassword: AdminForgotPasswordDto, @Res() res: Response) {
        return await this.userAuthService.adminSendResetPasswordLink(adminForgotPassword, res)
    }

    @Post('a-reset-password')
    async adminResetPassword(@Body() resetPasswordAdmin: AdminResetPasswordDto, @Res() res: Response) {
        return await this.userAuthService.adminResetPassword(resetPasswordAdmin, res)
    }

    @Post('enable-disable-admin')
    async enableDisableAdmin(@Body() adminDetail: EnableDisableAdminDto, @Res() res: Response) {
        return await this.userAuthService.enableDisableAdmin(adminDetail, res)
    }

    @Post('enable-disable-stylist')
    async enableDisableStylist(@Body() stylistDetail: EnableDisableStylistDto, @Res() res: Response) {
        return await this.userAuthService.enableDisableStylist(stylistDetail, res)
    }

    @Post('enable-disable-customer')
    async enableDisableCustomer(@Body() customerDetail: EnableDisableCustomerDto, @Res() res: Response) {
        return await this.userAuthService.enableDisableCustomer(customerDetail, res)
    }

    @Post("authorize")
    async checkUserStatus(@Body() checkStatus: CheckUserStatusDto, @Res() res: Response) {
        return await this.userAuthService.checkUserStatus(checkStatus, res)
    }
}