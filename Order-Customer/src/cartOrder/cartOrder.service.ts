import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer_Cart } from 'src/Schema/cartModel.schema';
import { Custom_service } from 'src/Schema/customService.schema';
import { Config } from 'src/Schema/globalSettings.schema';
import { Service } from 'src/Schema/serviceModel.schema';
import { User } from 'src/Schema/userModel.schema';
import { ApiResponse } from 'src/utils/apiResponse.service';

@Injectable()
export class CartOrderService {
  constructor(
    @InjectModel('Customer_Cart') private readonly customer_CartModel: Model<Customer_Cart>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Config') private readonly configModel: Model<Config>,
    @InjectModel('CustomService') private readonly customService: Model<Custom_service>,
    @InjectModel('Service') private readonly serviceModel: Model<Service>, private apiResponse: ApiResponse,
  ) { }

  async getCartLocationStylistAndCat(cart_id) {
    return this.customer_CartModel.aggregate([{ $match: { _id: cart_id } },
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

  async updateCartTotalDetails(id, userId) {
    const cart = await this.customer_CartModel.findOne({ user_id: userId });
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
        await this.customer_CartModel.deleteOne({ user_id: userId });
      }
    }
  }

  async addServiceToCart(req, user, res) {
    try {
      let isCustom = req.body.type ? true : false;
      let service;
      if (isCustom) {
        service = await this.customService.findOne({ _id: req.body.service_id }, { quantity: 1 });
      } else {
        service = await this.serviceModel.findOne({ _id: req.body.service_id }, { quantity: 1 });
      }
      if (service && service.quantity > 0) {
        if (service.quantity >= parseInt(req.body.quantity)) {
          console.log('check');
        } else {
          return this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
        }
      }
      const cart = await this.customer_CartModel.findOne({ user_id: user._id }, { cart_profiles: 1, location_id: 1, stylist_type: 1 });
      if (cart != null) {
        if (cart.location_id != req.body.location_id) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Location should be same!');
        }
        if (cart.stylist_type != req.body.stylist_type) {
          return this.apiResponse.ErrorResponseWithoutData(res, 'Stylist type should be same!');
        }

        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);
        let addressType = cartInfo[0] && cartInfo[0].items.length > 0 ? cartInfo[0].items[0].address_type : '';
        let stylistName = cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let categoryName = cartInfo[0] && cartInfo[0].category_name ? cartInfo[0].category_name : '';
        const profileCart = await this.customer_CartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id) });

        if (profileCart != null) {
          if (profileCart.cart_profiles) {
            for (var i = 0; i < profileCart.cart_profiles.length; i++) {
              if (profileCart.cart_profiles[i].profile_id.toString() == req.body.profile_id) {
                let alredayExit: any = profileCart.cart_profiles[i].cart_items.find((elem) => {
                  if (elem.service_id.toString() === req.body.service_id) {
                    return elem;
                  }
                });
                if (alredayExit) {
                  if (req.body.quantity == 0) {
                    const userResponse = await this.customer_CartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id), 'cart_profiles.cart_items.service_id': new Types.ObjectId(alredayExit.service_id) },
                      {
                        $pull: {
                          'cart_profiles.$.cart_items': {
                            service_id: alredayExit.service_id,
                          },
                        },
                      },
                    );
                    if (userResponse) {
                      this.updateCartTotalDetails(req, user._id);
                      return this.apiResponse.successResponseWithNoData(res, 'Service Removed.');
                    }
                  } else {
                    let updatingData = {
                      service_id: req.body.service_id,
                      stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
                      location_id: req.body.location_id ? req.body.location_id : null,
                      service_category_id: req.body.service_category_id ? req.body.service_category_id : null,
                      profile_id: req.body.profile_id,
                      address_type: addressType,
                      stylist_name: stylistName,
                      category_name: categoryName,
                      title: req.body.title,
                      quantity: parseInt(req.body.quantity),
                      price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
                      sale_price: parseInt(req.body.sale_price),
                      regular_price: parseInt(req.body.regular_price),
                      service_type: req.body.type ? req.body.type : 'simple-service',
                    };

                    const responseUpdate = await this.customer_CartModel.updateOne({
                      user_id: user._id,
                      cart_profiles: {
                        $elemMatch: {
                          profile_id: req.body.profile_id, 'cart_items._id': alredayExit._id
                        },
                      },
                    },
                      {
                        // ***********************REMAINING***************
                        $set: {
                          // 'cart_profiles.$[outer].cart_items.$[inner].quantity':
                          //   parseInt(req.body.quantity),
                          // 'cart_profiles.$[outer].cart_items.$[inner].price':
                          //   parseInt(req.body.sale_price) *
                          //   parseInt(req.body.quantity),
                        },
                      },
                      {
                        arrayFilters: [{ 'outer.profile_id': req.body.profile_id }, { 'inner._id': alredayExit._id }],
                      },
                    );
                    if (responseUpdate) {
                      this.updateCartTotalDetails(req, user._id);
                      return this.apiResponse.successResponseWithData(res, 'Service updated.', updatingData);
                    }
                  }
                } else {
                  profileCart.cart_profiles[i].cart_items.push({
                    service_id: req.body.service_id,
                    title: req.body.title,
                    is_custom: isCustom,
                    quantity: parseInt(req.body.quantity),
                    price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
                    sale_price: parseInt(req.body.sale_price),
                    regular_price: parseInt(req.body.regular_price),
                  });

                  await profileCart.save();
                  this.updateCartTotalDetails(req, user._id);

                  let updatingData = {
                    service_id: req.body.service_id,
                    stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
                    location_id: req.body.location_id ? req.body.location_id : null,
                    service_category_id: req.body.service_category_id ? req.body.service_category_id : null,
                    addressType,
                    stylistName,
                    categoryName,
                    title: req.body.title,
                    quantity: parseInt(req.body.quantity),
                    price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
                    sale_price: parseInt(req.body.sale_price),
                    regular_price: parseInt(req.body.regular_price),
                    profile_id: req.body.profile_id,
                  };
                  return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData,
                  );
                }
              }
            }
          }
        } else {
          const cartModelUpdate = await this.customer_CartModel.updateOne({ user_id: user._id },
            {
              $push: {
                cart_profiles: {
                  firstname: req.body.firstname,
                  lastname: req.body.lastname,
                  profile_id: req.body.profile_id,
                  user_type: req.body.user_type ? req.body.user_type : '',
                  profile: req.body.profile ? req.body.profile : '',
                  cart_items: [
                    {
                      service_id: req.body.service_id,
                      title: req.body.title,
                      quantity: parseInt(req.body.quantity),
                      price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
                      sale_price: parseInt(req.body.sale_price),
                      regular_price: parseInt(req.body.regular_price),
                      is_custom: req.body.type ? true : false,
                    },
                  ],
                },
              },
            },
          );
          this.updateCartTotalDetails(req, user._id);
          let updatingData = {
            service_id: req.body.service_id,
            stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
            location_id: req.body.location_id ? req.body.location_id : null,
            service_category_id: req.body.service_category_id ? req.body.service_category_id : null,
            addressType,
            stylistName,
            categoryName,
            title: req.body.title,
            quantity: parseInt(req.body.quantity),
            price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
            sale_price: parseInt(req.body.sale_price),
            regular_price: parseInt(req.body.regular_price),
            profile_id: req.body.profile_id,
          };
          return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData,
          );
        }
      } else {
        const createdCart = await this.customer_CartModel.create({
          user_id: user._id,
          stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
          location_id: req.body.location_id ? req.body.location_id : null,
          service_category_id: req.body.service_category_id ? req.body.service_category_id : null,
          stylist_type: req.body.stylist_type ? req.body.stylist_type : null,
          service_type: req.body.type ? req.body.type : 'simple-service',
          bill_details: {},
          cart_profiles: [{
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            profile_id: req.body.profile_id,
            profile: req.body.profile ? req.body.profile : '',
            user_type: req.body.user_type ? req.body.user_type : '',
            cart_items: [{
              service_id: req.body.service_id,
              title: req.body.title,
              quantity: parseInt(req.body.quantity),
              price:
                parseInt(req.body.sale_price) * parseInt(req.body.quantity),
              sale_price: parseInt(req.body.sale_price),
              regular_price: parseInt(req.body.regular_price),
              is_custom: req.body.type ? true : false,
            },
            ],
          },
          ],
        });
        this.updateCartTotalDetails(req, user._id);
        let cart = await this.getCartLocationStylistAndCat(createdCart._id);
        let addressType = cart[0] ? cart[0].items[0]?.address_type : '';
        let stylistName = cart[0] ? cart[0].full_name : '';
        let categoryName = cart[0] ? cart[0].category_name : '';
        let updatingData = {
          service_id: req.body.service_id,
          stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
          location_id: req.body.location_id ? req.body.location_id : null,
          service_category_id: req.body.service_category_id ? req.body.service_category_id : null,
          service_type: req.body.type ? req.body.type : 'simple-service',
          addressType,
          stylistName,
          categoryName,
          stylist_type: req.body.stylist_type ? req.body.stylist_type : null,
          title: req.body.title,
          quantity: parseInt(req.body.quantity),
          price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
          sale_price: parseInt(req.body.sale_price),
          regular_price: parseInt(req.body.regular_price),
          profile_id: req.body.profile_id,
        };
        return this.apiResponse.successResponseWithData(res, 'Service added to cart successfully.', updatingData);
      }
    } catch (err) {
      return this.apiResponse.ErrorResponseWithoutData(res, err.message);
    }
  }

  async getCart(req, user, res) {
    try {
      const cart = await this.customer_CartModel.findOne({ user_id: user._id });
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

  async clearCart(req, user, res) {
    try {
      await this.customer_CartModel.deleteOne({ user_id: user._id });
      return this.apiResponse.successResponseWithNoData(res, 'Cart cleared successfully.');
    } catch (err) {
      return this.apiResponse.successResponseWithNoData(res, err.message);
    }
  }

  async updateCartItem(req, user, res) {
    try {
      let serviceType = req.body.type ? req.body.type : 'simple-service';
      let isCustom = req.body.type ? true : false;
      let service;

      let cartItem = await this.customer_CartModel.aggregate([{ $match: { user_id: user._id } },
      {
        $addFields: {
          profiles: {
            $filter: {
              input: '$cart_profiles',
              as: 'profiles',
              cond: { $eq: ['$$profiles.profile_id', req.body.profile_id] },
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
              cond: { $eq: ['$$item._id', req.body.cart_item_id] },
            },
          },
        },
      }, { $unwind: { path: '$items' } },
      ]);
      if (cartItem.length > 0 && cartItem[0].items && cartItem[0].items.quantity > 0) {
        if (cartItem[0].items.is_custom == 'true') {
          service = await this.customService.findOne({ _id: cartItem[0].items.service_id }, { quantity: 1 });
        } else {
          service = await this.serviceModel.findOne({ _id: cartItem[0].items.service_id }, { quantity: 1 });
        }
        if (service && service.quantity > 0) {
          if (service.quantity >= parseInt(req.body.quantity)) {
            console.log('check');
          } else {
            this.apiResponse.ErrorResponseWithoutData(res, 'This quantity can not be added for this service.');
            return;
          }
        }
      }
      const cart = await this.customer_CartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id) });
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
        if (req.body.quantity == 0) {
          const userResponse = await this.customer_CartModel.updateOne({ user_id: user._id, 'cart_profiles.profile_id': req.body.profile_id, 'cart_profiles.cart_items._id': req.body.cart_item_id },
            {
              $pull: {
                'cart_profiles.$.cart_items': {
                  _id: req.body.cart_item_id,
                },
              },
            },
          );
          let cartPro = await this.customer_CartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id) });
          for (let profile of cartPro.cart_profiles) {
            if (profile.cart_items.length > 0) {
              await this.customer_CartModel.updateOne({ user_id: user._id },
                {
                  $pull: {
                    cart_profiles: { profile_id: profile.profile_id },
                  },
                },
              );
            }
          }
          let cartSaved = await this.customer_CartModel.findOne({ user_id: user._id, 'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id) });
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
          await this.updateCartTotalDetails(req, user._id);
          return this.apiResponse.successResponseWithData(res, 'Service Removed.', newResult);
        } else {
          for (var i = 0; i < cart.cart_profiles.length; i++) {
            if (cart.cart_profiles[i].profile_id.toString() === req.body.profile_id && cart.cart_profiles[i].cart_items.length) {
              for (var j = 0; j < cart.cart_profiles[i].cart_items.length; j++) {
                if (cart.cart_profiles[i].cart_items[j]._id.toString() == req.body.cart_item_id) {
                  cart.cart_profiles[i].cart_items[j].quantity = parseInt(req.body.quantity);
                  cart.cart_profiles[i].cart_items[j].price = parseInt(req.body.quantity) * parseInt(req.body.price);
                }
              }
            }
          }
          const cartSaved = await cart.save();
          this.updateCartTotalDetails(req, user._id);
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
