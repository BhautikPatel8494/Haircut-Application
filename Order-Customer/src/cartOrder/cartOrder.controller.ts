import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { CurrentUser } from '../authentication/gaurd/user.decorator';
import { CartOrderService } from './cartOrder.service';
import { AddServiceToCartDto, UpdateCartItemDto } from './cartOrder.dto';
import { CurrentUserDto } from '../authentication/authentication.dto';

@Controller('api')
export class CartOrderController {
  constructor(private readonly cartOrderService: CartOrderService) { }

  @Post('add-service-to-cart')
  async addServiceToCart(@CurrentUser() user: CurrentUserDto, @Body() addCartBody: AddServiceToCartDto, @Res() res: Response) {
    return await this.cartOrderService.addServiceToCart(user, addCartBody, res);
  }

  @Get('get-cart')
  async getCart(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
    return await this.cartOrderService.getCart(user, res);
  }

  @Get('clear-cart')
  async clearCart(@CurrentUser() user: CurrentUserDto, @Res() res: Response) {
    return await this.cartOrderService.clearCart(user, res);
  }

  @Post('update-cart-item')
  async updateCartItem(@CurrentUser() user: CurrentUserDto, @Body() updateCartBody: UpdateCartItemDto, @Res() res: Response) {
    return await this.cartOrderService.updateCartItem(updateCartBody, user, res);
  }
}
