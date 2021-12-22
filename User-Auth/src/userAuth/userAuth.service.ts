import { JwtService } from '@nestjs/jwt';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';
import { Response } from "express";

import { CountriesWithCodes } from "src/schema/countriesWithCode.schema";
import { ServiceProviders } from "src/schema/serviceProvider.schema";
import { ApiResponse } from "src/utils/apiResponse.service";
import { COSMETOLOGY_LICENSE_IMAGE, CUSTOMER_PROFILE, DRIVING_LICENSE_IMAGE, LIABILITY_IMAGE, RIZWAN_SIGNATURE_IMAGE, STYLIST_PROFILE } from "src/utils/constant";
import { UtilityService } from "src/utils/utlity.service";
import { TempOtps } from "src/schema/tempOtp.schema";
import { ConnectedAccounts } from 'src/schema/connectedAccount.schema';
import { Addresses, Users } from 'src/schema/user.schema';
import { Admins } from 'src/schema/admin.schema';
import { SendMail } from 'src/utils/sendMail.service';
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
    constructor(private readonly utilityService: UtilityService,
        private sendMailService: SendMail,
        private readonly apiResponse: ApiResponse,
        @InjectModel('serviceProvider') private readonly serviceProviderModel: Model<ServiceProviders>,
        @InjectModel('connectedAccounts') private readonly connectedAccountsModel: Model<ConnectedAccounts>,
        @InjectModel('countriesWithCodes') private readonly countriesWithCodesModel: Model<CountriesWithCodes>,
        @InjectModel('user') private readonly userModel: Model<Users>,
        @InjectModel('admin') private readonly adminModel: Model<Admins>,
        @InjectModel('tempOtp') private readonly tempOtpModel: Model<TempOtps>,
        private jwtService: JwtService,
    ) { }

    async stylistRegister(files, stylistDetail: StylistRegisterDto, res: Response) {
        try {

            const { country_code, password, firstname, lastname, middlename, email, gender, dob, player_id, tags, phone_number, category, specialization,
                experience, address, city, state, zip_code, ssn_number, cosmetology_license, driving_license, contractor, liability_waiver,
                privacy_policy, terms_condition, lat, lng, device_type, device_token } = stylistDetail;

            let customerCode = "INV" + this.utilityService.generateOTP()
            let stylistCode = "INV" + this.utilityService.generateOTP()

            let country = await this.countriesWithCodesModel.findOne({ dial_code: country_code }, { code: 1 })

            const hash = await bcrypt.hash(password, 10)

            let serviceProvider = new this.serviceProviderModel(
                {
                    firstname: firstname,
                    lastname: lastname,
                    middlename: (middlename) ? middlename : '',
                    full_name: (middlename) ? firstname + " " + middlename + " " + lastname : firstname + " " + lastname,
                    email: email,
                    password: hash,
                    otp: this.utilityService.generateOTP(),
                    gender: gender ? gender : '',
                    customer_referral_code: customerCode,
                    stylist_referral_code: stylistCode,
                    dob: (dob) ? dob : '',
                    player_id: player_id ? player_id : '',
                    tags: tags ? tags : [],
                    country_code: country_code,
                    country: country ? country : country.code,
                    phone_number: phone_number,
                    category: category,
                    registration_status: "awaiting",
                    specialization: specialization,
                    experience: experience,
                    address: (address) ? address : '',
                    city: (city) ? city : '',
                    state: (state) ? state : '',
                    zip_code: (zip_code) ? zip_code : '',
                    ssn_number: (ssn_number) ? ssn_number : '',
                    cosmetology_license: (cosmetology_license) ? cosmetology_license : '',
                    driving_license: (driving_license) ? driving_license : '',
                    contractor: (contractor) ? contractor : 0,
                    liability_waiver: (liability_waiver) ? liability_waiver : 0,
                    privacy_policy: (privacy_policy) ? privacy_policy : 0,
                    terms_condition: (terms_condition) ? terms_condition : 0,
                    connect_id: '',
                    is_stylist_onboarding_complete: false,
                    lat: lat,
                    lng: lng,
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    devices: [{
                        type: device_type,
                        token: (device_token) ? device_token : ''
                    }]

                }
            );

            const success = await serviceProvider.save();
            if (success) {
                if (files) {
                    files.forEach(async element => {
                        let bucket = '';
                        let fieldToUpdate = '';
                        if (element.fieldname == 'cosmetology_license_image') {
                            success.cosmetology_license_image = COSMETOLOGY_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/cosmetology_licence';
                            await this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        cosmetology_license_image: element.filename
                                    }
                                })
                        } else if (element.fieldname == 'driving_license_image') {
                            success.driving_license_image = DRIVING_LICENSE_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/driving_licence';
                            await this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        driving_license_image: element.filename
                                    }
                                })
                        } else if (element.fieldname == 'profile') {

                            success.profile = STYLIST_PROFILE + element.filename;
                            bucket = 'instacuts/service_provider/profile';
                            await this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        profile: element.filename
                                    }
                                })

                        } else if (element.fieldname == 'liability_waiver_image') {
                            success.liability_waiver_image = LIABILITY_IMAGE + element.filename
                            bucket = 'instacuts/service_provider/liability_waiver';
                            //success.element.fieldname = element.filename;
                            await this.serviceProviderModel.updateOne({ _id: success._id },
                                {
                                    $set: {
                                        liability_waiver_image: element.filename
                                    }
                                })
                        }

                        const uploaded: any = this.utilityService.uploadFile(element.destination, element.filename, element.mimetype, bucket)
                        let filename = uploaded.data.split('/');
                    });
                }
            }
            const jwtPayload = JSON.parse(JSON.stringify(success));
            const jwtData = {
                audience: process.env.JWT_AUDIENCE,
                secret: process.env.JWT_SECRET
            };
            jwtPayload.authToken = this.jwtService.sign(jwtPayload, jwtData);
            await this.serviceProviderModel.updateOne({ _id: success._id }, { access_token: jwtPayload.authToken })
            jwtPayload.signatureUrl = RIZWAN_SIGNATURE_IMAGE;
            return res.status(200).json({ status: 200, messgae: "Registration Success.", data: jwtPayload });
        } catch (err) {
            console.log(err)
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }

    async stylistLogin(stylistLogin: StylistLoginDto, res: Response) {
        try {

            const { phone_number, country_code, hash } = stylistLogin;

            const user = await this.serviceProviderModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (user) {
                let otp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                this.tempOtpModel.create({ phone_number: phone_number, otp: otp });
                await this.serviceProviderModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: otp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                } else {
                    let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : ''}`
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const message = client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (message) {
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
        const { phone_number, country_code, device_token, device_type, player_id, tags } = verifyOtp;
        try {
            let token = {
                type: device_type,
                token: (device_token) ? device_token : ''
            }
            const user = await this.serviceProviderModel.findOne({ phone_number: phone_number, country_code: country_code })
            let updateParams;
            if (user && user.disable === 2 && user.is_first_login) {
                updateParams = { otp: null, is_first_login: 0, devices: [token] }
            } else {
                updateParams = {
                    otp: null, devices: [token], player_id: player_id ? player_id : '',
                    tags: tags ? tags : [],
                }
            }
            let nullToken = {
                type: device_type,
                token: ''
            }
            await this.serviceProviderModel.updateMany({ "devices.token": device_token }, { $set: nullToken })
            await this.serviceProviderModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: updateParams })
            if (user) {
                let otp = await this.tempOtpModel.findOne({ phone_number: phone_number, otp: token });
                if (!otp) {
                    return this.apiResponse.ErrorResponse(res, 'Not a valid token.', {});
                }
                this.tempOtpModel.deleteMany({ phone_number: phone_number })

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
                const findStylistEmail = await this.serviceProviderModel.find({ email: email })
                if (findStylistEmail) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Email already in use.');
                } else {
                    return this.apiResponse.successResponseWithNoData(res, "verification success.");
                }
            }
            else {
                const findServicceProviderInfo = await this.serviceProviderModel.find({ phone_number: phone_number, country_code: country_code });
                if (findServicceProviderInfo.length) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Phone Number already in use.');
                } else {
                    let otp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                    this.tempOtpModel.create({ phone_number: phone_number, country_code: country_code, otp: otp })
                    if (excludePhoneNumberList.includes(phone_number)) {
                        return this.apiResponse.successResponseWithNoData(res, "OTP Sent.");
                    } else {
                        let otpMessage = `Your Instacutes verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : ''}`
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
        const { stylist_id } = checkStatus;
        try {
            let provider = await this.serviceProviderModel.findOne({ _id: stylist_id })
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

    async customerRegister(files, customerLogin: CustomerRegisterDto, res: Response) {
        try {
            const { password, firstname, lastname, email, lat, lng, gender, dob, country_code, phone_number, device_type, device_token } = customerLogin;
            const hash = await bcrypt.hash(password, 10)
            const createObj = {
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: hash,
                lat: lat,
                lng: lng,
                gender: gender ? gender : '',
                dob: dob ? dob : '',
                country_code: country_code,
                phone_number: phone_number,
                user_type: gender && dob ? this.utilityService.getUserType(this.utilityService.calculateAge(dob), gender) : '',
                devices: [{
                    type: device_type,
                    token: (device_token) ? device_token : ''
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

    async customerLogin(customerLogin: CustomerLoginDto, res: Response) {
        try {

            const { country_code, phone_number, hash } = customerLogin;

            const user = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (user) {
                let otp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: otp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                } else {
                    let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : ''}`
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const messageTwillo = await client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (messageTwillo) {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                    } else {
                        return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 1);
                    };
                }
            } else {
                let otp = excludePhoneNumberList.includes(phone_number) ? "123456" : this.utilityService.generateOTP()
                await this.tempOtpModel.create({ phone_number: phone_number, otp: otp })
                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: { otp: otp } })
                if (excludePhoneNumberList.includes(phone_number)) {
                    return this.apiResponse.successResponseWithCustomKeyName(res, "OTP Sent.", 0);
                } else {
                    let otpMessage = `Your Instacuts verification code is: ${otp}. Don't share this code with anyone.our employees will never ask for the code.${hash ? hash : ''}`
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const messageTwillo = await client.messages.create({ body: otpMessage, from: process.env.TWILIO_SENDER_ID, to: `${country_code}${phone_number}` })
                    if (messageTwillo) {
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
        const { phone_number, country_code, token, player_id, tags, device_type, device_token } = verifyOtp;
        try {
            const user = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code, otp: token })
            if (user) {
                let body = {
                    otp: null,
                    player_id: player_id ? player_id : '',
                    tags: tags ? tags : [],
                }
                await this.userModel.updateOne({ phone_number: phone_number, country_code: country_code }, { $set: body })
                if (device_type && device_token) {
                    this.userModel.find({ "devices": { $elemMatch: { token: device_token, type: device_type } } }, function (user_err, user_result) {
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

    async customerLoginWithPassword(customerLoginDetail: CustomerLoginWithPassword, res: Response) {
        const { phone_number, country_code, device_type, device_token, password } = customerLoginDetail;
        try {
            const user = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
            if (user) {
                let passwordCompare = bcrypt.compareSync(password, user.password);
                if (passwordCompare) {
                    if (device_type && device_token) {
                        this.userModel.find({ "devices": { $elemMatch: { token: device_token, type: device_type } } }, function (user_err, user_result) {
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

    async adminRegister(adminDetail: AdminRegisterDto, res: Response) {
        const { password, name, email, mobile_no, } = adminDetail;
        try {
            const hash = await bcrypt.hash(password, 10)
            // const authyRes = await authy.register_user(email, mobile_no, country_code)
            let admin = new this.adminModel(
                {
                    name: name,
                    email: email,
                    password: hash,
                    confirmOTP: '',
                    profile: '',
                    mobile_no: mobile_no,
                    authy_id: "10123"
                }
            );
            const user = await admin.save()
            let userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile_no: user.mobile_no,
                authy_id: user.authy_id
            };
            return this.apiResponse.successResponseWithData(res, "Registration Success.", userData);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminLogin(loginDetail: AdminLoginDto, res: Response) {
        const { email, password } = loginDetail;
        try {
            const user = await this.adminModel.findOne({ email: email });
            if (user) {
                const same = await bcrypt.compare(password, user.password)
                if (same) {
                    let userData = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        authy_id: user.authy_id,
                        token: null
                    };
                    const jwtPayload = userData;
                    const jwtData = {
                        audience: process.env.JWT_AUDIENCE,
                        secret: process.env.JWT_SECRET
                    };
                    userData.token = this.jwtService.sign(jwtPayload, jwtData);
                    return this.apiResponse.successResponseWithData(res, "Login Success.", userData);
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
            const user = await this.adminModel.findOne({ authy_id: authy_id })
            let userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: null,
            };
            const jwtPayload = userData;
            const jwtData = {
                expiresIn: process.env.JWT_TIMEOUT_DURATION,
                secret: process.env.JWT_SECRET
            };
            userData.token = this.jwtService.sign(jwtPayload, jwtData);
            return this.apiResponse.successResponseWithData(res, "Login Success.", userData);
            // }
            // });
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminSendResetPasswordLink(adminForgotPassword: AdminForgotPasswordDto, res: Response) {
        const { email } = adminForgotPassword;
        try {
            let query = { email: email };
            const user = await this.adminModel.findOne(query)
            if (user) {
                let html = "Please find your password reset link below.< a href='http://54.173.42.159:4200/reset-password'>Click here</a>";
                const success = await this.sendMailService.sendMail(
                    process.env.FROM_EMAIL,
                    email,
                    "Please find your password reset link.",
                    html
                )
                console.log(`success`, success)
                if (success) {
                    return this.apiResponse.successResponse(res, "Mail sent successfully.");
                } else {
                    return this.apiResponse.ErrorResponse(res, "Mail not sent successfully.", {});
                }
            }
        } catch (err) {
            console.log(`err`, err)
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async adminResetPassword(resetPasswordAdmin: AdminResetPasswordDto, res: Response) {
        try {
            const { password, email } = resetPasswordAdmin;
            const hash = await bcrypt.hash(password, 10)
            const admin = await this.adminModel.findOne({ email: email })
            await this.adminModel.updateOne({ email: email }, {
                $set: {
                    password: hash
                }
            })
            let userData = {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile_no: admin.mobile_no,
                authy_id: admin.authy_id
            };
            return this.apiResponse.successResponseWithData(res, "Password reset successfully.", userData);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err, {});
        }
    }

    async enableDisableAdmin(adminDetail: EnableDisableAdminDto, res: Response) {
        try {
            const { admin_id, status } = adminDetail;
            const updateAdmin = await this.adminModel.updateMany({ _id: { $in: admin_id } }, { $set: { status: status } }, { multi: true })
            if (updateAdmin) {
                return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async enableDisableStylist(stylistDetail: EnableDisableStylistDto, res: Response) {
        try {
            const { stylist_id, status } = stylistDetail;
            const updateStylist = await this.serviceProviderModel.updateMany({ _id: { $in: stylist_id } }, { $set: { status: status } }, { multi: true })
            if (updateStylist) {
                return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async enableDisableCustomer(customerDetail: EnableDisableCustomerDto, res: Response) {
        try {
            const { customer_id, status } = customerDetail;
            const updateCustomer = await this.userModel.updateMany({ _id: { $in: customer_id } }, { $set: { status: status } }, { multi: true })
            if (updateCustomer) {
                return this.apiResponse.successResponseWithNoData(res, 'Record updated!');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async checkUserStatus(checkStatus: CheckUserStatusDto, res: Response) {
        try {
            let { user_type, email, phone_number, country_code } = checkStatus;
            if (!user_type) {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter user type!');
            }
            const userType = parseInt(user_type);
            if (userType === 1) { // Admin
                if (!email) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter email!');
                }
                const admin = await this.adminModel.findOne({ email: email })
                if (!admin) {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found with this email');
                }
                if (admin.status) {
                    return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                } else {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                }
            }

            else if (userType === 2) { // Stylist
                if (!phone_number) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter phone number!');
                }
                if (!country_code) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter country code!');
                }
                const stylist = await this.serviceProviderModel.findOne({
                    phone_number: phone_number,
                    country_code: country_code,
                    registration_status: 'accepted',
                    deleted: false,
                }, { _id: 1, status: 1 })
                if (!stylist) {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
                }
                if (stylist.status) {
                    return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                } else {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                }
            }

            else if (userType === 3) { // Customer
                if (!phone_number) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter phone number!');
                }
                if (!country_code) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'Please enter country code!');
                }
                const customer = await this.userModel.findOne({ phone_number: phone_number, country_code: country_code })
                if (!customer) {
                    return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
                }
                if (customer.status) {
                    return this.apiResponse.successResponseWithNoData(res, 'User is in active state');
                } else {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'User is inactive');
                }
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Bad status type.');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e, {});
        }
    }
}