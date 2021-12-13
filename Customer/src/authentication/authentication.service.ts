import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model, Types } from "mongoose";

import { CurrentUserDto } from "../home/dto/currentUser";
import { User } from "../schema/userModel.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { constants } from "../utils/constant";
import { Utility } from "../utils/utility.service";

@Injectable()
export class AuthenticationService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        private readonly apiResponse: ApiResponse,
        private readonly utility: Utility
    ) { }

    async customerUpdateProfileImage(user: CurrentUserDto, req: any, res: Response) {
        try {
            if (req.files && req.files.length > 0) {
                const userInfo = await this.userModel.findOne({ _id: user._id }, { profile: 1 });
                if (userInfo) {
                    if (userInfo.profile) {
                        // this.utility.deleteS3File(userInfo.profile, constants.CUSTOMER_BUCKET + 'profile');
                    }
                    req.files.forEach(async element => {
                        if (element.fieldname == 'profile') {
                            // const uploadedProfile: any = await this.utility.uploadFile(element.destination, element.filename, element.mimetype, constants.CUSTOMER_BUCKET + 'profile');
                            // if (uploadedProfile) {
                            //     const filename = uploadedProfile.data.split('/');
                            // await this.userModel.updateOne({ _id: user._id },
                            //     {
                            //         $set: {
                            //             profile: filename[5]
                            //         }
                            //     });

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


    async customerUpdateProfile(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { email, country_code, phone_number, firstname, lastname, dob, gender } = req.body;

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


    async addFamilyMember(user: CurrentUserDto, req: any, res: Response) {
        try {
            const { firstname, lastname, dob, relation } = req.body;

            if (req.files && req.files.length > 0) {
                req.files.forEach(async element => {
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
                                user_type: this.utility.getUserTypeByRelation(this.utility.calculateAge(dob), relation)
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


    async updateFamilyMemberProfile(user: CurrentUserDto, req: any, res: Response) {
        try {
            const { member_id, firstname, lastname, dob, relation } = req.body;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) });
            if (userInfo) {
                const updatedUser = [];
                userInfo.family_members && userInfo.family_members.map((member, i) => {
                    if (member._id == member_id) {
                        member.firstname = firstname ? firstname : member.firstname,
                            member.lastname = lastname ? lastname : member.lastname,
                            member.dob = dob ? dob : member.dob,
                            member.relation = relation ? relation : member.relation,
                            member.user_type = dob && relation ? this.utility.getUserTypeByRelation(this.utility.calculateAge(dob), relation) : member.user_type
                        member.profile = req.files ? req.files && req.files.forEach(async (element) => {
                            if (element.fieldname == 'family_member_profile') {
                                member.profile = element.filename
                                await this.utility.deleteS3File(member.profile, constants.CUSTOMER_BUCKET + 'profile/family_member');
                                const uploadedProfile = await this.utility.uploadFile(element.destination, element.filename, element.mimetype, constants.CUSTOMER_BUCKET + 'profile/family_member');
                                if (uploadedProfile) {
                                    return this.apiResponse.successResponse(res, 'Profile uploaded successfully');
                                } else {
                                    return this.apiResponse.ErrorResponseWithoutData(res, 'Something went wrong');
                                }
                            }
                        })
                            : member.profile
                        updatedUser.push(...userInfo.family_members)
                    }
                });
                const responseObj = updatedUser && updatedUser.find((item) => item._id == member_id)
                await this.userModel.updateOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) }, { $set: { family_members: updatedUser } })
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


    async deleteFamilyMemberProfile(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { member_id } = req.body;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'family_members._id': new Types.ObjectId(member_id) });
            console.log(`userInfo`, userInfo)
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


    async makeProfileDefault(user: CurrentUserDto, req: Request, res: Response) {

    }
}