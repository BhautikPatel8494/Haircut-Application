import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { PaymentService } from './payment.service';
import { CurrentUser } from '../authentication/guard/user.decorator';
import { Public } from '../authentication/guard/public.decorator';
import { CancelChargeDto, EmergencyCancelDto, GetStripeAccountDto, PayoutToStylistDto, PayToStylistDto, UpdateCardDto } from './payment.dto';
import { CurrentUserDto } from '../authentication/authentication.dto';

@Controller('api')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Public()
  @Post('stripe-account-setup')
  async stripeAccontSetup(@Req() stripeAccountBody: Request, @Res() res: Response) {
    return await this.paymentService.stripeAccontSetup(stripeAccountBody, res);
  }

  @Public()
  @Post('get-stripe-account')
  async getStripeAccount(@Body() stripeAccountBody: GetStripeAccountDto, @Res() res: Response) {
    return await this.paymentService.getStripeAccount(stripeAccountBody, res);
  }

  @Public()
  @Post('payout')
  async payToStylist(@Body() payToStylist: PayoutToStylistDto, @Res() res: Response) {
    return await this.paymentService.payToStylist(payToStylist, res);
  }

  @Post('add-card')
  async addCard(@Req() addCard: Request, @Res() res: Response) {
    return await this.paymentService.addCard(addCard, res);
  }

  @Post('delete-card/:cardId')
  async deleteCard(@CurrentUser() user: CurrentUserDto, @Param('cardId') cardId: string, @Res() res: Response) {
    return await this.paymentService.deleteCard(user, cardId, res);
  }

  @Post('set-default-card')
  async setDefaultCard(@Req() setDefault: Request, @Res() res: Response) {
    return await this.paymentService.setDefaultCard(setDefault, res);
  }

  @Get('get-all-card')
  async getAllCard(@Req() getCards: Request, @Res() res: Response) {
    return await this.paymentService.getAllCard(getCards, res);
  }

  @Post('update-card')
  async updateCard(@CurrentUser() user: CurrentUserDto, @Body() updateCard: UpdateCardDto, @Res() res: Response) {
    return await this.paymentService.updateCard(user, updateCard, res);
  }

  @Post('paytip')
  async paytipsToStylist(@Body() payToStylist: PayToStylistDto, @Res() res: Response) {
    return await this.paymentService.paytipsToStylist(payToStylist, res);
  }

  @Post('refund')
  async refundAmount(@Req() req: Request, @Res() res: Response) {
    return await this.paymentService.refundAmount(req, res);
  }

  @Post('cancellationCharge')
  async cancellationCharge(@Body() cancelCharge: CancelChargeDto, @Res() res: Response) {
    return await this.paymentService.cancellationCharge(cancelCharge, res);
  }

  @Post('emergencyCancellation')
  async emergencyCancellation(@Body() emergencyCancel: EmergencyCancelDto, @Res() res: Response) {
    return await this.paymentService.emergencyCancellation(emergencyCancel, res);
  }
}
