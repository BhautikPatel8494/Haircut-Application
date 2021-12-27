import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';

import { CurrentUserDto } from '../authentication/authentication.dto';
import { Configs } from '../schema/config.schema';
import { CustomerCarts } from '../schema/customerCart.schema';
import { CustomServices } from '../schema/customService.schema';
import { Services } from '../schema/service.schema';
import { Users } from '../schema/user.schema';
import { ApiResponse } from '../utils/apiResponse.service';
import { AddServiceToCartDto, UpdateCartItemDto } from './cartOrder.dto';

@Injectable()
export class CartOrderService {
  constructor(
    @InjectModel('CustomerCart') private readonly customerCartModel: Model<CustomerCarts>,
    @InjectModel('User') private readonly userModel: Model<Users>,
    @InjectModel('Config') private readonly configModel: Model<Configs>,
    @InjectModel('CustomService') private readonly customServiceModel: Model<CustomServices>,
    @InjectModel('Service') private readonly serviceModel: Model<Services>,
    private apiResponse: ApiResponse,
  ) { }

  async getCartLocationStylistAndCategory(cart_id: string) {
    return await this.customerCartModel.aggregate([
      { $match: { _id: cart_id } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'service_providers',
          localField: 'stylist_id',
          foreignField: '_id',
          as: 'stylist',
        },
      },
      { $unwind: { path: '$stylist', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'service_category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
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

  async updateCartTotalDetails(user_id: string) {
    try {
      const cartInfo = await this.customerCartModel.findOne({ user_id: user_id });
      if (cartInfo) {
        let totalService = 0;
        let serviceCharges = 0;
        const convenienceFee = 0;
        const discount = 0;
        const voucherAmount = 0;
        const tax = 0;

        if (cartInfo.cart_profiles.length > 0) {
          totalService = cartInfo.cart_profiles.filter((items) => items).length;
          for (let i = 0; i < cartInfo.cart_profiles.length; i++) {
            const element = cartInfo.cart_profiles[i];
            for (let j = 0; j < element.cart_items.length; j++) {
              const priceInfo = element.cart_items[j];
              serviceCharges = serviceCharges + priceInfo.price;
            }
          }
        }

        const totalBill = serviceCharges + convenienceFee + discount + voucherAmount + tax;

        cartInfo.bill_details.total_service = totalService;
        cartInfo.bill_details.service_charges = serviceCharges;
        cartInfo.bill_details.convenience_fee = convenienceFee;
        cartInfo.bill_details.discount = discount;
        cartInfo.bill_details.voucher_amount = voucherAmount;
        cartInfo.bill_details.tax = tax;
        cartInfo.bill_details.total_bill = totalBill;
        cartInfo.save();

        if (totalBill == 0 || totalBill === 0) {
          await this.customerCartModel.deleteOne({ user_id: user_id });
        }
      }
    } catch (err) {
      return err
    }
  }

  async addServiceToCart(user: CurrentUserDto, addCartBody: AddServiceToCartDto, res: Response) {
    try {
      const { type, service_id, quantity, location_id, stylist_type, profile_id, stylist_id, service_category_id,
        title, sale_price, regular_price, firstname, lastname, user_type, profile } = addCartBody;

      const customServiceInfo = await this.customServiceModel.findOne({ _id: service_id });
      const adminServiceInfo = await this.serviceModel.findOne({ _id: service_id });
      const checkQuantity = type == 'custom-service' ? customServiceInfo && customServiceInfo.quantity : adminServiceInfo && adminServiceInfo.quantity;
      if (checkQuantity >= quantity) {
        console.log('checked');
      } else {
        return this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
      }

      const customerCartInfo = await this.customerCartModel.findOne({ user_id: user._id }, { cart_profiles: 1, location_id: 1, stylist_type: 1 });
      if (customerCartInfo) {
        if (customerCartInfo.location_id != location_id) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Location should be same!');
        }
        if (customerCartInfo.stylist_type != stylist_type) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Stylist type should be same!');
        }

        const getCartInfo = await this.getCartLocationStylistAndCategory(customerCartInfo._id);
        const addressType = getCartInfo[0] && getCartInfo[0].items?.length > 0 ? getCartInfo[0].items[0]?.address_type : null;
        const stylistName = getCartInfo[0] && getCartInfo[0]?.full_name ? getCartInfo[0]?.full_name : null;
        const categoryName = getCartInfo[0] && getCartInfo[0]?.category_name ? getCartInfo[0]?.category_name : null;

        const profileCart = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id) });
        const cartProfile = profileCart && profileCart.cart_profiles.map((item) => item);
        if (cartProfile && cartProfile.length > 0) {
          for (let i = 0; i < cartProfile.length; i++) {
            const cartItem = cartProfile[i].cart_items
            const alreadyExist = cartItem.find((element) => element.service_id.toString() === service_id ? element : null)
            if (alreadyExist) {
              if (quantity == 0) {
                await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id), 'cart_profiles.cart_items.service_id': new Types.ObjectId(alreadyExist.service_id) }, {
                  $pull: {
                    'cart_profiles.$.cart_items': {
                      service_id: alreadyExist.service_id,
                    },
                  },
                });
                this.updateCartTotalDetails(user._id);
                return this.apiResponse.successResponseWithNoData(res, 'Service Removed.');
              } else {
                await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id), 'cart_profiles.cart_items._id': new Types.ObjectId(alreadyExist._id) }, {
                  $set: {
                    'cart_profiles.$[outer].cart_items.$[inner].quantity': quantity,
                    'cart_profiles.$[outer].cart_items.$[inner].price': sale_price * quantity,
                  },
                }, {
                  arrayFilters: [{ 'outer.profile_id': new Types.ObjectId(profile_id) }, { 'inner._id': new Types.ObjectId(alreadyExist._id) }],
                });

