import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/authentication/gaurd/user.decorator';
import { BookingOrderService } from './bookingOrder.service';

@Controller()
export class BookingOrderController {
  constructor(private readonly bookingOrderService: BookingOrderService) { }

  @Post('check-stylist-availability')
  async checkStylistAvailabel(@Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.checkStylistAvailabel(req, res);
  }

  @Post('create-order')
  async createOrder(@CurrentUser() user: Object, @Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.createOrder(req, user, res);
  }

  @Post('change-order-status')
  async changeOrderStatus(@Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.changeBookingStatus(req, res);
  }

  @Post('create-direct-order')
  async createDirectOrder(@CurrentUser() user: Object, @Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.createDirectOrder(req, user, res);
  }

  @Post('cancel-order')
  async cancleOrder(@Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.cancleOrder(req, res);
  }

  @Post('confirm-otp-start-service')
  async confirmOtpToStartService(@Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.confirmOtpToStartService(req, res);
  }

  @Post("rebook-order")
  async reBookingOrder(@CurrentUser() user: Object, @Req() req: Request, @Res() res: Response) {
    return await this.bookingOrderService.reBookingOrder(req, user, res)
  }
}
