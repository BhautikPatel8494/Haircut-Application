import { JwtService } from '@nestjs/jwt';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';
import { Response } from "express";

import { CountriesWithCodes } from "../schema/countriesWithCode.schema";
import { ServiceProviders } from "../schema/serviceProvider.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { COSMETOLOGY_LICENSE_IMAGE, CUSTOMER_PROFILE, DRIVING_LICENSE_IMAGE, LIABILITY_IMAGE, RIZWAN_SIGNATURE_IMAGE, STYLIST_PROFILE } from "../utils/constant";
import { UtilityService } from "../utils/utlity.service";
import { TempOtps } from "../schema/tempOtp.schema";
import { ConnectedAccounts } from '../schema/connectedAccount.schema';
import { Addresses, FamilyMembers, Users } from '../schema/user.schema';
import { Admins } from '../schema/admin.schema';
import { SendMail } from '../utils/sendMail.service';
import { AdminForgotPasswordDto, AdminLoginDto, AdminRegisterDto, AdminResetPasswordDto, AdminVerifyDto, CheckStylistStatusDto, CheckUserStatusDto, CustomerLoginDto, CustomerLoginWithPassword, CustomerRegisterDto, CustomerVerifyOTPConfirmDto, EnableDisableAdminDto, EnableDisableCustomerDto, EnableDisableStylistDto, StylistCheckPhoneNumberDto, StylistLoginDto, StylistRegisterDto, StylistVerifyOTPConfirmDto } from './userAuth.dto';

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
    constructor(
        @InjectModel('ServiceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
        @InjectModel('ConnectedAccounts') private readonly connectedAccountsModel: Model<ConnectedAccounts>,
        @InjectModel('CountriesWithCodes') private readonly countriesWithCodesModel: Model<CountriesWithCodes>,
        @InjectModel('User') private readonly userModel: Model<Users>,
        @InjectModel('Admin') private readonly adminModel: Model<Admins>,
        @InjectModel('TempOtp') private readonly tempOtpModel: Model<TempOtps>,
        private readonly utilityService: UtilityService,
        private sendMailService: SendMail,
        private readonly apiResponse: ApiResponse,
        private jwtService: JwtService,
    ) { }

    async stylistRegister(files: any, stylistDetail: StylistRegisterDto, res: Response) {
        try {
            const { country_code, password, firstname, lastname, middlename, email, gender, dob, player_id, tags, phone_number, category, specialization,
                experience, address, city, state, zip_code, ssn_number, cosmetology_license, driving_license, contractor, liability_waiver,
                privacy_policy, terms_condition, lat, lng, device_type, device_token } = stylistDetail;

            const customerCode = "INV" + this.utilityService.generateOTP()
            const stylistCode = "INV" + this.utilityService.generateOTP()

            const countryCode = await this.countriesWithCodesModel.findOne({ dial_code: country_code }, { code: 1 })

            const securePassword = await bcrypt.hash(password, 10);

            const stylistInfo = new this.serviceProviderModel({
                firstname: firstname,
                lastname: lastname,
                middlename: (middlename) ? middlename : null,
                full_name: middlename ? `${firstname} ${middlename} ${lastname}` : `${firstname} ${lastname}`,
                email: email,
                password: securePassword,
                otp: this.utilityService.generateOTP(),
                gender: gender ? gender : null,
                customer_referral_code: customerCode,
                stylist_referral_code: stylistCode,
                dob: dob ? dob : null,
                player_id: player_id ? player_id : null,
                tags: tags ? tags : [],
                country_code: country_code,
                country: countryCode ? countryCode : countryCode.code,
                phone_number: phone_number,
                category: category,
                registration_status: "awaiting",
                specialization: specialization,
                experience: experience,
                address: address ? address : null,
                city: city ? city : null,
                state: state ? state : null,
                zip_code: zip_code ? zip_code : null,
                ssn_number: ssn_number ? ssn_number : null,
                cosmetology_license: cosmetology_license ? cosmetology_license : null,
                driving_license: driving_license ? driving_license : null,
                contractor: contractor ? contractor : 0,
                liability_waiver: liability_waiver ? liability_waiver : 0,
                privacy_policy: privacy_policy ? privacy_policy : 0,
                terms_condition: terms_condition ? terms_condition : 0,
                connect_id: null,
                is_stylist_onboarding_complete: false,
                live_location: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                register_location: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                devices: [{
                    type: device_type,
                    token: device_token ? device_token : null
                }],
                access_token: null
            }
            );

            const savedData = await stylistInfo.save();
            if (savedData) {
                if (files && files.length > 0) {
                    files.forEach(async (element: any) => {
                        let bucket = null;
                        if (element.fieldname == 'cosmetology_license_image') {
                            savedData.cosmetology_license_image = COSMETOLOGY_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/cosmetology_licence';
                            await this.serviceProviderModel.updateOne({ _id: savedData._id }, {
                                $set: {
                                    cosmetology_license_image: element.filename
                                }
                            })
                        } else if (element.fieldname == 'driving_license_image') {
                            savedData.driving_license_image = DRIVING_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/driving_licence';
                            await this.serviceProviderModel.updateOne({ _id: savedData._id }, {
                                $set: {
                                    driving_license_image: element.filename
                                }
                            })
                        } else if (element.fieldname == 'profile') {
                            savedData.profile = STYLIST_PROFILE + element.filename;
                            bucket = 'instacuts/service_provider/profile';
                            await this.serviceProviderModel.updateOne({ _id: savedData._id }, {
                                $set: {
                                    profile: element.filename
                                }
                            })
                        } else if (element.fieldname == 'liability_waiver_image') {
                            savedData.liability_waiver_image = LIABILITY_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/liability_waiver';
                            await this.serviceProviderModel.updateOne({ _id: savedData._id }, {
                                $set: {
                                    liability_waiver_image: element.filename
                                }
                            })
                        }
                        await this.utilityService.uploadFile(element.destination, element.filename, element.mimetype, bucket)
                    });
                }
            }
            const jwtPayload = JSON.parse(JSON.stringify(savedData));
            const jwtData = {
                audience: process.env.JWT_AUDIENCE,
                secret: process.env.JWT_SECRET
            };
            jwtPayload.authToken = this.jwtService.sign(jwtPayload, jwtData);
            await this.serviceProviderModel.updateOne({ _id: savedData._id }, { access_token: jwtPayload.authToken })
            jwtPayload.signatureUrl = RIZWAN_SIGNATURE_IMAGE;
            return this.apiResponse.successResponseWithData(res, "Registration Success.", jwtPayload);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistLogin(stylistLogin: StylistLoginDto, res: Response) {
        try {
            const { phone_number, country_code, hash } = stylistLogin;

            const stylistInfo = await this.serviceProviderModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (stylistInfo) {
                const stylistOtp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                this.tempOtpModel.create({ phone_number: phone_number, otp: stylistOtp });
                await this.serviceProviderModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: stylistOtp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                } else {
                    const otpMessage = `Your Instacuts verification code is: ${stylistOtp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : null}`
                    const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const isSendMessage = twilioClient.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (isSendMessage) {
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

    async stylistVerifyOTPConfirm(verifyOtp: StylistVerifyOTPConfirmDto, res: Response) {
        try {
            const { token, phone_number, country_code, device_token, device_type, player_id, tags } = verifyOtp;

            const deviceInfo = {
                type: device_type,
                token: device_token ? device_token : null
            }
            const stylistInfo = await this.serviceProviderModel.findOne({ phone_number: phone_number, country_code: country_code })
            let updateParams = {};
            if (stylistInfo && stylistInfo.disable === 2 && stylistInfo.is_first_login) {
                updateParams = { otp: null, is_first_login: 0, devices: [deviceInfo] }
            } else {
                updateParams = {
                    otp: null, devices: [deviceInfo], player_id: player_id ? player_id : null,
                    tags: tags ? tags : [],
                }
            }
            const nullDeviceInfo = {
                type: device_type,
                token: null
            }
            await this.serviceProviderModel.updateMany({ "devices.token": device_token }, { $set: nullDeviceInfo })
            await this.serviceProviderModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: updateParams })
            if (stylistInfo) {
                let otp = await this.tempOtpModel.findOne({ phone_number: phone_number, otp: token });
                if (!otp) {
                    return this.apiResponse.ErrorResponse(res, 'Not a valid token.', {});
                }
                this.tempOtpModel.deleteMany({ phone_number: phone_number })

                const accountInfo = await this.connectedAccountsModel.findOne({ stylist_id: stylistInfo._id }, { stripe_data: 1 })
                let stripeConnectId = null;
                if (accountInfo && accountInfo.stripe_data.business_type === "individual") {
                    stripeConnectId = accountInfo ? accountInfo.stripe_data.id : null;
                } else {
                    stripeConnectId = accountInfo ? accountInfo.stripe_data.account : null;
                }

                const responseObj = {
                    _id: stylistInfo._id,
                    firstname: stylistInfo.firstname,
                    lastname: stylistInfo.lastname,
                    middlename: stylistInfo.middlename,
                    email: stylistInfo.email,
                    gender: stylistInfo.gender,
                    is_first_login: stylistInfo.is_first_login,
                    registration_status: stylistInfo.registration_status ? stylistInfo.registration_status : "awaiting",
                    dob: stylistInfo.dob,
                    customer_referral_code: stylistInfo.customer_referral_code ? stylistInfo.customer_referral_code : "INV" + this.utilityService.generateOTP(),
                    stylist_referral_code: stylistInfo.stylist_referral_code ? stylistInfo.stylist_referral_code : "INV" + this.utilityService.generateOTP(),
                    country_code: stylistInfo.country_code,
                    phone_number: stylistInfo.phone_number,
                    category: stylistInfo.category,
                    specialization: stylistInfo.specialization,
                    experience: stylistInfo.experience,
                    address: stylistInfo.address,
                    city: stylistInfo.city,
                    state: stylistInfo.state,
                    zip_code: stylistInfo.zip_code,
                    ssn_number: stylistInfo.ssn_number,
                    cosmetology_license: stylistInfo.cosmetology_license,
                    driving_license: stylistInfo.driving_license,
                    contractor: stylistInfo.contractor,
                    signatureUrl: RIZWAN_SIGNATURE_IMAGE,
                    liability_waiver: stylistInfo.liability_waiver,
                    privacy_policy: stylistInfo.privacy_policy,
                    terms_condition: stylistInfo.terms_condition,
                    connect_id: stripeConnectId,
                    register_location: stylistInfo.register_location,
                    is_stylist_onboarding_complete: stylistInfo.is_stylist_onboarding_complete ? stylistInfo.is_stylist_onboarding_complete : false,
                    profile: stylistInfo.profile ? STYLIST_PROFILE + stylistInfo.profile : null,
                    online: stylistInfo.online,
                    radius: stylistInfo.radius,
                    order_type: stylistInfo.order_type,
                    preferences: stylistInfo.preferences,
                    is_signing_completed: stylistInfo.is_signing_completed,
                    is_bank_linked: stylistInfo.is_bank_linked,
                    is_personalized_completed: stylistInfo.is_personalized_completed,
                    is_workpreference_complete: stylistInfo.is_workpreference_complete,
                    learn_to_use_app: stylistInfo.learn_to_use_app ? stylistInfo.learn_to_use_app : false,
                    token: null
                };
                if ((!stylistInfo.customer_referral_code && !stylistInfo.stylist_referral_code) || (stylistInfo.stylist_referral_code == null && stylistInfo.customer_referral_code == null)) {
                    await this.serviceProviderModel.updateOne({ _id: stylistInfo._id }, { $set: { customer_referral_code: stylistInfo.customer_referral_code, stylist_referral_code: stylistInfo.stylist_referral_code } })
                }
                const jwtPayload = responseObj;
                const jwtData = {
                    audience: process.env.JWT_AUDIENCE,
                    secret: process.env.JWT_SECRET
                };
                responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
                await this.serviceProviderModel.updateOne({ _id: responseObj._id }, { access_token: responseObj.token })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", responseObj);
            } else {
                const userOtp = await this.tempOtpModel.findOne({ phone_number: phone_number, otp: token }).sort({ _id: -1 })
                if (!userOtp) {
                    return this.apiResponse.ErrorResponse(res, 'Not a valid token.', {});
                }
                await this.tempOtpModel.deleteMany({ phone_number: phone_number })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistCheckPhoneNumber(checkPhoneNumber: StylistCheckPhoneNumberDto, res: Response) {
        try {
            const { type, email, phone_number, country_code, hash } = checkPhoneNumber;
            if (type == 'email') {
                const stylistInfo = await this.serviceProviderModel.find({ email: email })
                if (stylistInfo) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Email already in use.');
                } else {
                    return this.apiResponse.successResponseWithNoData(res, "verification success.");
                }
            } else {
                const findAllStylist = await this.serviceProviderModel.find({ phone_number: phone_number, country_code: country_code });
                if (findAllStylist.length) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Phone Number already in use.');
                } else {
                    const stylistOtp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                    this.tempOtpModel.create({ phone_number: phone_number, country_code: country_code, otp: stylistOtp })
                    if (excludePhoneNumberList.includes(phone_number)) {
                        return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                    } else {
                        let otpMessage = `Your Instacutes verification code is: ${stylistOtp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : null}`
                        if (!excludePhoneNumberList.includes(phone_number)) {
                            const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                            const messageTwilio = client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
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

    async checkStylistStatus(checkStatus: CheckStylistStatusDto, res: Response) {
        try {
            const { stylist_id } = checkStatus;

            const stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id })
            if (!stylistInfo) {
                return this.apiResponse.ErrorResponse(res, 'Stylist not found!', {});
            }
            const responseObj = {
                registration_status: stylistInfo.registration_status ? stylistInfo.registration_status : 'awaiting',
                _id: stylistInfo._id ? stylistInfo._id : null
            }
            return this.apiResponse.successResponseWithData(res, 'Record found', responseObj);
        }
        catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async customerRegister(files: any, customerRegister: CustomerRegisterDto, res: Response) {
        try {
            const { password, firstname, lastname, email, lat, lng, gender, dob, country_code, phone_number, device_type, device_token } = customerRegister;

            const securePassword = await bcrypt.hash(password, 10);

            const createObj = {
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: securePassword,
                lat: lat,
                lng: lng,
                gender: gender ? gender : null,
                dob: dob ? dob : null,
                country_code: country_code,
                phone_number: phone_number,
                user_type: gender && dob ? this.utilityService.getUserType(this.utilityService.calculateAge(dob), gender) : null,
                devices: [{
                    type: device_type,
                    token: (device_token) ? device_token : null
                }]
            }

            const userInfo = await this.userModel.create(createObj);
            const responseObj = {
                _id: userInfo._id,
                firstname: userInfo.firstname,
                lastname: userInfo.lastname,
                email: userInfo.email,
                gender: userInfo.gender,
                dob: userInfo.dob,
                country_code: userInfo.country_code,
                phone_number: userInfo.phone_number,
                profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
                default_profile: userInfo.default_profile,
                user_type: userInfo.user_type !== null ? userInfo.user_type : 'men',
                address_id: null,
                token: null,
            };

            const jwtPayload = responseObj;
            const jwtData = {
                audience: process.env.JWT_AUDIENCE,
                secret: process.env.JWT_SECRET
            };
            responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
            await this.serviceProviderModel.updateOne({ _id: responseObj._id }, { access_token: responseObj.token })
            return this.apiResponse.successResponseWithData(res, "Registration Success.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerLogin(customerLogin: CustomerLoginDto, res: Response) {
        try {
            const { country_code, phone_number, hash } = customerLogin;

            const userInfo = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (userInfo) {
                const userOtp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: userOtp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                } else {
                    const otpMessage = `Your Instacuts verification code is: ${userOtp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : null}`
                    const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const isSendMessage = await twilioClient.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (isSendMessage) {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                    } else {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                    };
                }
            } else {
                const userOtp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                await this.tempOtpModel.create({ phone_number: phone_number, otp: userOtp })
                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: userOtp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                } else {
                    const otpMessage = `Your Instacuts verification code is: ${userOtp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : null}`
                    const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const isSendMessage = await twilioClient.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (isSendMessage) {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                    } else {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                    }
                }
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerVerifyOTPConfirm(verifyOtp: CustomerVerifyOTPConfirmDto, res: Response) {
        try {
            const { token, phone_number, country_code, player_id, tags, device_type, device_token } = verifyOtp;

            const userInfo = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code, otp: token })
            if (userInfo) {
                const userBody = {
                    otp: null,
                    player_id: player_id ? player_id : null,
                    tags: tags ? tags : [],
                }

                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: userBody })
                if (device_type && device_token) {
                    this.userModel.find({ "devices": { $elemMatch: { token: device_token, type: device_type } } });
                }

                let defaultProfile: FamilyMembers;
                if (userInfo.family_members) {
                    defaultProfile = userInfo.family_members.find((element) => element.default_profile);
                }
                let activeAddress: Addresses;
                if (userInfo.addresses) {
                    activeAddress = userInfo.addresses.find((elem) => elem.active);
                }

                const responseObj = {
                    _id: userInfo._id,
                    firstname: userInfo.firstname,
                    lastname: userInfo.lastname,
                    email: userInfo.email,
                    gender: userInfo.gender,
                    dob: userInfo.dob,
                    country_code: userInfo.country_code,
                    lat: activeAddress.lat,
                    lng: activeAddress.lng,
                    address: activeAddress.address,
                    active: activeAddress.active,
                    preference: userInfo.preference,
                    phone_number: userInfo.phone_number,
                    profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
                    user_type: userInfo.user_type ? userInfo.user_type : 'men',
                    default_profile: userInfo.default_profile,
                    address_id: activeAddress ? activeAddress._id : null,
                    token: null,
                    default_profile_data: null,
                };

                const jwtPayload = responseObj;
                const jwtData = {
                    audience: process.env.JWT_AUDIENCE,
                    secret: process.env.JWT_SECRET,
                };

                responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
                responseObj.default_profile_data = defaultProfile ? defaultProfile : {};
                await this.serviceProviderModel.updateOne({ _id: responseObj._id }, { access_token: responseObj.token })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", responseObj);
            } else {
                const userOtp = await this.tempOtpModel.findOne({ phone_number: phone_number, otp: token })
                if (!userOtp) {
                    return this.apiResponse.ErrorResponseWithoutData(res, "Invalid otp.")
                }
                await this.tempOtpModel.deleteMany({ phone_number: phone_number })
                return this.apiResponse.successResponseWithData(res, "Verified successfully.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async customerLoginWithPassword(customerLogin: CustomerLoginWithPassword, res: Response) {
        try {
            const { phone_number, country_code, device_type, device_token, password } = customerLogin;

            const userInfo = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (userInfo) {
                const passwordCompare = bcrypt.compareSync(password, userInfo.password);
                if (passwordCompare) {
                    if (device_type && device_token) {
                        this.userModel.find({ "devices": { $elemMatch: { token: device_token, type: device_type } } }, function (user_err, user_result) {
                            console.log('user_result', user_result);
                        });
                    }
                    let defaultProfile: FamilyMembers;
                    if (userInfo.family_members) {
                        defaultProfile = userInfo.family_members.find((element) => element.default_profile);
                    }

                    let activeAddress: Addresses;
                    if (userInfo.addresses) {
                        activeAddress = userInfo.addresses.find((elem) => elem.active);
                    }

                    const responseObj = {
                        _id: userInfo._id,
                        firstname: userInfo.firstname,
                        lastname: userInfo.lastname,
                        email: userInfo.email,
                        gender: userInfo.gender,
                        dob: userInfo.dob,
                        country_code: userInfo.country_code,
                        lat: activeAddress.lat,
                        lng: activeAddress.lng,
                        address: activeAddress.address,
                        active: activeAddress.active,
                        preference: userInfo.preference,
                        phone_number: userInfo.phone_number,
                        profile: userInfo.profile ? CUSTOMER_PROFILE + userInfo.profile : null,
                        user_type: userInfo.user_type,
                        default_profile: userInfo.default_profile,
                        address_id: activeAddress ? activeAddress._id : null,
                        default_profile_data: null,
                        token: null,
                    };
                    const jwtPayload = userInfo;
                    const jwtData = {
                        audience: process.env.JWT_AUDIENCE,
                        secret: process.env.JWT_SECRET
                    };
                    responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
                    responseObj.default_profile_data = defaultProfile ? defaultProfile : {};
                    await this.serviceProviderModel.updateOne({ _id: responseObj._id }, { access_token: responseObj.token })
                    return this.apiResponse.successResponseWithData(res, "Verified successfully.", responseObj);
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

    async adminRegister(adminDetail: AdminRegisterDto, res: Response) {
        try {
            const { password, name, email, mobile_no, } = adminDetail;

            const securePassword = await bcrypt.hash(password, 10)
            // const authyRes = await authy.register_user(email, mobile_no, country_code)
            const adminInfo = new this.adminModel({
                name: name,
                email: email,
                password: securePassword,
                confirmOTP: null,
                profile: null,
                mobile_no: mobile_no,
                authy_id: "10123"
            }
            );
            const adminResult = await adminInfo.save();
            const responseObj = {
                _id: adminResult._id,
                name: adminResult.name,
                email: adminResult.email,
                mobile_no: adminResult.mobile_no,
                authy_id: adminResult.authy_id
            };
            return this.apiResponse.successResponseWithData(res, "Registration Success.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminLogin(loginDetail: AdminLoginDto, res: Response) {
        try {
            const { email, password } = loginDetail;

            const adminInfo = await this.adminModel.findOne({ email: email });
            if (adminInfo) {
                const passwordCompare = await bcrypt.compare(password, adminInfo.password)
                if (passwordCompare) {
                    const responseObj = {
                        _id: adminInfo._id,
                        name: adminInfo.name,
                        email: adminInfo.email,
                        authy_id: adminInfo.authy_id,
                        token: null
                    };

                    const jwtPayload = responseObj;
                    const jwtData = {
                        audience: process.env.JWT_AUDIENCE,
                        secret: process.env.JWT_SECRET
                    };
                    responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
                    return this.apiResponse.successResponseWithData(res, "Login Success.", responseObj);
                } else {
                    return this.apiResponse.ErrorResponse(res, "Email or Password wrong.", {});
                }
            } else {
                return this.apiResponse.ErrorResponse(res, "Email or Password wrong.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminVerify(verifyAdmin: AdminVerifyDto, res: Response) {
        try {
            const { authy_id, token } = verifyAdmin;

            // authy.verify(authy_id, token = token, function (err, result) {
            // if (result) {
            const adminInfo = await this.adminModel.findOne({ authy_id: authy_id })
            const responseObj = {
                _id: adminInfo._id,
                name: adminInfo.name,
                email: adminInfo.email,
                token: null,
            };
            const jwtPayload = responseObj;
            const jwtData = {
                expiresIn: process.env.JWT_TIMEOUT_DURATION,
                secret: process.env.JWT_SECRET
            };

            responseObj.token = this.jwtService.sign(jwtPayload, jwtData);
            return this.apiResponse.successResponseWithData(res, "Login Success.", responseObj);
            // }
            // });
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminSendResetPasswordLink(adminForgotPassword: AdminForgotPasswordDto, res: Response) {
        try {
            const { email } = adminForgotPassword;

            const adminInfo = await this.adminModel.findOne({ email: email })
            if (adminInfo) {
                const htmlCode = "Please find your password reset link below.< a href='http://54.173.42.159:4200/reset-password'>Click here</a>";
                const isSuccess = await this.sendMailService.sendMail(
                    process.env.FROM_EMAIL,
                    email,
                    "Please find your password reset link.",
                    htmlCode
                )
                if (isSuccess) {
                    return this.apiResponse.successResponse(res, "Mail sent successfully.");
                } else {
                    return this.apiResponse.ErrorResponse(res, "Mail not sent successfully.", {});
                }
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminResetPassword(resetPasswordAdmin: AdminResetPasswordDto, res: Response) {
        try {
            const { password, email } = resetPasswordAdmin;

            const securePassword = await bcrypt.hash(password, 10);
            const adminInfo = await this.adminModel.findOne({ email: email })
            await this.adminModel.updateOne({ email: email }, {
                $set: {
                    password: securePassword
                }
            });

            const responseObj = {
                _id: adminInfo._id,
                name: adminInfo.name,
                email: adminInfo.email,
                mobile_no: adminInfo.mobile_no,
                authy_id: adminInfo.authy_id
            };
            return this.apiResponse.successResponseWithData(res, "Password reset successfully.", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async enableDisableAdmin(adminDetail: EnableDisableAdminDto, res: Response) {
        try {
            const { admin_id, status } = adminDetail;

            await this.adminModel.updateMany({ _id: { $in: admin_id } }, { $set: { status: status } }, { multi: true });
            return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async enableDisableStylist(stylistDetail: EnableDisableStylistDto, res: Response) {
        try {
            const { stylist_id, status } = stylistDetail;

            await this.serviceProviderModel.updateMany({ _id: { $in: stylist_id } }, { $set: { status: status } }, { multi: true });
            return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async enableDisableCustomer(customerDetail: EnableDisableCustomerDto, res: Response) {
        try {
            const { customer_id, status } = customerDetail;

            await this.userModel.updateMany({ _id: { $in: customer_id } }, { $set: { status: status } }, { multi: true });
            return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async checkUserStatus(checkStatus: CheckUserStatusDto, res: Response) {
        try {
            const { user_type, email, phone_number, country_code } = checkStatus;

            if (user_type === 1) { // Admin
                if (!email) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter email!');
                }
                const adminInfo = await this.adminModel.findOne({ email: email })
                if (adminInfo) {
                    if (adminInfo.status) {
                        return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                    } else {
                        return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                    }
                } else {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found with this email');
                }
            } else if (user_type === 2) { // Stylist
                if (!phone_number) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter phone number!');
                }
                if (!country_code) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter country code!');
                }
                const stylistInfo = await this.serviceProviderModel.findOne({
                    phone_number: phone_number,
                    country_code: country_code,
                    registration_status: 'accepted',
                    deleted: false,
                }, { _id: 1, status: 1 });
                if (stylistInfo) {
                    if (stylistInfo.status) {
                        return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                    } else {
                        return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                    }
                } else {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
                }
            } else if (user_type === 3) { // Customer
                if (!phone_number) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter phone number!');
                }
                if (!country_code) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter country code!');
                }
                const userInfo = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
                if (userInfo) {
                    if (userInfo.status) {
                        return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                    } else {
                        return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                    }
                } else {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
                }
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Bad status type.');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e, {});
        }
    }
}