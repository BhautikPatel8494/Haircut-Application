import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model, Types } from "mongoose";

import { Orders } from "../schema/order.schema";
import { Users } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { constants } from "../utils/constant";
import { Utility } from "../utils/utility.service";
import { CommonMemberDto, CreateFamilyMemberDto, CurrentUserDto, UpdateFamilyMemberDto, UpdateUserDto } from "./authentication.dto";

@Injectable()
export class AuthenticationService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<Users>,
        @InjectModel('Order') private readonly orderModel: Model<Orders>,
        private readonly apiResponse: ApiResponse,
        private readonly utility: Utility
    ) { }

    async customerUpdateProfileImage(user: CurrentUserDto, files: [], res: Response) {
        try {
            if (files && files.length > 0) {
                const userInfo = await this.userModel.findOne({ _id: user._id }, { profile: 1 });
                if (userInfo) {
                    if (userInfo.profile) {
                        this.utility.deleteS3File(userInfo.profile, constants.CUSTOMER_BUCKET + 'profile');
                    }
                    files.forEach(async (element: { fieldname: string, destination: string, filename: string, mimetype: string }) => {
                        if (element.fieldname == 'profile') {
                            const uploadedProfile: any = await this.utility.uploadFile(element.destination, element.filename, element.mimetype, constants.CUSTOMER_BUCKET + 'profile');
                            if (uploadedProfile) {
                                const filename = uploadedProfile.data.split('/');
                                await this.userModel.updateOne({ _id: user._id },
                                    {
                                        $set: {
                                            profile: filename[5]
                                        }
                                    });

                                const customerInfo = await this.userModel.findOne({ _id: user._id });
                                const { _id, firstname, lastname, email, gender, dob, country_code, phone_number, profile, default_profile } = customerInfo;
                                const responseObj = {
                                    _id: _id,
                                    firstname: firstname,
                                    lastname: lastname,
                                    email: email,
                                    gender: gender,
                                    dob: dob,
                                    country_code: country_code,
                                    phone_number: phone_number,
                                    profile: profile ? constants.CUSTOMER_PROFILE + profile : '',
                                    default_profile: default_profile
                                };

                                return this.apiResponse.successResponseWithData(res, "User details updated successfully.", responseObj);
                            }
                        }
                    });
                } else {
                    return this.apiResponse.ErrorResponse(res, 'User not found.', {});
                }
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Please select profile image.');
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async customerUpdateProfile(user: CurrentUserDto, userBody: UpdateUserDto, res: Response) {
        try {
            const { email, country_code, phone_number, firstname, lastname, dob, gender } = userBody;

            if (email) {
                const userInfo = await this.userModel.findOne({ email: email });
                if (userInfo) {
                    return this.apiResponse.ErrorResponse(res, 'Email already is already in use.', {});
                }
            }

            if (phone_number && country_code) {
                const userData = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
                if (userData) {
                    return this.apiResponse.ErrorResponse(res, 'Phone Number is already in use.', {});
                }
            }

            const userInfo = await this.userModel.findOne({ _id: user._id });
            const updateUserInfo = {
                firstname: firstname ? firstname : userInfo.firstname,
                lastname: lastname ? lastname : userInfo.lastname,
                email: email ? email : userInfo.email,
                gender: gender ? gender : userInfo.gender,
                dob: dob ? dob : userInfo.dob,
                phone_number: phone_number ? phone_number : userInfo.phone_number,
                country_code: country_code ? country_code : userInfo.country_code
            }
            if (updateUserInfo) {
                await this.userModel.updateOne({ _id: user._id }, { $set: updateUserInfo });
            }
            const updatedData = await this.userModel.findOne({ _id: user._id });
            const responseObj = {
                _id: updatedData._id,
                firstname: updatedData.firstname,
                lastname: updatedData.lastname,
                email: updatedData.email,
                gender: updatedData.gender,
                dob: updatedData.dob,
                country_code: updatedData.country_code,
                phone_number: updatedData.phone_number,
                profile: updatedData.profile ? constants.CUSTOMER_PROFILE + updatedData.profile : '',
                default_profile: updatedData.default_profile
            };

            return this.apiResponse.successResponseWithData(res, "User details updated successfully.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async addFamilyMember(user: CurrentUserDto, files: [], familyMemberBody: CreateFamilyMemberDto, res: Response) {
        try {
            const { firstname, lastname, dob, relation } = familyMemberBody;

            if (files && files.length > 0) {
                files.forEach(async (element: { fieldname: string, destination: string, filename: string, mimetype: string }) => {
                    if (element.fieldname == 'family_member_profile') {
                        const uploadedData: any = await this.utility.uploadFile(element.destination, element.filename, element.mimetype, constants.CUSTOMER_BUCKET + 'profile/family_member');
                        if (uploadedData) {
                            const filename = uploadedData.data.split('/');
                            const familyMemberData = {
                                _id: new Types.ObjectId(),
                                firstname: firstname,
                                lastname: lastname,
                                dob: dob,
                                relation: relation,
                                profile: filename[6],
                                user_type: this.utility.getUserTypeByRelation(this.utility.calculateAge(dob), relation),
                            }

                            await this.userModel.updateOne({ _id: user._id }, {
                                $push: { family_members: familyMemberData }
                            });
                            familyMemberData.profile = constants.CUSTOMER_FAMILY_MEMBER_PROFILE + familyMemberData.profile;
                            return this.apiResponse.successResponseWithData(res, "Family member added successfully.", familyMemberData);
                        }
                    }
                })
            } else {
                return this.apiResponse.validationErrorWithData(res, "Profile image is required", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async updateFamilyMemberProfile(user: CurrentUserDto, files: [], familyMemberBody: UpdateFamilyMemberDto, res: Response) {
        try {
            const { member_id, firstname, lastname, dob, relation } = familyMemberBody;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'family_members._id': member_id });
            if (userInfo) {
                const updatedUser = [];

                userInfo.family_members && userInfo.family_members.map((member, i) => {
                    if (member._id == member_id) {
                        return {
                            firstname: firstname ? firstname : member.firstname,
                            lastname: lastname ? lastname : member.lastname,
                            dob: dob ? dob : member.dob,
                            relation: relation ? relation : member.relation,
                            user_type: dob && relation ? this.utility.getUserTypeByRelation(this.utility.calculateAge(dob), relation) : member.user_type,
                            profile: files && files.length > 0 ? files && files.forEach(async (element: { fieldname: string, destination: string, filename: string, mimetype: string }) => {
                                if (element.fieldname == 'family_member_profile') {
                                    member.profile = element.filename
                                    await this.utility.deleteS3File(member.profile, constants.CUSTOMER_BUCKET + 'profile/family_member');
                                    await this.utility.uploadFile(element.destination, element.filename, element.mimetype, constants.CUSTOMER_BUCKET + 'profile/family_member');
                                }
                            })
                                : member.profile
                        }
                    }
                    updatedUser.push(...userInfo.family_members)
                });

                await this.userModel.updateOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) }, { $set: { family_members: updatedUser } })
                const responseObj = updatedUser && updatedUser.find((item) => item._id == member_id)
                responseObj.profile = responseObj.profile ? constants.CUSTOMER_FAMILY_MEMBER_PROFILE + responseObj.profile : null
                return this.apiResponse.successResponseWithData(res, "Family member profile updated successfully.", responseObj)
            } else {
                return this.apiResponse.ErrorResponse(res, "User not found", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async listAllProfiles(user: CurrentUserDto, res: Response) {
        try {
            const userInfo = await this.userModel.findOne({ _id: user._id });
            if (userInfo) {
                if (userInfo.family_members && userInfo.family_members.length > 0) {
                    const filterdData = userInfo.family_members.map((member) => {
                        return {
                            id: member._id,
                            firstname: member.firstname,
                            lastname: member.lastname,
                            profile: member.profile ? constants.CUSTOMER_FAMILY_MEMBER_PROFILE + member.profile : '',
                            user_type: member.user_type,
                            default_profile: member.default_profile,
                            dob: member.dob,
                            relation: "",
                            create_at: member.created_at,
                            updated_at: member.updated_at
                        }
                    });
                    return this.apiResponse.successResponseWithData(res, "family member's profile found successfully.", filterdData);
                } else {
                    return this.apiResponse.ErrorResponse(res, "Family member not found.", {});
                }
            } else {
                return this.apiResponse.ErrorResponse(res, "User not found.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async deleteFamilyMemberProfile(user: CurrentUserDto, familyMemberBody: CommonMemberDto, res: Response) {
        try {
            const { member_id } = familyMemberBody;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) });
            if (userInfo) {
                const findUserData = userInfo.family_members && userInfo.family_members.findIndex((member) => member._id == member_id);
                if (findUserData >= 0) {
                    userInfo.family_members.splice(findUserData, 1)
                }
                await this.userModel.updateOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) }, { $set: { family_members: userInfo.family_members } })
                return this.apiResponse.successResponse(res, "Family member profile deleted successfully.");
            } else {
                return this.apiResponse.successResponse(res, "User not found.");
            }
        } catch (err) {
            return this.apiResponse.ErrorResponseWithoutData(res, err.message);
        }
    }


    async makeProfileDefault(user: CurrentUserDto, familyMemberBody: CommonMemberDto, res: Response) {
        try {
            const { member_id } = familyMemberBody;

            if (member_id == 'auth') {
                const userInfo = await this.userModel.findOne({ _id: user._id });
                if (userInfo) {
                    if (userInfo.family_members) {
                        userInfo.family_members.map((item) => item.default_profile = false);
                    }
                    userInfo.default_profile = true;
                    userInfo.save();

                    const userData = await this.userModel.findOne({ _id: user._id });
                    const responseObj = {
                        profile: userData.profile ? constants.CUSTOMER_PROFILE + userData.profile : '',
                        default_profile: true,
                        _id: userData._id,
                        firstname: userData.firstname ? userData.firstname : '',
                        lastname: userData.lastname ? userData.lastname : '',
                        dob: userData.dob ? userData.dob : '',
                        user_type: userData.user_type ? userData.user_type : '',
                        created_at: userData.created_at ? userData.created_at : '',
                        updated_at: userData.updated_at ? userData.updated_at : ''
                    }
                    return this.apiResponse.successResponseWithData(res, 'Default profile saved!', responseObj);
                }
            } else {
                const userInfo = await this.userModel.findOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) });
                if (userInfo) {
                    userInfo.default_profile = false;
                    if (userInfo.family_members) {
                        userInfo.family_members.map((member) => {
                            if (member._id == member_id) {
                                member.default_profile = true;
                            }
                        })
                    }
                    userInfo.save();

                    const userData = await this.userModel.findOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) });
                    if (userData.family_members) {
                        const familyMemberInfo = userInfo.family_members.find((member) => member._id == member_id);
                        const responseObj = {
                            profile: familyMemberInfo.profile ? constants.CUSTOMER_FAMILY_MEMBER_PROFILE + familyMemberInfo.profile : '',
                            default_profile: true,
                            _id: familyMemberInfo._id,
                            firstname: familyMemberInfo.firstname ? familyMemberInfo.firstname : '',
                            lastname: familyMemberInfo.lastname ? familyMemberInfo.lastname : '',
                            dob: familyMemberInfo.dob ? familyMemberInfo.dob : '',
                            relation: familyMemberInfo.relation ? familyMemberInfo.relation : '',
                            user_type: familyMemberInfo.user_type ? familyMemberInfo.user_type : '',
                            created_at: familyMemberInfo.created_at ? familyMemberInfo.created_at : '',
                            updated_at: familyMemberInfo.updated_at ? familyMemberInfo.updated_at : ''
                        }
                        return this.apiResponse.successResponseWithData(res, 'Default profile saved.', responseObj);
                    }
                } else {
                    return this.apiResponse.ErrorResponse(res, 'User not found.', {});
                }
            }
        } catch (err) {
            return this.apiResponse.ErrorResponseWithoutData(res, err.message);
        }
    }


    async getProfile(user: CurrentUserDto, res: Response) {
        try {
            const userInfo = await this.userModel.findOne({ _id: user._id });
            const responseObj = {
                _id: userInfo._id,
                firstname: userInfo.firstname,
                lastname: userInfo.lastname,
                middlename: userInfo.middlename,
                email: userInfo.email,
                gender: userInfo.gender,
                dob: userInfo.dob,
                country_code: userInfo.country_code,
                phone_number: userInfo.phone_number,
                profile: userInfo.profile ? constants.CUSTOMER_PROFILE + userInfo.profile : '',
                default_profile: userInfo.default_profile
            };
            return this.apiResponse.successResponseWithData(res, "User found successfully.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async bookingListing(user: CurrentUserDto, filterBody: Request, res: Response) {
        try {
            const { page, limit } = filterBody.body;
            const { filter } = filterBody.query;

            const pages = parseInt(page) ? parseInt(page) : 1;
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limits * pages) - limits;
            const filterData = filter ? filter : 'new';
            let queryObj = {};

            if (filterData == "new") {
                queryObj = { booking_status: { $in: [0, 1, 2, 3] } }
            } else if (filterData == "old") {
                queryObj = { booking_status: { $in: [4, 5, 6, 7, 8] } }
            } else {
                queryObj = { booking_status: { $in: [0] } }
            }

            const orderDetail = await this.orderModel.aggregate([
                { $match: { user_id: new Types.ObjectId(user._id) } },
                { $match: queryObj },
                { $lookup: { from: 'service_providers', localField: "stylist_id", foreignField: '_id', as: "stylist" } },
                { $unwind: { path: "$stylist", preserveNullAndEmptyArrays: true } },
                { $skip: skip },
                { $limit: limits },
                { $sort: { _id: -1 } },
                {
                    $project: {
                        order_number: 1,
                        booking_status: 1,
                        direct_order: 1,
                        date: 1,
                        booking_type: 1,
                        "stylist_profile": { $concat: [constants.STYLIST_PROFILE, "$stylist.profile"] }
                    }
                }
            ]);

            if (orderDetail.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Order found successfully', orderDetail);
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'No Booking found!');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponseWithoutData(res, e.message);
        }
    }
}