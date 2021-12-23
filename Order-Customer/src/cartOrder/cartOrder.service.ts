import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { CurrentUserDto } from 'src/authentication/authentication.dto';

import { Configs } from 'src/schema/config.schema';
import { CustomerCarts } from 'src/schema/customerCart.schema';
import { CustomServices } from 'src/schema/customService.schema';
import { Services } from 'src/schema/service.schema';
import { Users } from 'src/schema/user.schema';
import { ApiResponse } from 'src/utils/apiResponse.service';
import { AddServiceToCartDto, UpdateCartItemDto } from './cartOrder.dto';

@Injectable()
export class CartOrderService {
  constructor(
    @InjectModel('customerCart') private readonly customerCartModel: Model<CustomerCarts>,
    @InjectModel('user') private readonly userModel: Model<Users>,
    @InjectModel('config') private readonly configModel: Model<Configs>,
    @InjectModel('customService') private readonly customServiceModel: Model<CustomServices>,
    @InjectModel('service') private readonly serviceModel: Model<Services>,
    private apiResponse: ApiResponse,
  ) { }

  async getCartLocationStylistAndCat(cart_id: string) {
    return this.customerCartModel.aggregate([{ $match: { _id: cart_id } },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    }, { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'service_providers',
        localField: 'stylist_id',
        foreignField: '_id',
        as: 'stylist',
      },
    }, { $unwind: { path: '$stylist', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'service_category_id',
        foreignField: '_id',
        as: 'category',
      },
    }, { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        items: {
          $cond: {
            if: '$user.addresses',
            then: {
              $filter: {
                input: '$user.addresses',
                as: 'selected_address',
                cond: { $eq: ['$$selected_address._id', '$location_id'] },
              },
            },
            else: [],
          },
        },
        full_name: {
          $cond: {
            if: '$stylist.full_name',
            then: '$stylist.full_name',
            else: '',
          },
        },
        category_name: { $cond: { if: '$category.name', then: '$category.name', else: '' } },
      },
    },
    ]);
  }

  async updateCartTotalDetails(userId: string) {
    const cart = await this.customerCartModel.findOne({ user_id: userId });
    if (cart) {
      let totalService = 0;
      let serviceCharges = 0;
      let totalBill = 0;
      let convenienceFee = 0;
      let discount = 0;
      let voucherAmount = 0;
      let tax = 0;

      if (cart.cart_profiles) {
        for (var i = 0; i < cart.cart_profiles.length; i++) {
          totalService = totalService + cart.cart_profiles[i].cart_items.length;
          if (cart.cart_profiles[i].cart_items) {
            for (var j = 0; j < cart.cart_profiles[i].cart_items.length; j++) {
              serviceCharges = serviceCharges + cart.cart_profiles[i].cart_items[j].price;
            }
          }
        }
        totalBill = serviceCharges + convenienceFee + discount + voucherAmount + tax;
      }
      cart.bill_details.total_service = totalService;
      cart.bill_details.service_charges = serviceCharges;
      cart.bill_details.convenience_fee = convenienceFee;
      cart.bill_details.discount = discount;
      cart.bill_details.voucher_amount = voucherAmount;
      cart.bill_details.tax = tax;
      cart.bill_details.total_bill = totalBill;
      cart.save();
      if (totalBill == 0 || totalBill === 0) {
        await this.customerCartModel.deleteOne({ user_id: userId });
      }
    }
  }

  async addServiceToCart(addCartBody: AddServiceToCartDto, user: CurrentUserDto, res: Response) {
    try {
      const { type, service_id, quantity, location_id, stylist_type, profile_id, stylist_id, service_category_id,
        title, sale_price, regular_price, firstname, lastname, user_type, profile } = addCartBody;

      let isCustom = type ? true : false;
      let service;
      if (isCustom) {
        service = await this.customServiceModel.findOne({ _id: service_id }, { quantity: 1 });
      } else {
        service = await this.serviceModel.findOne({ _id: service_id }, { quantity: 1 });
      }
      if (service && service.quantity > 0) {
        if (service.quantity >= quantity) {
          console.log('check');
        } else {
          return this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
        }
      }
      const cart = await this.customerCartModel.findOne({ user_id: user._id }, { cart_profiles: 1, location_id: 1, stylist_type: 1 });
      if (cart != null) {
        if (cart.location_id != location_id) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Location should be same!');
        }
        if (cart.stylist_type != stylist_type) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Stylist type should be same!');
        }

        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);
        let addressType = cartInfo[0] && cartInfo[0].items.length > 0 ? cartInfo[0].items[0].address_type : '';
        let stylistName = cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let categoryName = cartInfo[0] && cartInfo[0].category_name ? cartInfo[0].category_name : '';
        const profileCart = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': profile_id });
        console.log('profileCart :>> ', profileCart);
        if (profileCart != null) {
          if (profileCart.cart_profiles) {
            for (var i = 0; i < profileCart.cart_profiles.length; i++) {
              if (profileCart.cart_profiles[i].profile_id.toString() == profile_id) {
                let alredayExit: any = profileCart.cart_profiles[i].cart_items.find((elem) => {
                  if (elem.service_id.toString() === service_id) {
                    return elem;
                  }
                });
                if (alredayExit) {
                  if (quantity == 0) {
                    const userResponse = await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id), 'cart_profiles.cart_items.service_id': new Types.ObjectId(alredayExit.service_id) },
                      {
                        $pull: {
                          'cart_profiles.$.cart_items': {
                            service_id: alredayExit.service_id,
                          },
                        },
                      },
                    );
                    if (userResponse) {
                      this.updateCartTotalDetails(user._id);
                      return this.apiResponse.successResponseWithNoData(res, 'Service Removed.');
                    }
                  } else {
                    let updatingData = {
                      service_id: service_id,
                      stylist_id: stylist_id ? stylist_id : null,
                      location_id: location_id ? location_id : null,
                      service_category_id: service_category_id ? service_category_id : null,
                      profile_id: profile_id,
                      address_type: addressType,
                      stylist_name: stylistName,
                      category_name: categoryName,
                      title: title,
                      quantity: quantity,
                      price: sale_price * quantity,
                      sale_price: sale_price,
                      regular_price: regular_price,
                      service_type: type ? type : 'simple-service',
                    };

                    const responseUpdate = await this.customerCartModel.updateOne({
                      user_id: user._id,
                      cart_profiles: {
                        $elemMatch: {
                          profile_id: profile_id, 'cart_items._id': alredayExit._id
                        },
                      },
                    },
                      {
                        // ***********************REMAINING***************
                        $set: {
                          'cart_profiles.$[outer].cart_items.$[inner].quantity': quantity,
                          'cart_profiles.$[outer].cart_items.$[inner].price': sale_price * quantity,
                        },
                      },
                      {
                        arrayFilters: [{ 'outer.profile_id': profile_id }, { 'inner._id': alredayExit._id }],
                      },
                    );
                    if (responseUpdate) {
                      this.updateCartTotalDetails(user._id);
                      return this.apiResponse.successResponseWithData(res, 'Service updated.', updatingData);
                    }
                  }
                } else {
                  const cartPushArray = {
                    _id: new Types.ObjectId().toString(),
                    service_id: service_id,
                    title: title,
                    is_custom: isCustom,
                    quantity: quantity,
                    price: sale_price * quantity,
                    sale_price: sale_price,
                    regular_price: regular_price,
                  }
                  profileCart.cart_profiles[i].cart_items.push(cartPushArray);

                  await profileCart.save();
                  this.updateCartTotalDetails(user._id);

                  let updatingData = {
                    service_id: service_id,
                    stylist_id: stylist_id ? stylist_id : null,
                    location_id: location_id ? location_id : null,
                    service_category_id: service_category_id ? service_category_id : null,
                    addressType,
                    stylistName,
                    categoryName,
                    title: title,
                    quantity: quantity,
                    price: sale_price * quantity,
                    sale_price: sale_price,
                    regular_price: regular_price,
                    profile_id: profile_id,
                  };
                  return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData,
                  );
                }
              }
            }
          }
        } else {
          const cartModelUpdate = await this.customerCartModel.updateOne({ user_id: user._id },
            {
              $push: {
                cart_profiles: {
                  firstname: firstname,
                  lastname: lastname,
                  profile_id: profile_id,
                  user_type: user_type ? user_type : '',
                  profile: profile ? profile : '',
                  cart_items: [
                    {
                      service_id: service_id,
                      title: title,
                      quantity: quantity,
                      price: sale_price * quantity,
                      sale_price: sale_price,
                      regular_price: regular_price,
                      is_custom: type ? true : false,
                    },
                  ],
                },
              },
            },
          );
          this.updateCartTotalDetails(user._id);
          let updatingData = {
            service_id: service_id,
            stylist_id: stylist_id ? stylist_id : null,
            location_id: location_id ? location_id : null,
            service_category_id: service_category_id ? service_category_id : null,
            addressType,
            stylistName,
            categoryName,
            title: title,
            quantity: quantity,
            price: sale_price * quantity,
            sale_price: sale_price,
            regular_price: regular_price,
            profile_id: profile_id,
          };
          return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData,
          );
        }
      } else {
        const createdCart = await this.customerCartModel.create({
          user_id: user._id,
          stylist_id: stylist_id ? stylist_id : null,
          location_id: location_id ? location_id : null,
          service_category_id: service_category_id ? service_category_id : null,
          stylist_type: stylist_type ? stylist_type : null,
          service_type: type ? type : 'simple-service',
          bill_details: {},
          cart_profiles: [{
            firstname: firstname,
            lastname: lastname,
            profile_id: profile_id,
            _id: new Types.ObjectId(),
            profile: profile ? profile : '',
            user_type: user_type ? user_type : '',
            cart_items: [{
              _id: new Types.ObjectId(),
              service_id: service_id,
              title: title,
              quantity: quantity,
              price:
                sale_price * quantity,
              sale_price: sale_price,
              regular_price: regular_price,
              is_custom: type ? true : false,
            },
            ],
          },
          ],
        });
        this.updateCartTotalDetails(user._id);
        let cart = await this.getCartLocationStylistAndCat(createdCart._id);
        let addressType = cart[0] ? cart[0].items[0]?.address_type : '';
        let stylistName = cart[0] ? cart[0].full_name : '';
        let categoryName = cart[0] ? cart[0].category_name : '';
        let updatingData = {
          service_id: service_id,
          stylist_id: stylist_id ? stylist_id : null,
          location_id: location_id ? location_id : null,
          service_category_id: service_category_id ? service_category_id : null,
          service_type: type ? type : 'simple-service',
          addressType,
          stylistName,
          categoryName,
          stylist_type: stylist_type ? stylist_type : null,
          title: title,
          quantity: quantity,
          price: sale_price * quantity,
          sale_price: sale_price,
          regular_price: regular_price,
          profile_id: profile_id,
        };
        return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData);
      }
    } catch (err) {
      return this.apiResponse.ErrorResponseWithoutData(res, err.message);
    }
  }

  async getCart(user: CurrentUserDto, res: Response) {
    try {
      const cart = await this.customerCartModel.findOne({ user_id: user._id });
      let wallet = await this.userModel.findOne({ _id: user._id }, { wallet_balance: 1 });
      if (cart != null) {
        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);
        let addressType = cartInfo[0] && cartInfo[0].items.length > 0 ? cartInfo[0].items[0].address_type : '';
        let stylistName = cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let categoryName = cartInfo[0] && cartInfo[0].category_name ? cartInfo[0].category_name : '';
        const billData = await this.configModel.findOne({});
        let bill_details = {
          ...JSON.parse(JSON.stringify(cart.bill_details)),
          convenience_fee: billData.platform_convenience_fees,
          tax: billData.platform_service_tax,
        };
        let result = {
          _id: cart._id,
          user_id: cart.user_id,
          addressType,
          stylistName,
          categoryName,
          wallet_balance: wallet.wallet_balance ? wallet.wallet_balance : 0,
          stylist_id: cart.stylist_id,
          location_id: cart.location_id,
          service_category_id: cart.service_category_id ? cart.service_category_id : null,
          stylist_type: cart.stylist_type,
          bill_details: bill_details,
          cart_profiles: cart.cart_profiles,
        };
        return this.apiResponse.successResponseWithData(res, 'Cart found successfully.', result);
      } else {
        return this.apiResponse.successResponseWithData(res, 'No cart item found.', {});
      }
    } catch (err) {
      return this.apiResponse.ErrorResponse(res, err.message, {});
    }
  }

  async clearCart(user: CurrentUserDto, res: Response) {
    try {
      await this.customerCartModel.deleteOne({ user_id: user._id });
      return this.apiResponse.successResponseWithNoData(res, 'Cart cleared successfully.');
    } catch (err) {
      return this.apiResponse.successResponseWithNoData(res, err.message);
    }
  }

  async updateCartItem(updateCartBody: UpdateCartItemDto, user: CurrentUserDto, res: Response) {
    const { type, profile_id, cart_item_id, quantity, price } = updateCartBody;
    try {
      let serviceType = type ? type : 'simple-service';
      let isCustom = type ? true : false;
      let service;
      let cartItem = await this.customerCartModel.aggregate([{ $match: { user_id: user._id } },
      {
        $addFields: {
          profiles: {
            $filter: {
              input: '$cart_profiles',
              as: 'profiles',
              cond: { $eq: ['$$profiles.profile_id', profile_id] },
            },
          },
        },
      }, { $unwind: { path: '$profiles' } },
      {
        $project: {
          items: {
            $filter: {
              input: '$profiles.cart_items',
              as: 'item',
              cond: { $eq: ['$$item._id', cart_item_id] },
            },
          },
        },
      }, { $unwind: { path: '$items' } },
      ]);
      if (cartItem.length > 0 && cartItem[0].items && cartItem[0].items.quantity > 0) {
        if (cartItem[0].items.is_custom == 'true') {
          service = await this.customServiceModel.findOne({ _id: cartItem[0].items.service_id }, { quantity: 1 });
        } else {
          service = await this.serviceModel.findOne({ _id: cartItem[0].items.service_id }, { quantity: 1 });
        }
        if (service && service.quantity > 0) {
          if (service.quantity >= quantity) {
            console.log('check');
          } else {
            this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
            return;
          }
        }
      }
      const cart = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': profile_id });
      if (cart) {
        const billData = await this.configModel.findOne({});
        let billDetails = {
          ...JSON.parse(JSON.stringify(cart.bill_details)),
          convenience_fee: billData.platform_convenience_fees,
          tax: billData.platform_service_tax,
        };
        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);

        let addressType = cartInfo[0] && cartInfo[0].items.length > 0 ? cartInfo[0].items[0].address_type : '';
        let stylistName = cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let categoryName = cartInfo[0] && cartInfo[0].category_name ? cartInfo[0].category_name : '';
        if (quantity == 0) {
          const userResponse = await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': profile_id, 'cart_profiles.cart_items._id': cart_item_id },
            {
              $pull: {
                'cart_profiles.$.cart_items': {
                  _id: cart_item_id,
                },
              },
            },
          );
          let cartPro = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id) });
          for (let profile of cartPro.cart_profiles) {
            if (profile.cart_items.length > 0) {
              await this.customerCartModel.updateOne({ user_id: user._id },
                {
                  $pull: {
                    cart_profiles: { profile_id: profile.profile_id },
                  },
                },
              );
            }
          }
          let cartSaved = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id) });
          let newResult;
          if (!cartSaved) {
            newResult = {};
          } else {
            newResult = {
              service_type: cartSaved.service_type,
              _id: cartSaved._id,
              user_id: cartSaved.user_id,
              stylist_id: cartSaved.stylist_id,
              location_id: cartSaved.location_id,
              service_category_id: cartSaved.service_category_id,
              stylist_type: cartSaved.stylist_type,
              address_type: addressType,
              stylistName,
              categoryName,
              bill_details: billDetails,
              cart_profiles: cartSaved.cart_profiles,
            };
          }
          await this.updateCartTotalDetails(user._id);
          return this.apiResponse.successResponseWithData(res, 'Service Removed.', newResult);
        } else {
          for (var i = 0; i < cart.cart_profiles.length; i++) {
            if (cart.cart_profiles[i].profile_id.toString() === profile_id && cart.cart_profiles[i].cart_items.length) {
              for (var j = 0; j < cart.cart_profiles[i].cart_items.length; j++) {
                if (cart.cart_profiles[i].cart_items[j]._id.toString() == cart_item_id) {
                  cart.cart_profiles[i].cart_items[j].quantity = quantity;
                  cart.cart_profiles[i].cart_items[j].price = quantity * price;
                }
              }
            }
          }
          const cartSaved = await cart.save();
          this.updateCartTotalDetails(user._id);
          let newResult = {
            service_type: cartSaved.service_type,
            _id: cartSaved._id,
            user_id: cartSaved.user_id,
            stylist_id: cartSaved.stylist_id,
            location_id: cartSaved.location_id,
            service_category_id: cartSaved.service_category_id,
            stylist_type: cartSaved.stylist_type,
            address_type: addressType,
            stylistName,
            categoryName,
            bill_details: billDetails,
            cart_profiles: cartSaved.cart_profiles,
          };
          return this.apiResponse.successResponseWithData(res, 'Cart item updated successfully.', newResult);
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'Something went wrong!', {});
      }
    } catch (err) {
      return this.apiResponse.ErrorResponse(res, err.message, {});
    }
  }
}
