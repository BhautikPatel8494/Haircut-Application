import { Body, Controller, Post, Res, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

import { storage } from "src/utils/fileUpload";
import { adminForgotPasswordDto, adminLoginDto, adminRegisterDto, adminResetPasswordDto, adminVerifyDto, checkStylistStatusDto, checkUserStatusDto, customerLoginDto, customerLoginWithPassword, customerRegisterDto, customerVerifyOTPConfirmDto, enableDisableAdminDto, enableDisableCustomerDto, enableDisableStylistDto, stylistCheckPhoneNumberDto, stylistLoginDto, stylistRegisterDto, stylistVerifyOTPConfirmDto } from "./userAuth.dto";
import { UserAuthService } from "./userAuth.service";

@Controller("api")

export class UsertAuthController {
    constructor(private readonly userAuthService: UserAuthService) { }

    @Post("register")
    @UseInterceptors(AnyFilesInterceptor(storage))
    async stylistRegister(@UploadedFiles() files: any, @Body() stylistDetail: stylistRegisterDto, @Res() res: Response) {
        return await this.userAuthService.stylistRegister(files, stylistDetail, res)
    }

    @Post("login")
    async stylistLogin(@Body() stylistLogin: stylistLoginDto, @Res() res: Response) {
        return await this.userAuthService.stylistLogin(stylistLogin, res)
    }

    @Post("verify-token")
    async stylistVerifyOTPConfirm(@Body() verifyOtp: stylistVerifyOTPConfirmDto, @Res() res: Response) {
        return await this.userAuthService.stylistVerifyOTPConfirm(verifyOtp, res)
    }

    @Post('check-phone-number')
    async stylistCheckPhoneNumber(@Body() checkPhoneNumber: stylistCheckPhoneNumberDto, @Res() res: Response) {
        return await this.userAuthService.stylistCheckPhoneNumber(checkPhoneNumber, res)
    }

    @Post('check-stylist-status')
    async checkStylistStatus(@Body() checkStatus: checkStylistStatusDto, @Res() res: Response) {
        return await this.userAuthService.checkStylistStatus(checkStatus, res)
    }

    @Post('c-register')
    @UseInterceptors(AnyFilesInterceptor(storage))
    async customerRegister(@UploadedFiles() files: any, @Body() customerLogin: customerRegisterDto, @Res() res: Response) {
        return await this.userAuthService.customerRegister(files, customerLogin, res)
    }

    @Post('c-login')
    async customerLogin(@Body() customerLogin: customerLoginDto, @Res() res: Response) {
        return await this.userAuthService.customerLogin(customerLogin, res)
    }

    @Post('c-verify-token')
    async customerVerifyOTPConfirm(@Body() verifyOtp: customerVerifyOTPConfirmDto, @Res() res: Response) {
        return await this.userAuthService.customerVerifyOTPConfirm(verifyOtp, res)
    }

    @Post('c-login-with-password')
    async customerLoginWithPassword(@Body() customerLoginDetail: customerLoginWithPassword, @Res() res: Response) {
        return await this.userAuthService.customerLoginWithPassword(customerLoginDetail, res)
    }

    @Post("a-register")
    async adminRegister(@Body() adminDetail: adminRegisterDto, @Res() res: Response) {
        return await this.userAuthService.adminRegister(adminDetail, res)
    }

    @Post('a-login')
    async adminLogin(@Body() loginDetail: adminLoginDto, @Res() res: Response) {
        return await this.userAuthService.adminLogin(loginDetail, res)
    }

    @Post("a-verify")
    async adminVerify(@Body() verifyAdmin: adminVerifyDto, @Res() res: Response) {
        return await this.userAuthService.adminVerify(verifyAdmin, res)
    }

    @Post('a-forgot-password')
    async adminSendResetPasswordLink(@Body() adminForgotPassword: adminForgotPasswordDto, @Res() res: Response) {
        return await this.userAuthService.adminSendResetPasswordLink(adminForgotPassword, res)
    }

    @Post('a-reset-password')
    async adminResetPassword(@Body() resetPasswordAdmin: adminResetPasswordDto, @Res() res: Response){
        return await this.userAuthService.adminResetPassword(resetPasswordAdmin,res)
    }

    @Post('enable-disable-admin')
    async enableDisableAdmin(@Body() adminDetail: enableDisableAdminDto, @Res() res: Response){
        return await this.userAuthService.enableDisableAdmin(adminDetail,res)
    }

    @Post('enable-disable-stylist')
    async enableDisableStylist(@Body() stylistDetail: enableDisableStylistDto, @Res() res: Response){
        return await this.userAuthService.enableDisableStylist(stylistDetail,res)
    }

    @Post('enable-disable-customer')
    async enableDisableCustomer(@Body() customerDetail: enableDisableCustomerDto, @Res() res: Response){
        return await this.userAuthService.enableDisableCustomer(customerDetail,res)
    }
    
    @Post("authorize")
    async checkUserStatus(@Body() checkStatus: checkUserStatusDto, @Res() res: Response){
        return await this.userAuthService.checkUserStatus(checkStatus,res)
    }
}