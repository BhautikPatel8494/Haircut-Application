import { JwtService } from '@nestjs/jwt';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';

import { CountriesWithCodes } from "src/schema/countriesWithCode.schema";
import { ServiceProviders } from "src/schema/serviceProvider.schema";
import { ApiResponse } from "src/utils/apiResponse.service";
import { COSMETOLOGY_LICENSE_IMAGE, CUSTOMER_PROFILE, DRIVING_LICENSE_IMAGE, LIABILITY_IMAGE, RIZWAN_SIGNATURE_IMAGE, STYLIST_PROFILE } from "src/utils/constant";
import { UtilityService } from "src/utils/utlity.service";
import { Request, Response } from "express";
import { TempOtps } from "src/schema/tempOtp.schema";
import { ConnectedAccounts } from 'src/schema/connectedAccount.schema';
import { Addresses, Users } from 'src/schema/user.schema';

const excludePhoneNumberList = [
    "8896800983",
    "7982764035",
    "8744944068",
    "9149090171",
    "8141335492",
    "8791683678",
    "7428723247",
    "2127290149",
    "7428731210",
    "7873375275",
    "2018577757",
    "2243359185",
    "2163547758"
]

@Injectable()
export class UserAuthService {
    constructor(private readonly utilityService: UtilityService,
        private readonly apiResponse: ApiResponse,
        @InjectModel('serviceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
        @InjectModel('connectedAccounts') private readonly connectedAccountsModel: Model<ConnectedAccounts>,
        @InjectModel('countriesWithCodes') private readonly countriesWithCodesModel: Model<CountriesWithCodes>,
        @InjectModel('user') private readonly userModel: Model<Users>,
        @InjectModel('tempOtp') private readonly tempOtpModel: Model<TempOtps>,
        private jwtService: JwtService
    ) { }

    async stylistRegister(files, req: Request, res: Response) {
        try {
            let customerCode = "INV" + this.utilityService.generateOTP()
            let stylistCode = "INV" + this.utilityService.generateOTP()
            console.log(customerCode, stylistCode, req.body.country_code)
            let country = await this.countriesWithCodesModel.findOne({ dial_code: req.body.country_code }, { code: 1 })

            const hash = await bcrypt.hash(req.body.password, 10)

            var serviceProvider = new this.serviceProviderModel(
                {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    middlename: (req.body.middlename) ? req.body.middlename : '',
                    full_name: (req.body.middlename) ? req.body.firstname + " " + req.body.middlename + " " + req.body.lastname : req.body.firstname + " " + req.body.lastname,
                    email: req.body.email,
                    password: hash,
                    otp: this.utilityService.generateOTP(),
                    gender: req.body.gender ? req.body.gender : '',
                    customer_referral_code: customerCode,
                    stylist_referral_code: stylistCode,
                    dob: (req.body.dob) ? req.body.dob : '',
                    player_id: req.body.player_id ? req.body.player_id : '',
                    tags: req.body.tags ? req.body.tags : [],
                    country_code: req.body.country_code,
                    country: req.body.country ? req.body.country : country.code,
                    phone_number: req.body.phone_number,
                    category: req.body.category,
                    registration_status: "awaiting",
                    specialization: req.body.specialization,
                    experience: req.body.experience,
                    address: (req.body.address) ? req.body.address : '',
                    city: (req.body.city) ? req.body.city : '',
                    state: (req.body.state) ? req.body.state : '',
                    zip_code: (req.body.zip_code) ? req.body.zip_code : '',
                    ssn_number: (req.body.ssn_number) ? req.body.ssn_number : '',
                    cosmetology_license: (req.body.cosmetology_license) ? req.body.cosmetology_license : '',
                    driving_license: (req.body.driving_license) ? req.body.driving_license : '',
                    contractor: (req.body.contractor) ? req.body.contractor : 0,
                    liability_waiver: (req.body.liability_waiver) ? req.body.liability_waiver : 0,
                    privacy_policy: (req.body.privacy_policy) ? req.body.privacy_policy : 0,
                    terms_condition: (req.body.terms_condition) ? req.body.terms_condition : 0,
                    connect_id: '',
                    is_stylist_onboarding_complete: false,
                    lat: req.body.lat,
                    lng: req.body.lng,
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
                    },
                    devices: [{
                        type: req.body.device_type,
                        token: (req.body.device_token) ? req.body.device_token : ''
                    }]

                }
            );

            const success = await serviceProvider.save();
            if (success) {
                if (files) {
                    files.forEach(element => {
                        let bucket = '';
                        let fieldToUpdate = '';
                        if (element.fieldname == 'cosmetology_license_image') {
                            success.cosmetology_license_image = COSMETOLOGY_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/cosmetology_licence';
                            this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        cosmetology_license_image: element.filename
                                    }
                                }).then(updated => {
                                    console.log('updated', updated);
                                }).catch(update_err => { });
                        } else if (element.fieldname == 'driving_license_image') {
                            success.driving_license_image = DRIVING_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/driving_licence';
                            this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        driving_license_image: element.filename
                                    }
                                }).then(updated => {
                                    console.log('updated', updated);
                                }).catch(update_err => { });
                        } else if (element.fieldname == 'profile') {

                            success.profile = STYLIST_PROFILE + element.filename;
                            bucket = 'instacuts/service_provider/profile';
                            this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        profile: element.filename
                                    }
                                }).then(updated => {
                                    console.log('updated', updated);
                                }).catch(update_err => { });

                        } else if (element.fieldname == 'liability_waiver_image') {
                            success.liability_waiver_image = LIABILITY_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/liability_waiver';
                            //success.element.fieldname = element.filename;
                            this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        liability_waiver_image: element.filename
                                    }
                                }).then(updated => {
                                    console.log('updated', updated);
                                }).catch(update_err => { });
                        }

                        //upload documents to buckets
                        const uploaded: any = this.utilityService.uploadFile(element.destination, element.filename, element.mimetype, bucket)
                        let filename = uploaded.data.split('/');
                        console.log('fieldToUpdate', fieldToUpdate);
                        console.log('success._id', success._id);
                    });
                }
            }

            const jwtPayload = JSON.parse(JSON.stringify(success));
            const jwtData = {
                audience: process.env.JWT_AUDIENCE,
                secret: process.env.JWT_SECRET
            };
            jwtPayload.authToken = this.jwtService.sign(jwtPayload, jwtData);
            jwtPayload.signatureUrl = RIZWAN_SIGNATURE_IMAGE;
            return res.status(200).json({ status: 200, messgae: "Registration Success.", data: jwtPayload });
        } catch (err) {
            console.log(err)
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistLogin(req: Request, res: Response) {
        try {
            const user = await this.serviceProviderModel.findOne({ phone_number: req.body.phone_number, country_code: req.body.country_code })
            if (user) {
                let otp = excludePhoneNumberList.includes(req.body.phone_number) ? "123456" : this.utilityService.generateOTP()
                this.tempOtpModel.create({ phone_number: req.body.phone_number, otp: otp });
                await this.serviceProviderModel.updateOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }, { $set: { otp: otp } })
                if (excludePhoneNumberList.includes(req.body.phone_number)) {
                    return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                } else {
                    let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${req.body.hash ? req.body.hash : ''}`
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const message = client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${req.body.country_code}${req.body.phone_number}` })
                    if (message) {
                        console.log(message);
                        return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                    } else {
                        return this.apiResponse.ErrorResponseWithoutData(res, 'Something went wrong.');
                    }
                }
            } else {
                return this.apiResponse.unauthorizedResponse(res, "This mobile number is not registered.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistVerifyOTPConfirm(req, res) {
        try {
            let token = {
                type: req.body.device_type,
                token: (req.body.device_token) ? req.body.device_token : ''
            }
            const user = await this.serviceProviderModel.findOne({ phone_number: req.body.phone_number, country_code: req.body.country_code })
            let updateParams;
            if (user && user.disable === 2 && user.is_first_login) {
                updateParams = { otp: null, is_first_login: 0, devices: [token] }
            } else {
                updateParams = {
                    otp: null, devices: [token], player_id: req.body.player_id ? req.body.player_id : '',
                    tags: req.body.tags ? req.body.tags : [],
                }
            }
            let nullToken = {
                type: req.body.device_type,
                token: ''
            }
            await this.serviceProviderModel.updateMany({ "devices.token": req.body.device_token }, { $set: nullToken })
            await this.serviceProviderModel.updateOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }, { $set: updateParams })
            if (user) {
                let otp = await this.tempOtpModel.findOne({ phone_number: req.body.phone_number, otp: req.body.token });
                if (!otp) {
                    return this.apiResponse.ErrorResponse(res, 'Not a valid token.', {});
                }
                this.tempOtpModel.deleteMany({ phone_number: req.body.phone_number })

                let account = await this.connectedAccountsModel.findOne({ stylist_id: user._id }, { stripe_data: 1 })
                let stripeConnectId = '';
                if (account && account.stripe_data.business_type === "individual") {
                    stripeConnectId = account ? account.stripe_data.id : '';
                } else {
                    stripeConnectId = account ? account.stripe_data.account : '';
                }
                let userData = {
                    _id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    middlename: user.middlename,
                    email: user.email,
                    gender: user.gender,
                    is_first_login: user.is_first_login,
                    registration_status: user.registration_status ? user.registration_status : "awaiting",
                    dob: user.dob,
                    customer_referral_code: user.customer_referral_code ? user.customer_referral_code : "INV" + this.utilityService.generateOTP(),
                    stylist_referral_code: user.stylist_referral_code ? user.stylist_referral_code : "INV" + this.utilityService.generateOTP(),
                    country_code: user.country_code,
                    phone_number: user.phone_number,
                    category: user.category,
                    specialization: user.specialization,
                    experience: user.experience,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    zip_code: user.zip_code,
                    ssn_number: user.ssn_number,
                    cosmetology_license: user.cosmetology_license,
                    driving_license: user.driving_license,
                    contractor: user.contractor,
                    signatureUrl: RIZWAN_SIGNATURE_IMAGE,
                    liability_waiver: user.liability_waiver,
                    privacy_policy: user.privacy_policy,
                    terms_condition: user.terms_condition,
                    connect_id: stripeConnectId,
                    register_location: user.register_location,
                    is_stylist_onboarding_complete: user.is_stylist_onboarding_complete ? user.is_stylist_onboarding_complete : false,
                    profile: user.profile ? STYLIST_PROFILE + user.profile : '',
                    online: user.online,
                    radius: user.radius,
                    order_type: user.order_type,
                    preferences: user.preferences,
                    is_signing_completed: user.is_signing_completed,
                    is_bank_linked: user.is_bank_linked,
                    is_personalized_completed: user.is_personalized_completed,
                    is_workpreference_complete: user.is_workpreference_complete,
                    learn_to_use_app: user.learn_to_use_app ? user.learn_to_use_app : false,
                    token: null
                };
                if ((!user.customer_referral_code && !user.stylist_referral_code) || (user.stylist_referral_code == '' && user.customer_referral_code == '')) {
                    await this.serviceProviderModel.updateOne({ _id: user._id }, { $set: { customer_referral_code: userData.customer_referral_code, stylist_referral_code: userData.stylist_referral_code } })
                }
                const jwtPayload = userData;
                const jwtData = {
                    audience: process.env.JWT_AUDIENCE,
                    secret: process.env.JWT_SECRET
                };
                userData.token = this.jwtService.sign(jwtPayload, jwtData);
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", userData);
            } else {
                const userOtp = await this.tempOtpModel.findOne({ phone_number: req.body.phone_number, otp: req.body.token }).sort({ _id: -1 })
                if (!userOtp) {
                    return this.apiResponse.ErrorResponse(res, 'Not a valid token.', {});
                }
                await this.tempOtpModel.deleteMany({ phone_number: req.body.phone_number })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistCheckPhoneNumber(req, res) {
        try {
            if (req.body.type == 'email') {
                const findStylistEmail = await this.serviceProviderModel.find({ email: req.body.email })
                if (findStylistEmail) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Email already in use.');
                } else {
                    return this.apiResponse.successResponseWithNoData(res, "verification success.");
                }
            }
            else {
                const findServicceProviderInfo = await this.serviceProviderModel.find({ phone_number: req.body.phone_number, country_code: req.body.country_code });
                if (findServicceProviderInfo.length) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Phone Number already in use.');
                } else {
                    let otp = excludePhoneNumberList.includes(req.body.phone_number) ? "123456" : this.utilityService.generateOTP()
                    this.tempOtpModel.create({ phone_number: req.body.phone_number, country_code: req.body.country_code, otp: otp })
                    if (excludePhoneNumberList.includes(req.body.phone_number)) {
                        return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                    } else {
                        let otpMessage = `Your Instacutes verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${req.body.hash ? req.body.hash : ''}`
                        if (!excludePhoneNumberList.includes(req.body.phone_number)) {
                            const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                            const messageTwilio = client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${req.body.country_code}${req.body.phone_number}` })
                            if (messageTwilio) {
                                return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                            } else {
                                return this.apiResponse.ErrorResponseWithoutData(res, 'Something went wrong.');
                            }
                        }
                        return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                    }
                }
            };
        }
        catch (error) {
            return this.apiResponse.ErrorResponseWithoutData(res, error.message);
        }
    }

    async checkStylistStatus(req: Request, res: Response) {
        try {
            let provider = await this.serviceProviderModel.findOne({ _id: req.body.stylist_id })
            if (!provider) {
                return this.apiResponse.ErrorResponse(res, 'Stylist not found!', {});
            }
            let obj = {
                registration_status: provider.registration_status ? provider.registration_status : 'awaiting',
                _id: provider._id ? provider._id : ''
            }
            return this.apiResponse.successResponseWithData(res, 'Record found', obj);
        }
        catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async customerRegister(files, req: Request, res: Response) {
        try {
            const hash = await bcrypt.hash(req.body.password, 10)
            const createObj = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                password: hash,
                lat: req.body.lat,
                lng: req.body.lng,
                gender: req.body.gender ? req.body.gender : '',
                dob: req.body.dob ? req.body.dob : '',
                country_code: req.body.country_code,
                phone_number: req.body.phone_number,
                user_type: req.body.gender && req.body.dob ? this.utilityService.getUserType(this.utilityService.calculateAge(req.body.dob), req.body.gender) : '',
                devices: [{
                    type: req.body.device_type,
                    token: (req.body.device_token) ? req.body.device_token : ''
                }]
            }
            const userCreateInfo = await this.userModel.create(createObj);
            const responseObj = {
                _id: userCreateInfo._id,
                firstname: userCreateInfo.firstname,
                lastname: userCreateInfo.lastname,
                email: userCreateInfo.email,
                gender: userCreateInfo.gender,
                dob: userCreateInfo.dob,
                country_code: userCreateInfo.country_code,
                phone_number: userCreateInfo.phone_number,
                profile: userCreateInfo.profile ? CUSTOMER_PROFILE + userCreateInfo.profile : '',
                default_profile: userCreateInfo.default_profile,
                user_type: userCreateInfo.user_type !== '' ? userCreateInfo.user_type : 'men',
                address_id: '',
                token: null,
            };
            const jwtPayload = responseObj;
            const jwtData = {
                audience: process.env.JWT_AUDIENCE,
                secret: process.env.JWT_SECRET
            };
            responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
            return this.apiResponse.successResponseWithData(res, "Registration Success.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerLogin(req, res) {
        try {
            this.userModel.findOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }).then(async user => {
                if (user) {

                    let otp = excludePhoneNumberList.includes(req.body.phone_number) ? "123456" : this.utilityService.generateOTP()
                    await this.userModel.updateOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }, { $set: { otp: otp } })
                    if (excludePhoneNumberList.includes(req.body.phone_number)) {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                    } else {
                        let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${req.body.hash ? req.body.hash : ''}`
                        const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                        const messageTwillo = await client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${req.body.country_code}${req.body.phone_number}` })
                        if (messageTwillo) {
                            return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                        } else {
                            return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                        };
                    }
                } else {
                    let otp = excludePhoneNumberList.includes(req.body.phone_number) ? "123456" : this.utilityService.generateOTP()
                    await this.tempOtpModel.create({ phone_number: req.body.phone_number, otp: otp })
                    await this.userModel.updateOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }, { $set: { otp: otp } })
                    if (excludePhoneNumberList.includes(req.body.phone_number)) {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                    } else {
                        let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${req.body.hash ? req.body.hash : ''}`
                        const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                        const messageTwillo = await client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${req.body.country_code}${req.body.phone_number}` })
                        if (messageTwillo) {
                            return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                        } else {
                            return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                        }
                    }
                }
            });
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerVerifyOTPConfirm(req: Request, res: Response) {
        try {
            const user = await this.userModel.findOne({ phone_number: req.body.phone_number, country_code: req.body.country_code, otp: req.body.token })
            if (user) {
                let body = {
                    otp: null,
                    player_id: req.body.player_id ? req.body.player_id : '',
                    tags: req.body.tags ? req.body.tags : [],
                }
                await this.userModel.updateOne({ phone_number: req.body.phone_number, country_code: req.body.country_code }, { $set: body })
                if (req.body.device_type && req.body.device_token) {
                    this.userModel.find({ "devices": { $elemMatch: { token: req.body.device_token, type: req.body.device_type } } }, function (user_err, user_result) {
                        console.log('user_result', user_result);
                    });
                }

                let defaultProfile = {};
                if (user.family_members) {
                    defaultProfile = user.family_members.find(function (element) {
                        if (element.default_profile) {
                            return element;
                        }
                    });
                }
                let activeAddress: Addresses;
                if (user.addresses) {
                    activeAddress = user.addresses.find(function (elem) {
                        if (elem.active) {
                            return elem;
                        }
                    });
                }
                let userData = {
                    _id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    gender: user.gender,
                    dob: user.dob,
                    country_code: user.country_code,
                    lat: activeAddress.lat,
                    lng: activeAddress.lng,
                    address: activeAddress.address,
                    active: activeAddress.active,
                    preference: user.preference,
                    phone_number: user.phone_number,
                    profile: user.profile ? CUSTOMER_PROFILE + user.profile : '',
                    user_type: user.user_type ? user.user_type : 'men',
                    default_profile: user.default_profile,
                    address_id: activeAddress ? activeAddress._id : '',
                    token: null,
                    default_profile_data: null,
                };
                const jwtPayload = userData;
                const jwtData = {
                    audience: process.env.JWT_AUDIENCE,
                    secret: process.env.JWT_SECRET,
                };
                userData.token = this.jwtService.sign(jwtPayload, jwtData);
                userData.default_profile_data = (defaultProfile != undefined) ? defaultProfile : {};
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", userData);
            } else {
                let userData = {};
                const userOtp = await this.tempOtpModel.findOne({ phone_number: req.body.phone_number, otp: req.body.token })
                if (!userOtp) {
                    return this.apiResponse.ErrorResponseWithoutData(res, "Invalid otp.")
                }
                await this.tempOtpModel.deleteMany({ phone_number: req.body.phone_number })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerLoginWithPassword(req, res) {
        try {
            const user = await this.userModel.findOne({ phone_number: req.body.phone_number, country_code: req.body.country_code })
            if (user) {
                let password = bcrypt.compareSync(req.body.password, user.password);
                if (password) {
                    if (req.body.device_type && req.body.device_token) {
                        this.userModel.find({ "devices": { $elemMatch: { token: req.body.device_token, type: req.body.device_type } } }, function (user_err, user_result) {
                            console.log('user_result', user_result);
                        });
                    }
                    let defaultProfile = {};
                    if (user.family_members) {
                        defaultProfile = user.family_members.find(function (element) {
                            if (element.default_profile) {
                                return element;
                            }
                        });
                    }
                    let activeAddress: Addresses;
                    if (user.addresses) {
                        activeAddress = user.addresses.find(function (elem) {
                            if (elem.active) {
                                return elem;
                            }
                        });
                    }
                    let userData = {
                        _id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        gender: user.gender,
                        dob: user.dob,
                        country_code: user.country_code,
                        lat: activeAddress.lat,
                        lng: activeAddress.lng,
                        address: activeAddress.address,
                        active: activeAddress.active,
                        preference: user.preference,
                        phone_number: user.phone_number,
                        profile: user.profile ? CUSTOMER_PROFILE + user.profile : '',
                        user_type: user.user_type,
                        default_profile: user.default_profile,
                        address_id: activeAddress ? activeAddress._id : '',
                        token: null,
                        default_profile_data: null,
                    };
                    const jwtPayload = userData;
                    const jwtData = {
                        audience: process.env.JWT_AUDIENCE,
                        secret: process.env.JWT_SECRET
                    };
                    userData.token = this.jwtService.sign(jwtPayload, jwtData);
                    userData.default_profile_data = (defaultProfile != undefined) ? defaultProfile : {};
                    return this.apiResponse.successResponseWithData(res, "Verified successfully.", userData);
                } else {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Password is not correct!')
                }
            } else {
                return this.apiResponse.ErrorResponse(res, 'User not found', {});
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }
}