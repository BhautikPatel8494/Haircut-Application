import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/authentication/gaurd/user.decorator';
import { UserSchema } from 'src/Schema/userModel.schema';
import { CartOrderService } from './cartOrder.service';

@Controller()
export class CartOrderController {
  constructor(private readonly cartOrderService: CartOrderService) {}

  @Post('add-service-to-cart')
  async addServiceToCart(
    @CurrentUser() user: Object,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.cartOrderService.addServiceToCart(req, user, res);
  }

  @Get('get-cart')
  async getCart(
    @CurrentUser() user: Object,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.cartOrderService.getCart(req, user, res);
  }

  @Get('clear-cart')
  async clearCart(
    @CurrentUser() user: Object,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.cartOrderService.clearCart(req, user, res);
  }

  @Post('update-cart-item')
  async updateCartItem(
    @CurrentUser() user: Object,
    @Req() req: Request,
    @Res() res: Response,
  ){
      return await this.cartOrderService.updateCartItem(req, user, res);
  }
}
