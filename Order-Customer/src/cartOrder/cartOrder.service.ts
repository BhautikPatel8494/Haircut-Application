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
    @InjectModel('Config')
    private readonly configModel: Model<Config>,
    @InjectModel('CustomService')
    private readonly customService: Model<Custom_service>,
    @InjectModel('Service')
    private readonly serviceModel: Model<Service>,
    private apiResponse: ApiResponse,
  ) {}

  async getCartLocationStylistAndCat(cart_id) {
    return this.customer_CartModel.aggregate([
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
          category_name: {
            $cond: { if: '$category.name', then: '$category.name', else: '' },
          },
        },
      },
    ]);
  }

  async updateCartTotalDetails(id, userId) {
    // get current logged in user

    const cart = await this.customer_CartModel.findOne({ user_id: userId });
    if (cart) {
      let total_service = 0;
      let service_charges = 0;
      let total_bill = 0;
      let convenience_fee = 0;
      let discount = 0;
      let voucher_amount = 0;
      let tax = 0;

      if (cart.cart_profiles) {
        for (var i = 0; i < cart.cart_profiles.length; i++) {
          total_service =
            total_service + cart.cart_profiles[i].cart_items.length;
          if (cart.cart_profiles[i].cart_items) {
            for (var j = 0; j < cart.cart_profiles[i].cart_items.length; j++) {
              service_charges =
                service_charges + cart.cart_profiles[i].cart_items[j].price;
            }
          }
        }

        total_bill =
          service_charges + convenience_fee + discount + voucher_amount + tax;
      }

      cart.bill_details.total_service = total_service;
      cart.bill_details.service_charges = service_charges;
      cart.bill_details.convenience_fee = convenience_fee;
      cart.bill_details.discount = discount;
      cart.bill_details.voucher_amount = voucher_amount;
      cart.bill_details.tax = tax;
      cart.bill_details.total_bill = total_bill;
      cart.save();
      if (total_bill == 0 || total_bill === 0) {
        await this.customer_CartModel.deleteOne({ user_id: userId });
      }
    }
  }

  async addServiceToCart(req, user, res) {
    try {
      let is_custom = req.body.type ? true : false;
      let service;
      if (is_custom) {
        service = await this.customService.findOne(
          { _id: req.body.service_id },
          { quantity: 1 },
        );
      } else {
        service = await this.serviceModel.findOne(
          { _id: req.body.service_id },
          { quantity: 1 },
        );
      }
      if (service && service.quantity > 0) {
        if (service.quantity >= parseInt(req.body.quantity)) {
          console.log('check');
        } else {
          return this.apiResponse.ErrorResponseWithoutData(
            res,
            'This quantity can not be added for this service.',
          );
        }
      }
      const cart = await this.customer_CartModel.findOne(
        { user_id: user._id },
        { cart_profiles: 1, location_id: 1, stylist_type: 1 },
      );
      if (cart != null) {
        if (cart.location_id != req.body.location_id) {
          return this.apiResponse.ErrorResponseWithoutData(
            res,
            'Location should be same!',
          );
        }

        if (cart.stylist_type != req.body.stylist_type) {
          return this.apiResponse.ErrorResponseWithoutData(
            res,
            'Stylist type should be same!',
          );
        }
        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);
        let address_type =
          cartInfo[0] && cartInfo[0].items.length > 0
            ? cartInfo[0].items[0].address_type
            : '';
        let stylist_name =
          cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let category_name =
          cartInfo[0] && cartInfo[0].category_name
            ? cartInfo[0].category_name
            : '';
        const profile_cart = await this.customer_CartModel.findOne({
          user_id: user._id,
          'cart_profiles.profile_id': req.body.profile_id,
        });
        if (profile_cart != null) {
          // if profile cart is not null
          if (profile_cart.cart_profiles) {
            for (var i = 0; i < profile_cart.cart_profiles.length; i++) {
              console.log(
                'profile_cart.cart_profiles :>> ',
                profile_cart.cart_profiles[i].profile_id,
              );
              if (
                profile_cart.cart_profiles[i].profile_id.toString() ==
                req.body.profile_id
              ) {
                let alreday_exit: any = profile_cart.cart_profiles[
                  i
                ].cart_items.find((elem) => {
                  if (elem.service_id.toString() === req.body.service_id) {
                    return elem;
                  }
                });

                if (alreday_exit) {
                  // updating quantity if service exists
                  // return apiResponse.ErrorResponseWithoutData(res, "You already added this service in cart.");
                  if (req.body.quantity == 0) {
                    // removing object from array elements
                    this.customer_CartModel
                      .updateOne(
                        {
                          user_id: user._id,
                          'cart_profiles.profile_id': req.body.profile_id,
                          'cart_profiles.cart_items.service_id':
                            alreday_exit.service_id,
                        },
                        {
                          $pull: {
                            'cart_profiles.$.cart_items': {
                              service_id: alreday_exit.service_id,
                            },
                          },
                        },
                      )
                      .then((user: any) => {
                        this.updateCartTotalDetails(req, user._id);
                        return this.apiResponse.successResponseWithNoData(
                          res,
                          'Service Removed.',
                        );
                      })
                      .catch((err) => {
                        return this.apiResponse.ErrorResponseWithoutData(
                          res,
                          err.message,
                        );
                      });
                  } else {
                    // updating quantity
                    let updatingData = {
                      service_id: req.body.service_id,
                      stylist_id: req.body.stylist_id
                        ? req.body.stylist_id
                        : null,
                      location_id: req.body.location_id
                        ? req.body.location_id
                        : null,
                      service_category_id: req.body.service_category_id
                        ? req.body.service_category_id
                        : null,
                      profile_id: req.body.profile_id,
                      address_type: address_type,
                      stylist_name: stylist_name,
                      category_name: category_name,
                      title: req.body.title,
                      quantity: parseInt(req.body.quantity),
                      price:
                        parseInt(req.body.sale_price) *
                        parseInt(req.body.quantity),
                      sale_price: parseInt(req.body.sale_price),
                      regular_price: parseInt(req.body.regular_price),
                      service_type: req.body.type
                        ? req.body.type
                        : 'simple-service',
                    };
                    console.log('updatingData :>> ', updatingData);

                    this.customer_CartModel
                      .updateOne(
                        {
                          user_id: user._id,
                          cart_profiles: {
                            $elemMatch: {
                              profile_id: req.body.profile_id,
                              'cart_items._id': alreday_exit._id,
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
                          arrayFilters: [
                            {
                              'outer.profile_id': req.body.profile_id,
                            },
                            { 'inner._id': alreday_exit._id },
                          ],
                        },
                      )
                      .then(async (user: any) => {
                        console.log('user :>> ', user);
                        this.updateCartTotalDetails(req, user._id);
                        // let new_details = {
                        //     total_service:
                        //     service_charges:
                        //     total:
                        // }
                        return this.apiResponse.successResponseWithData(
                          res,
                          'Service updated.',
                          updatingData,
                        );
                      })
                      .catch((err) => {
                        return this.apiResponse.ErrorResponseWithoutData(
                          res,
                          err.message,
                        );
                      });
                  }
                } else {
                  console.log('object sdfhsdfjdsf');
                  profile_cart.cart_profiles[i].cart_items.push({
                    service_id: req.body.service_id,
                    title: req.body.title,
                    is_custom: is_custom,
                    quantity: parseInt(req.body.quantity),
                    price:
                      parseInt(req.body.sale_price) *
                      parseInt(req.body.quantity),
                    sale_price: parseInt(req.body.sale_price),
                    regular_price: parseInt(req.body.regular_price),
                  });

                  await profile_cart.save();
                  this.updateCartTotalDetails(req, user._id);

                  let updatingData = {
                    service_id: req.body.service_id,
                    stylist_id: req.body.stylist_id
                      ? req.body.stylist_id
                      : null,
                    location_id: req.body.location_id
                      ? req.body.location_id
                      : null,
                    service_category_id: req.body.service_category_id
                      ? req.body.service_category_id
                      : null,
                    address_type,
                    stylist_name,
                    category_name,
                    title: req.body.title,
                    quantity: parseInt(req.body.quantity),
                    price:
                      parseInt(req.body.sale_price) *
                      parseInt(req.body.quantity),
                    sale_price: parseInt(req.body.sale_price),
                    regular_price: parseInt(req.body.regular_price),
                    profile_id: req.body.profile_id,
                  };
                  return this.apiResponse.successResponseWithData(
                    res,
                    'Service added to cart successfully.',
                    updatingData,
                  );
                }
              }
            }
          }
        } else {
          // if profile cart is null
          this.customer_CartModel.updateOne(
            { user_id: user._id },
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
                      price:
                        parseInt(req.body.sale_price) *
                        parseInt(req.body.quantity),
                      sale_price: parseInt(req.body.sale_price),
                      regular_price: parseInt(req.body.regular_price),
                      is_custom: req.body.type ? true : false,
                    },
                  ],
                },
              },
            },
            function (updated_err, updated) {
              if (updated_err) {
                return this.apiResponse.ErrorResponseWithoutData(
                  res,
                  updated_err.message,
                );
              }
              this.updateCartTotalDetails(req, user._id);
              let updatingData = {
                service_id: req.body.service_id,
                stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
                location_id: req.body.location_id ? req.body.location_id : null,
                service_category_id: req.body.service_category_id
                  ? req.body.service_category_id
                  : null,
                address_type,
                stylist_name,
                category_name,
                title: req.body.title,
                quantity: parseInt(req.body.quantity),
                price:
                  parseInt(req.body.sale_price) * parseInt(req.body.quantity),
                sale_price: parseInt(req.body.sale_price),
                regular_price: parseInt(req.body.regular_price),
                profile_id: req.body.profile_id,
              };
              return this.apiResponse.successResponseWithData(
                res,
                'Service added to cart successfully.',
                updatingData,
              );
            },
          );
        }
      } else {
        // if cart is null
        const created_cart = await this.customer_CartModel.create({
          user_id: user._id,
          stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
          location_id: req.body.location_id ? req.body.location_id : null,
          service_category_id: req.body.service_category_id
            ? req.body.service_category_id
            : null,
          stylist_type: req.body.stylist_type ? req.body.stylist_type : null,
          service_type: req.body.type ? req.body.type : 'simple-service',
          bill_details: {},
          cart_profiles: [
            {
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              profile_id: req.body.profile_id,
              profile: req.body.profile ? req.body.profile : '',
              user_type: req.body.user_type ? req.body.user_type : '',
              cart_items: [
                {
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
        console.log(created_cart._id);
        let cart = await this.getCartLocationStylistAndCat(created_cart._id);
        let address_type = cart[0] ? cart[0].items[0]?.address_type : '';
        let stylist_name = cart[0] ? cart[0].full_name : '';
        let category_name = cart[0] ? cart[0].category_name : '';
        let updatingData = {
          service_id: req.body.service_id,
          stylist_id: req.body.stylist_id ? req.body.stylist_id : null,
          location_id: req.body.location_id ? req.body.location_id : null,
          service_category_id: req.body.service_category_id
            ? req.body.service_category_id
            : null,
          service_type: req.body.type ? req.body.type : 'simple-service',
          address_type,
          stylist_name,
          category_name,
          stylist_type: req.body.stylist_type ? req.body.stylist_type : null,
          title: req.body.title,
          quantity: parseInt(req.body.quantity),
          price: parseInt(req.body.sale_price) * parseInt(req.body.quantity),
          sale_price: parseInt(req.body.sale_price),
          regular_price: parseInt(req.body.regular_price),
          profile_id: req.body.profile_id,
        };
        console.log('updatingData :>> ', updatingData);
        return this.apiResponse.successResponseWithData(
          res,
          'Service added to cart successfully.',
          updatingData,
        );
      }
    } catch (err) {
      console.log(err);
      return this.apiResponse.ErrorResponseWithoutData(res, err.message);
    }
  }

  async getCart(req, user, res) {
    try {
      //get current logged in user
      const cart = await this.customer_CartModel.findOne({ user_id: user._id });
      let wallet = await this.userModel.findOne(
        { _id: user._id },
        { wallet_balance: 1 },
      );
      if (cart != null) {
        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);
        let address_type =
          cartInfo[0] && cartInfo[0].items.length > 0
            ? cartInfo[0].items[0].address_type
            : '';
        let stylist_name =
          cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let category_name =
          cartInfo[0] && cartInfo[0].category_name
            ? cartInfo[0].category_name
            : '';
        const billData = await this.configModel.findOne({});
        let bill_details = {
          ...JSON.parse(JSON.stringify(cart.bill_details)),
          convenience_fee: billData.platform_convenience_fees,
          tax: billData.platform_service_tax,
        };
        let result = {
          _id: cart._id,
          user_id: cart.user_id,
          address_type,
          stylist_name,
          category_name,
          wallet_balance: wallet.wallet_balance ? wallet.wallet_balance : 0,
          stylist_id: cart.stylist_id,
          location_id: cart.location_id,
          service_category_id: cart.service_category_id
            ? cart.service_category_id
            : null,
          stylist_type: cart.stylist_type,
          bill_details: bill_details,
          cart_profiles: cart.cart_profiles,
          // created_at: cart.created_at,
          // updated_at: cart.updated_at,
        };
        return this.apiResponse.successResponseWithData(
          res,
          'Cart found successfully.',
          result,
        );
      } else {
        return this.apiResponse.successResponseWithData(
          res,
          'No cart item found.',
          {},
        );
      }
    } catch (err) {
      return this.apiResponse.ErrorResponse(res, err.message, {});
    }
  }

  async clearCart(req, user, res) {
    try {
      await this.customer_CartModel.deleteOne({ user_id: user._id });
      return this.apiResponse.successResponseWithNoData(
        res,
        'Cart cleared successfully.',
      );
    } catch (err) {
      return this.apiResponse.successResponseWithNoData(res, err.message);
    }
  }

  async updateCartItem(req, user, res) {
    try {
      let service_type = req.body.type ? req.body.type : 'simple-service';
      let is_custom = req.body.type ? true : false;
      let service;

      let cartItem = await this.customer_CartModel.aggregate([
        { $match: { user_id: user._id } },
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
        },
        { $unwind: { path: '$profiles' } },
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
        },
        { $unwind: { path: '$items' } },
      ]);
      // checking if quantity is greater then your
      if (
        cartItem.length > 0 &&
        cartItem[0].items &&
        cartItem[0].items.quantity > 0
      ) {
        if (cartItem[0].items.is_custom == 'true') {
          service = await this.customService.findOne(
            { _id: cartItem[0].items.service_id },
            { quantity: 1 },
          );
        } else {
          service = await this.serviceModel.findOne(
            { _id: cartItem[0].items.service_id },
            { quantity: 1 },
          );
        }
        console.log(service);
        if (service && service.quantity > 0) {
          if (service.quantity >= parseInt(req.body.quantity)) {
            console.log('check');
          } else {
            this.apiResponse.ErrorResponseWithoutData(
              res,
              'This quantity can not be added for this service.',
            );
            return;
          }
        }
      }
      const cart = await this.customer_CartModel.findOne({
        user_id: user._id,
        'cart_profiles.profile_id': new Types.ObjectId(req.body.profile_id),
      });
      console.log('cart :>> ', cart);
      if (cart) {
        const billData = await this.configModel.findOne({});
        let bill_details = {
          ...JSON.parse(JSON.stringify(cart.bill_details)),
          convenience_fee: billData.platform_convenience_fees,
          tax: billData.platform_service_tax,
        };
        let cartInfo = await this.getCartLocationStylistAndCat(cart._id);

        console.log(cartInfo);
        let address_type =
          cartInfo[0] && cartInfo[0].items.length > 0
            ? cartInfo[0].items[0].address_type
            : '';
        let stylist_name =
          cartInfo[0] && cartInfo[0].full_name ? cartInfo[0].full_name : '';
        let category_name =
          cartInfo[0] && cartInfo[0].category_name
            ? cartInfo[0].category_name
            : '';
        if (req.body.quantity == 0) {
          const userResponse = await this.customer_CartModel.updateOne(
            {
              user_id: user._id,
              'cart_profiles.profile_id': req.body.profile_id,
              'cart_profiles.cart_items._id': req.body.cart_item_id,
            },
            {
              $pull: {
                'cart_profiles.$.cart_items': {
                  _id: req.body.cart_item_id,
                },
              },
            },
          );
          let cart_pro = await this.customer_CartModel.findOne({
            user_id: user._id,
            'cart_profiles.profile_id': req.body.profile_id,
          });
          for (let profile of cart_pro.cart_profiles) {
            console.log(profile);
            if (profile.cart_items.length > 0) {
              await this.customer_CartModel.updateOne(
                { user_id: user._id },
                {
                  $pull: {
                    cart_profiles: { profile_id: profile.profile_id },
                  },
                },
              );
            }
          }
          let cart_saved = await this.customer_CartModel.findOne({
            user_id: user._id,
            'cart_profiles.profile_id': req.body.profile_id,
          });
          let newResult;
          if (!cart_saved) {
            newResult = {};
          } else {
            newResult = {
              service_type: cart_saved.service_type,
              _id: cart_saved._id,
              user_id: cart_saved.user_id,
              stylist_id: cart_saved.stylist_id,
              location_id: cart_saved.location_id,
              service_category_id: cart_saved.service_category_id,
              stylist_type: cart_saved.stylist_type,
              address_type: address_type,
              stylist_name,
              category_name,
              bill_details: bill_details,
              cart_profiles: cart_saved.cart_profiles,
            };
          }
          await this.updateCartTotalDetails(req, user._id);
          return this.apiResponse.successResponseWithData(
            res,
            'Service Removed.',
            newResult,
          );
        } else {
          for (var i = 0; i < cart.cart_profiles.length; i++) {
            if (
              cart.cart_profiles[i].profile_id.toString() ===
                req.body.profile_id &&
              cart.cart_profiles[i].cart_items.length
            ) {
              for (
                var j = 0;
                j < cart.cart_profiles[i].cart_items.length;
                j++
              ) {
                console.log(cart.cart_profiles[i].cart_items[j]._id);
                if (
                  cart.cart_profiles[i].cart_items[j]._id.toString() ==
                  req.body.cart_item_id
                ) {
                  console.log('matched');
                  cart.cart_profiles[i].cart_items[j].quantity = parseInt(
                    req.body.quantity,
                  );
                  cart.cart_profiles[i].cart_items[j].price =
                    parseInt(req.body.quantity) * parseInt(req.body.price);
                }
              }
            }
          }

          cart.save(async function (cart_save_err, cart_saved) {
            if (cart_save_err) {
              return this.apiResponse.ErrorResponse(
                res,
                cart_save_err.message,
                {},
              );
            }
            this.updateCartTotalDetails(req, user._id);
            let newResult = {
              service_type: cart_saved.service_type,
              _id: cart_saved._id,
              user_id: cart_saved.user_id,
              stylist_id: cart_saved.stylist_id,
              location_id: cart_saved.location_id,
              service_category_id: cart_saved.service_category_id,
              stylist_type: cart_saved.stylist_type,
              address_type: address_type,
              stylist_name,
              category_name,
              bill_details: bill_details,
              cart_profiles: cart_saved.cart_profiles,
            };
            // cart_saved.address_type=address_type;
            // cart_saved.stylist_name=stylist_name;
            // cart_saved.category_name=category_name;
            // console.log(cart_saved.address_type)
            return this.apiResponse.successResponseWithData(
              res,
              'Cart item updated successfully.',
              newResult,
            );
          });
        }
      } else {
        return this.apiResponse.ErrorResponse(res, 'Something went wrong!', {});
      }
    } catch (err) {
      return this.apiResponse.ErrorResponse(res, err.message, {});
    }
  }
}
