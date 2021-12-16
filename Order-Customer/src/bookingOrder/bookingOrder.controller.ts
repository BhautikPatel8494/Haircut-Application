import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { CurrentUser } from 'src/authentication/gaurd/user.decorator';
import { BookingOrderService } from './bookingOrder.service';
import { CancleOrderDto, ChangeStatusDto, ConfirmOtpServiceDto, CreateDirectOrderDto, CreateOrderDto, FilterDto, RebookingOrderDto } from './bookingOrder.dto';
import { CurrentUserDto } from 'src/authentication/authentication.dto';


@Controller('api')
export class BookingOrderController {
  constructor(private readonly bookingOrderService: BookingOrderService) { }

  @Post('check-stylist-availability')
  async checkStylistAvailabel(@Body() filterBody: FilterDto, @Res() res: Response) {
    return await this.bookingOrderService.checkStylistAvailabel(filterBody, res);
  }

  @Post('create-order')
  async createOrder(@CurrentUser() user: CurrentUserDto, @Body() orderBody: CreateOrderDto, @Res() res: Response) {
    return await this.bookingOrderService.createOrder(orderBody, user, res);
  }

  @Post('change-order-status')
  async changeOrderStatus(@Body() chnageStatusBody: ChangeStatusDto, @Res() res: Response) {
    return await this.bookingOrderService.changeBookingStatus(chnageStatusBody, res);
  }

  @Post('create-direct-order')
  async createDirectOrder(@CurrentUser() user: CurrentUserDto, @Body() createDirectOrder: CreateDirectOrderDto, @Res() res: Response) {
    return await this.bookingOrderService.createDirectOrder(createDirectOrder, user, res);
  }

  @Post('cancel-order')
  async cancleOrder(@Body() cancleOrder: CancleOrderDto, @Res() res: Response) {
    return await this.bookingOrderService.cancleOrder(cancleOrder, res);
  }

  @Post('confirm-otp-start-service')
  async confirmOtpToStartService(@Body() startService: ConfirmOtpServiceDto, @Res() res: Response) {
    return await this.bookingOrderService.confirmOtpToStartService(startService, res);
  }

  @Post("rebook-order")
  async reBookingOrder(@CurrentUser() user: CurrentUserDto, @Body() rebookingOrder: RebookingOrderDto, @Res() res: Response) {
    return await this.bookingOrderService.reBookingOrder(rebookingOrder, user, res)
  }
}
