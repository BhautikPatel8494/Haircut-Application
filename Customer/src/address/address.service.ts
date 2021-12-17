import { Injectable, Res } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response } from 'express'
import { Model, Types } from "mongoose";

import { Users } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { ActivateAddressDto, CreateAddressDto, DeleteAddressDto } from "./address.dto";

@Injectable()
export class AddressService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<Users>,
        private readonly apiResponse: ApiResponse
    ) { }

    async addLocation(user: CurrentUserDto, addressBody: CreateAddressDto, res: Response) {
        try {
            const { address, address_id, title, address_type, state, country, country_code, city, lat, lng, zip_code } = addressBody;

            if (address_id) {
                const addressInfo = await this.userModel.findOne({ _id: user._id }, { addresses: 1 });
                const responseObj = {
                    _id: address_id,
                    active: true,
                    address: address,
                    title: title ? title : '',
                    address_type: address_type,
                    state: state,
                    country: country,
                    country_code: country_code,
                    city: city,
                    lat: lat,
                    lng: lng,
                    zip_code: zip_code,
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    }
                }

                if (addressInfo && addressInfo.addresses && addressInfo.addresses.length > 0) {
                    for (const address of addressInfo.addresses) {
                        if (address.active) {
                            await this.userModel.updateOne({
                                _id: user._id,
                                "addresses._id": new Types.ObjectId(address._id)
                            }, { "$set": { "addresses.$.active": false } })
                        }
                    }
                }

                await this.userModel.updateOne({ _id: user._id, "addresses._id": new Types.ObjectId(address_id) }, {
                    "$set": {
                        "addresses.$.active": true,
                        "addresses.$.address": address,
                        "addresses.$.title": title,
                        "addresses.$.address_type": address_type,
                        "addresses.$.lat": lat,
                        "addresses.$.lng": lng,
                        "addresses.$.state": state,
                        "addresses.$.country": country,
                        "addresses.$.country_code": country_code,
                        "addresses.$.city": city,
                        "addresses.$.zip_code": zip_code ? zip_code : '',
                        "addresses.$.location.type": "Point",
                        "addresses.$.location.coordinates": [parseFloat(lng), parseFloat(lat)]
                    }
                })
                return this.apiResponse.successResponseWithData(res, "Address updated succseefully.", responseObj);
            } else {
                const addressInfo = await this.userModel.findOne({ _id: user._id }, { addresses: 1 });
                const responseObj = {
                    _id: new Types.ObjectId(),
                    active: true,
                    address: address,
                    title: title ? title : '',
                    address_type: address_type,
                    state: state,
                    country: country,
                    country_code: country_code,
                    city: city,
                    zip_code: zip_code ? zip_code : '',
                    lat: lat,
                    lng: lng,
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    relation: 0
                }
                if (addressInfo && addressInfo.addresses && addressInfo.addresses.length > 0) {
                    for (const address of addressInfo.addresses) {
                        if (address.active) {
                            await this.userModel.updateOne({
                                _id: user._id,
                                "addresses._id": new Types.ObjectId(address._id)
                            }, { "$set": { "addresses.$.active": false } })
                        }
                    }
                }
                if (addressInfo.addresses.length <= 0) {
                    responseObj.relation = 1
                } else {
                    responseObj.relation = 0
                }

                await this.userModel.updateOne({ _id: user._id }, {
                    $push: {
                        addresses: responseObj
                    }
                });
                return this.apiResponse.successResponseWithData(res, "Address added succseefully.", responseObj);
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async listAddresses(user: CurrentUserDto, res: Response) {
        try {

            const addressInfo = await this.userModel.findOne({ _id: user._id }, { addresses: 1 });
            if (addressInfo) {
                return this.apiResponse.successResponseWithData(res, "Address found successfully.", addressInfo.addresses);
            } else {
                return this.apiResponse.ErrorResponse(res, 'User not found', {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async deleteAddress(user: CurrentUserDto, addressBody: DeleteAddressDto, @Res() res: Response) {
        try {
            const { address_id } = addressBody;

            const userInfo = await this.userModel.findOne({
                _id: user._id,
                'addresses._id': new Types.ObjectId(address_id)
            });
            if (userInfo) {
                const findAddressIndex = userInfo.addresses && userInfo.addresses.findIndex((address) => address._id == address_id);
                userInfo.addresses.splice(findAddressIndex, 1);
                await this.userModel.updateOne({
                    _id: user._id,
                    'addresses._id': new Types.ObjectId(address_id)
                }, {
                    $set: { addresses: userInfo.addresses }
                });
                return this.apiResponse.successResponse(res, "Address deleted successfully.");
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, "Not Found.");
            }
        } catch (err) {
            return this.apiResponse.ErrorResponseWithoutData(res, err.message);
        }
    }


    async activateAddress(user: CurrentUserDto, addressBody: ActivateAddressDto, res: Response) {
        try {
            const { address_id, active } = addressBody;

            const userInfo = await this.userModel.findOne({
                _id: user._id,
                'addresses._id': new Types.ObjectId(address_id)
            });

            if (userInfo) {
                userInfo.addresses && userInfo.addresses.map((address) => {
                    address.active = false;
                    if (address._id == address_id) {
                        address.active = active;
                    }
                })

                await this.userModel.updateOne({
                    _id: user._id,
                    'addresses._id': new Types.ObjectId(address_id)
                }, { $set: { addresses: userInfo.addresses } });
                const findAddress = userInfo.addresses.find((address) => address._id == address_id);
                return this.apiResponse.successResponseWithData(res, "Address updated successfully.", findAddress);
            } else {
                return this.apiResponse.ErrorResponse(res, 'User not found.', {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }
}