                const responseObj = {
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
                  service_type: type || type == 'custom-service' ? type : 'simple-service',
                };

                await this.updateCartTotalDetails(user._id);
                return this.apiResponse.successResponseWithData(res, 'Service updated.', responseObj);
              }
            } else {
              const createCartItem = {
                _id: new Types.ObjectId(),
                service_id: new Types.ObjectId(service_id),
                title: title,
                is_custom: type == 'custom-service' ? true : false,
                quantity: quantity,
                price: sale_price * quantity,
                sale_price: sale_price,
                regular_price: regular_price,
              }
              await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id) }, {
                $push: {
                  'cart_profiles.$.cart_items': createCartItem
                },
              });
              await this.updateCartTotalDetails(user._id);
              const responseObj = {
                service_id: new Types.ObjectId(service_id),
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
              return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', responseObj,);
            }
          }
        } else {
          await this.customerCartModel.updateOne({ user_id: user._id }, {
            $push: {
              cart_profiles: {
                firstname: firstname,
                lastname: lastname,
                profile_id: new Types.ObjectId(profile_id),
                user_type: user_type ? user_type : '',
                profile: profile ? profile : '',
                cart_items: [{
                  service_id: new Types.ObjectId(service_id),
                  title: title,
                  quantity: quantity,
                  price: sale_price * quantity,
                  sale_price: sale_price,
                  regular_price: regular_price,
                  is_custom: type == 'custom-service' ? true : false,
                }],
              },
            },
          });
          this.updateCartTotalDetails(user._id);
          const responseObj = {
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
          return this.apiResponse.successResponseWithData(res, 'Service updated successfully.', responseObj);
        }
      } else {
        const createCartObj = {
          user_id: user._id,
          stylist_id: stylist_id ? new Types.ObjectId(stylist_id) : null,
          location_id: location_id ? new Types.ObjectId(location_id) : null,
          service_category_id: service_category_id ? new Types.ObjectId(service_category_id) : null,
          stylist_type: stylist_type ? stylist_type : null,
          service_type: type || type == 'custom-service' ? type : 'simple-service',
          bill_details: {
            total_bill: sale_price * quantity,
            total_service: 1
          },
          cart_profiles: [{
            _id: new Types.ObjectId(),
            firstname: firstname,
            lastname: lastname,
            profile_id: new Types.ObjectId(profile_id),
            profile: profile ? profile : null,
            user_type: user_type ? user_type : null,
            cart_items: [{
              _id: new Types.ObjectId(),
              service_id: new Types.ObjectId(service_id),
              title: title,
              quantity: quantity,
              price: sale_price * quantity,
              sale_price: sale_price,
              regular_price: regular_price,
              is_custom: type == "custom-service" ? true : false,
            }],
          }]
        }

        const createdCart = await this.customerCartModel.create(createCartObj);
        this.updateCartTotalDetails(user._id);
        const getCartInfo = await this.getCartLocationStylistAndCategory(createdCart._id);
        const addressType = getCartInfo[0] && getCartInfo[0].items?.length > 0 ? getCartInfo[0].items[0]?.address_type : null;
        const stylistName = getCartInfo[0] && getCartInfo[0]?.full_name ? getCartInfo[0]?.full_name : null;
        const categoryName = getCartInfo[0] && getCartInfo[0]?.category_name ? getCartInfo[0]?.category_name : null;

        const cartResponseObj = {
          _id: createdCart._id,
          service_id: service_id,
          stylist_id: stylist_id ? stylist_id : null,
          location_id: location_id ? location_id : null,
          service_category_id: service_category_id ? service_category_id : null,
          service_type: type || type == 'custom-service' ? type : 'simple-service',
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
        return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', cartResponseObj);
      }
    } catch (err) {
      return this.apiResponse.ErrorResponseWithoutData(res, err.message);
    }
  }

  async getCart(user: CurrentUserDto, res: Response) {
    try {
      const cartInfo = await this.customerCartModel.findOne({ user_id: user._id });
      const walletBalance = await this.userModel.findOne({ _id: user._id }, { wallet_balance: 1 });
      if (cartInfo) {
        const getCartInfo = await this.getCartLocationStylistAndCategory(cartInfo._id);
        const addressType = getCartInfo[0] && getCartInfo[0].items?.length > 0 ? getCartInfo[0].items[0]?.address_type : null;
        const stylistName = getCartInfo[0] && getCartInfo[0]?.full_name ? getCartInfo[0]?.full_name : null;
        const categoryName = getCartInfo[0] && getCartInfo[0]?.category_name ? getCartInfo[0]?.category_name : null;
        const configData = await this.configModel.findOne({});
        const bill_details = {
          ...JSON.parse(JSON.stringify(cartInfo.bill_details)),
          convenience_fee: configData.platform_convenience_fees,
          tax: configData.platform_service_tax,
        };

        const responseObj = {
          _id: cartInfo._id,
          user_id: cartInfo.user_id,
          address_type: addressType,
          full_name: stylistName,
          category_name: categoryName,
          wallet_balance: walletBalance.wallet_balance ? walletBalance.wallet_balance : 0,
          stylist_id: cartInfo.stylist_id,
          location_id: cartInfo.location_id,
          service_category_id: cartInfo.service_category_id ? cartInfo.service_category_id : null,
          stylist_type: cartInfo.stylist_type,
          bill_details: bill_details,
          cart_profiles: cartInfo.cart_profiles,
        };
        return this.apiResponse.successResponseWithData(res, 'Cart found successfully.', responseObj);
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
    try {
      const { profile_id, cart_item_id, quantity, price } = updateCartBody;

      const cartItem = await this.customerCartModel.aggregate([
        { $match: { user_id: user._id } },
        {
          $addFields: {
            profiles: {
              $filter: {
                input: '$cart_profiles',
                as: 'profiles',
                cond: { $eq: ['$$profiles.profile_id', new Types.ObjectId(profile_id)] },
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
                cond: { $eq: ['$$item._id', new Types.ObjectId(cart_item_id)] },
              },
            },
          },
        }, { $unwind: { path: '$items' } },
      ]);

      if (cartItem.length > 0 && cartItem[0].items && cartItem[0].items.quantity > 0) {
        const isCustom = cartItem[0].items.is_custom;
        const customServiceInfo = await this.customServiceModel.findOne({ _id: cartItem[0].items.service_id });
        const adminServiceInfo = await this.serviceModel.findOne({ _id: cartItem[0].items.service_id });
        const checkQuantity = isCustom ? customServiceInfo && customServiceInfo.quantity : adminServiceInfo && adminServiceInfo.quantity;
        if (checkQuantity >= quantity) {
          console.log('check');
        } else {
          return this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
        }
      }

      const cartProfile = await this.customerCartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id) });
      if (cartProfile) {
        if (quantity == 0) {
          await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id), 'cart_profiles.cart_items._id': new Types.ObjectId(cart_item_id) }, {
            $pull: {
              'cart_profiles.$.cart_items': {
                _id: cart_item_id,
              },
            },
          });
          await this.updateCartTotalDetails(user._id);
          return this.apiResponse.successResponse(res, 'Service Removed.');
        } else {
          await this.customerCartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(profile_id), 'cart_profiles.cart_items._id': new Types.ObjectId(cart_item_id) }, {
            $set: {
              'cart_profiles.$[outer].cart_items.$[inner].quantity': quantity,
              'cart_profiles.$[outer].cart_items.$[inner].price': price * quantity,
            },
          }, {
            arrayFilters: [{ 'outer.profile_id': new Types.ObjectId(profile_id) }, { 'inner._id': new Types.ObjectId(cart_item_id) }],
          });
          await this.updateCartTotalDetails(user._id);
          const responseObj = {
            _id: cartProfile._id,
          }
          return this.apiResponse.successResponseWithData(res, 'Cart item updated successfully.', responseObj);
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'Cart profile not found!', {});
      }
    } catch (err) {
      return this.apiResponse.ErrorResponse(res, err.message, {});
    }
  }
}
