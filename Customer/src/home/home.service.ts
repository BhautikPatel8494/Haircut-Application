import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model, Types } from "mongoose";
import * as moment from 'moment'

import { Categories } from "../schema/categoryModel.schema";
import { constants, WEEKDAY_LIST } from '../utils/constant'
import { ApiResponse } from "../utils/apiResponse.service"
import { Service_Provider } from "../schema/serviceProvider.schema";
import { Config } from "../schema/globalSettings.schema";
import { CurrentUserDto } from "./dto/currentUser";
import { User } from "../schema/userModel.schema";
import { Locations } from "../schema/locationModel.schema";
import { Service } from "../schema/serviceModel.schema";
import { Customer_Cart } from "../schema/cartModel.schema";
import { Favourite } from "../schema/favouriteModel.schema";
import { Custom_service } from "../schema/customService.schema";
import { Order } from "../schema/orderModel.schema";
import { Customer_Transaction } from "../schema/customerTransaction.schema";
import { Schedule } from "../schema/scheduleModel.schema";
import { Utility } from "../utils/utility.service";

@Injectable()
export class HomeService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel('Service_Provider') private readonly serviceProviderModel: Model<Service_Provider>,
        @InjectModel('Customer_Cart') private readonly customerCartModel: Model<Customer_Cart>,
        @InjectModel('Order') private readonly orderModel: Model<Order>,
        @InjectModel('Customer_Transaction') private readonly customerTransactionModel: Model<Customer_Transaction>,
        @InjectModel('Categories') private readonly categoryModel: Model<Categories>,
        @InjectModel('Service') private readonly serviceModel: Model<Service>,
        @InjectModel('Custom_Service') private readonly customServiceModel: Model<Custom_service>,
        @InjectModel('Favourite') private readonly favouriteModel: Model<Favourite>,
        @InjectModel('Locations') private readonly locationModel: Model<Locations>,
        @InjectModel('Schedule') private readonly scheduleModel: Model<Schedule>,
        @InjectModel('Config') private readonly configModel: Model<Config>,
        private readonly apiResponse: ApiResponse,
        private readonly utility: Utility
    ) { }

    async listCategories(req: Request, res: Response) {
        try {
            const { page, limit } = req.body;

            const pages = page ? parseInt(page) : 1
            const limits = limit ? parseInt(limit) : 10
            const skip = (limits * pages) - limits;
            const categoryInfo = await this.categoryModel.aggregate([
                {
                    $match: { status: true }
                },
                {
                    $lookup: {
                        from: "sub_categories",
                        localField: "_id",
                        foreignField: "category_id",
                        as: "sub_categories"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        featured_image: 1,
                        name: 1,
                        "sub_categories": 1
                    }
                },
                { $skip: skip },
                { $limit: limits },
                { $sort: { created_at: -1 } },
            ]);

            if (categoryInfo.length > 0) {
                for (let i = 0; i < categoryInfo.length; i++) {
                    const categoryResult = categoryInfo[i];
                    categoryResult.featured_image = categoryResult.featured_image ? constants.CATEGORY_FEATURED_IMAGE + categoryResult.featured_image : '';
                    for (const val of categoryResult.sub_categories) {
                        val.featured_image = val.featured_image ? constants.CATEGORY_FEATURED_IMAGE + val.featured_image : ''
                        val.section_image = val.section_image ? constants.CATEGORY_SECTION_IMAGE + val.section_image : ''
                    }
                }
            } else {
                return this.apiResponse.ErrorResponse(res, 'Categories not found', {});
            }
            const countActiveStylist = await this.serviceProviderModel.countDocuments({ online: 1, registration_status: 'accepted', deleted: false })
            return this.apiResponse.successResponseWithExtraData(res, "Categories found successfully.", { active_stylist: countActiveStylist }, categoryInfo);
        } catch (error) {
            console.log(error);
            return this.apiResponse.ErrorResponse(res, error.message, []);
        }
    }


    async serviceListing(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { category_id, limit, page, subcategory_id, stylist_level, profile_id, age_group } = req.body

            const pages = page ? parseInt(page) : 1;
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limit * pages) - limit;

            const subcategoryId = subcategory_id ? subcategory_id : 'all';
            const stylistLevel = stylist_level ? stylist_level : 'junior';
            const config = await this.configModel.findOne({}, { customer_stylist_radius: 1 });
            const radius = config && config.customer_stylist_radius ? config.customer_stylist_radius : 20;
            const categoryInfo = await this.categoryModel.findOne({ status: true, _id: category_id }, { sub_categories: 1 });

            const active_address = await this.userModel.aggregate([
                { $match: { _id: user._id } },
                {
                    $project: {
                        active_address: {
                            $filter: {
                                input: "$addresses",
                                as: "address",
                                cond: { $eq: ["$$address.active", true] }
                            }
                        },
                        default_profile: 1
                    }
                }
            ]);

            const activeAddressInfo = active_address[0].active_address[0];
            const active_lat = activeAddressInfo && activeAddressInfo.lat ? activeAddressInfo.lat : '';
            const active_lng = activeAddressInfo && activeAddressInfo.lng ? activeAddressInfo.lng : '';
            const active_city = activeAddressInfo && activeAddressInfo.city ? activeAddressInfo.city : '';
            const active_loc_address = activeAddressInfo && activeAddressInfo.address ? activeAddressInfo.address : '';
            const active_zip_code = activeAddressInfo && activeAddressInfo.zip_code ? activeAddressInfo.zip_code : '';

            if (categoryInfo && active_lng && active_lat) {
                const locations = await this.locationModel.aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [parseFloat(active_lng), parseFloat(active_lat)]
                            },
                            key: "location",
                            distanceField: "distance",
                            maxDistance: radius * constants.METERS_PER_MILE,
                            spherical: true
                        }
                    },
                    {
                        $match: {
                            deleted: 0,
                            status: 0,
                        }
                    },
                    {
                        $lookup: {
                            from: 'secondary_locations',
                            let: { act_city: active_city },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$deleted", 0] },
                                            { $eq: ["$status", 0] },
                                        ],
                                    },
                                    city: { $regex: active_city, $options: "i" },
                                    input_address: { $regex: active_loc_address, $options: "i" },
                                    zip_code: active_zip_code,
                                }
                            },
                            {
                                $group: {
                                    _id: { parent_location_id: "$parent_location_id" },
                                    parent_location_id: { $first: "$parent_location_id" },
                                    zip_code: { $first: "$zip_code" },
                                    country: { $first: "country" },
                                    city: { $first: "$city" }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    parent_location_id: 1,
                                    zip_code: 1,
                                    country: 1,
                                    city: 1
                                }
                            },
                            ],
                            as: "sec_loc"
                        }
                    }
                ])

                let location_ids = locations.map(obj => (obj._id));
                for (let i = 0; i < locations.length; i++) {
                    if (locations[i].sec_loc.length > 0) {
                        for (let j = 0; j < locations[i].sec_loc.length; j++) {
                            location_ids.push(locations[i].sec_loc[j].parent_location_id)
                        }
                    }
                }

                let Query = null;

                if (subcategoryId == 'all') {
                    Query = {
                        status: true,
                        deleted: false,
                        disable: false,
                        stylist_type: { $in: [stylistLevel] },
                        parent_location: { $elemMatch: { location_id: { $in: location_ids } } }
                    };
                } else {
                    Query = {
                        status: true,
                        deleted: false,
                        disable: false,
                        subcategory_id: subcategoryId,
                        stylist_type: { $in: [stylistLevel] },
                        parent_location: { $elemMatch: { location_id: { $in: location_ids } } }
                    };
                }

                if (age_group) {
                    Query.age_group = { $in: [age_group] }
                }
                if (category_id) {
                    Query.category_id = category_id
                }

                if (active_address[0] && active_address[0].default_profile && !age_group) {
                    console.log("default profile active")
                    delete Query.age_group
                }

                const services = await this.serviceModel.aggregate([
                    { $match: Query },
                    {
                        $lookup:
                        {
                            from: 'ratings',
                            localField: '_id',
                            foreignField: "service_id",
                            as: "ratings"
                        }
                    },
                    {
                        $lookup:
                        {
                            from: 'favourites',
                            let: { user_id: user._id, service_id: "$_id" },
                            pipeline: [
                                {
                                    $match:
                                    {
                                        $expr:
                                        {
                                            $and:
                                                [
                                                    { $eq: ["$$user_id", "$user_id"] },
                                                    { $eq: ["$$service_id", "$service_id"] },
                                                ]
                                        }
                                    }
                                },
                            ],
                            as: "is_fav"
                        }
                    },
                    {
                        $addFields: {
                            cart_quantity: 0,
                            service_id: { $toString: "$service_id" },
                        }
                    },
                    { $skip: skip },
                    { $limit: limits },
                    {
                        $project: {
                            _id: 1,
                            duration: 1,
                            available_for: { $cond: ["$age_group", "$age_group", ""] },
                            stylist_type: 1,
                            "service_description": { $cond: ["$description", "$description", ""] },
                            regular_price: 1,
                            cart_quantity: 1,
                            sale_price: 1,
                            quantity: 1,
                            featured_image: 1,
                            section_image: 1,
                            images: 1,
                            videos: 1,
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            "is_fav": { $size: "$is_fav" },
                            title: 1,
                            created_at: 1,
                            status: 1,
                            updated_at: 1
                        }
                    }
                ]);

                if (services.length > 0) {
                    let all = 0;
                    for (let s = 0; s < services.length; s++) {
                        all++;
                        services[s].featured_image = (services[s].featured_image) ? constants.SERVICE_FEATURED_IMAGE + services[s].featured_image : '';
                        services[s].section_image = (services[s].section_image) ? constants.SERVICE_SECTION_IMAGE + services[s].section_image : '';
                        for (let i = 0; i < services[s].images.length; i++) {
                            services[s].images[i].image = (services[s].images[i].image) ? constants.SERVICE_IMAGE + services[s].images[i].image : '';
                        }
                        for (let i = 0; i < services[s].videos.length; i++) {
                            services[s].videos[i].video = (services[s].videos[i].video) ? constants.SERVICE_VIDEO + services[s].videos[i].video : '';
                        }
                    }

                    const cartItems = await this.customerCartModel.aggregate([
                        { $match: { user_id: user._id } },
                        {
                            $project: {
                                "cart_profiles": { $filter: { input: "$cart_profiles", as: "cart", cond: { $eq: ["$$cart.profile_id", profile_id] } } }
                            }
                        }
                    ])

                    const cartDetails = cartItems[0].cart_profiles[0]
                    if (cartItems && cartDetails.cart_items.length > 0) {
                        for (let i = 0; i < cartDetails.cart_items.length; i++) {
                            const index = services.map((element) => { return element._id.toString() }).indexOf(cartDetails.cart_items[i].service_id.toString())
                            if (index > -1) {
                                services[index].cart_quantity = cartDetails.cart_items[i].quantity
                            }
                        }
                    }
                    if (all == services.length) {
                        return this.apiResponse.successResponseWithExtraData(res, "Services found successfully.", {
                            subcategory_id: subcategory_id,
                            sub_categories: categoryInfo.sub_categories
                        }, services);
                    }
                } else {
                    return this.apiResponse.successResponseWithExtraData(res, "No records found.", {
                        subcategory_id: subcategory_id,
                        sub_categories: categoryInfo.sub_categories
                    }, []);
                }
            } else {
                const subcategoryId = subcategory_id ? subcategory_id : 'all';
                const stylistLevel = stylist_level ? stylist_level : 'junior';
                let Query = null;

                if (subcategoryId == 'all') {
                    Query = {
                        status: true,
                        deleted: false,
                        disable: false,
                        stylist_type: { $in: [stylistLevel] },
                    };
                } else {
                    Query = {
                        status: true,
                        deleted: false,
                        disable: false,
                        subcategory_id: subcategoryId,
                        stylist_type: { $in: [stylistLevel] },
                    };
                }
                if (age_group) {
                    Query.age_group = { $in: [age_group] }
                }

                if (activeAddressInfo.default_profile && !age_group) {
                    delete Query.age_group
                }

                const services = await this.serviceModel.aggregate([
                    { $match: Query },
                    {
                        $lookup:
                        {
                            from: 'ratings',
                            localField: '_id',
                            foreignField: "service_id",
                            as: "ratings"
                        }
                    },
                    {
                        $lookup:
                        {
                            from: 'favourites',
                            let: { user_id: user._id, service_id: "$_id" },
                            pipeline: [
                                {
                                    $match:
                                    {
                                        $expr:
                                        {
                                            $and:
                                                [
                                                    { $eq: ["$$user_id", "$user_id"] },
                                                    { $eq: ["$$service_id", "$service_id"] },
                                                ]
                                        }
                                    }
                                },
                            ],
                            as: "is_fav"
                        }
                    },
                    {
                        $addFields: {
                            cart_quantity: 0
                        }
                    },
                    { $skip: skip },
                    { $limit: limits },
                    {
                        $project: {
                            _id: 1,
                            duration: 1,
                            available_for: { $cond: ["$age_group", "$age_group", ""] },
                            stylist_type: 1,
                            "service_description": { $cond: ["$description", "$description", ""] },
                            regular_price: 1,
                            cart_quantity: 1,
                            sale_price: 1,
                            quantity: 1,
                            featured_image: 1,
                            section_image: 1,
                            images: 1,
                            videos: 1,
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            "is_fav": { $size: "$is_fav" },
                            title: 1,
                            created_at: 1,
                            status: 1,
                            updated_at: 1
                        }
                    }
                ])

                if (services.length > 0) {
                    let all = 0;
                    for (let s = 0; s < services.length; s++) {
                        all++;
                        services[s].featured_image = (services[s].featured_image) ? constants.SERVICE_FEATURED_IMAGE + services[s].featured_image : '';
                        services[s].section_image = (services[s].section_image) ? constants.SERVICE_SECTION_IMAGE + services[s].section_image : '';
                        for (var i = 0; i < services[s].images.length; i++) {
                            services[s].images[i].image = (services[s].images[i].image) ? constants.SERVICE_IMAGE + services[s].images[i].image : '';
                        }
                        for (var i = 0; i < services[s].videos.length; i++) {
                            services[s].videos[i].video = (services[s].videos[i].video) ? constants.SERVICE_VIDEO + services[s].videos[i].video : '';
                        }
                    }

                    const cartItems = await this.customerCartModel.aggregate([
                        { $match: { user_id: user._id } },
                        {
                            $project: {
                                "cart_profiles": { $filter: { input: "$cart_profiles", as: "cart", cond: { $eq: ["$$cart.profile_id", profile_id] } } }
                            }
                        }
                    ])

                    const cartDetails = cartItems[0].cart_profiles[0]
                    if (cartDetails && cartDetails.cart_items.length > 0) {
                        for (let i = 0; i < cartDetails.cart_items.length; i++) {
                            const index = services.map((element) => { return element._id.toString() }).indexOf(cartDetails.cart_items[i].service_id.toString())
                            if (index > -1) {
                                services[index].cart_quantity = cartDetails.cart_items[i].quantity
                            }
                        }
                    }

                    if (pages < 1) {
                        return this.apiResponse.successResponseWithData(res, "Services found successfully.", []);
                    } else {
                        if (all == services.length) {
                            return this.apiResponse.successResponseWithExtraData(res, "Services found successfully.", {
                                subcategory_id: '',
                                sub_categories: ''
                            }, services);
                        }
                    }
                } else {
                    return this.apiResponse.successResponseWithExtraData(res, "No records found.", {
                        subcategory_id: '',
                        sub_categories: ''
                    }, []);
                }
            }
        } catch (error) {
            return this.apiResponse.ErrorResponse(res, error.message, [])
        }
    }


    async exploreService(req: Request, res: Response) {
        try {
            const { page, limit, category_id, lat, lng, subcategory_id, stylist_level } = req.body;

            const pages = page ? parseInt(page) : 1;
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limits * pages) - limits;

            const config = await this.configModel.findOne({}, { customer_stylist_radius: 1 })
            const radius = config && config.customer_stylist_radius ? config.customer_stylist_radius : 20

            const categoryInfo = await this.categoryModel.findOne({ status: true, _id: category_id }, {
                _id: 1,
                sub_categories: 1
            })
            let locationIds = [];
            if (lat && lng) {
                const locations = await this.locationModel.aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [parseFloat(lng), parseFloat(lat)]
                            },
                            key: "location",
                            distanceField: "distance",
                            maxDistance: radius * constants.METERS_PER_MILE,
                            spherical: true
                        }
                    },
                    {
                        $match:
                        {
                            deleted: false,
                            status: true
                        }
                    }
                ])

                locationIds = locations.map(obj => {
                    return obj._id;
                })
            }
            let subcategoryId = subcategory_id ? subcategory_id : 'all';
            let stylistLevel = stylist_level ? stylist_level : 'junior';
            console.log(locationIds);
            let Query = null;
            if (subcategoryId == 'all') {
                Query = {
                    status: true,
                    deleted: false,
                    disable: false,
                    stylist_type: { $in: [stylistLevel] },
                    parent_location: { $elemMatch: { location_id: { $in: locationIds } } }
                };
            } else {
                Query = {
                    status: true,
                    deleted: false,
                    disable: false,
                    subcategory_id: subcategoryId,
                    stylist_type: { $in: [stylistLevel] },
                    parent_location: { $elemMatch: { location_id: { $in: locationIds } } }
                };
            }

            if (category_id) {
                Query.category_id = category_id
            }

            if (categoryInfo) {
                const services = await this.serviceModel.aggregate([
                    { $match: Query },
                    {
                        $lookup:
                        {
                            from: 'ratings',
                            localField: '_id',
                            foreignField: "service_id",
                            as: "ratings"
                        }
                    },
                    {
                        $addFields: {
                            cart_quantity: 0,
                            service_id: { $toString: "$service_id" },
                            is_fav: 0,
                        }
                    },
                    { $skip: skip },
                    { $limit: limits },
                    {
                        $project: {
                            _id: 1,
                            duration: 1,
                            available_for: { $cond: ["$age_group", "$age_group", ""] },
                            stylist_type: 1,
                            "service_description": { $cond: ["$description", "$description", ""] },
                            regular_price: 1,
                            cart_quantity: 1,
                            sale_price: 1,
                            quantity: 1,
                            featured_image: 1,
                            section_image: 1,
                            images: 1,
                            videos: 1,
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            "is_fav": 1,
                            title: 1,
                            created_at: 1,
                            status: 1,
                            updated_at: 1
                        }
                    }
                ])

                if (services.length > 0) {
                    let all = 0;
                    for (let s = 0; s < services.length; s++) {
                        all++;
                        const serviceData = services[s]
                        serviceData.featured_image = (serviceData.featured_image) ? constants.SERVICE_FEATURED_IMAGE + serviceData.featured_image : '';
                        serviceData.section_image = (serviceData.section_image) ? constants.SERVICE_SECTION_IMAGE + serviceData.section_image : '';
                        for (let i = 0; i < serviceData.images.length; i++) {
                            serviceData.images[i].image = (serviceData.images[i].image) ? constants.SERVICE_IMAGE + serviceData.images[i].image : '';
                        }
                        for (let i = 0; i < serviceData.videos.length; i++) {
                            serviceData.videos[i].video = (serviceData.videos[i].video) ? constants.SERVICE_VIDEO + serviceData.videos[i].video : '';
                        }
                    }

                    if (all == services.length) {
                        return this.apiResponse.successResponseWithExtraData(res, "Services found successfully.", {
                            subcategory_id: subcategory_id,
                            sub_categories: categoryInfo.sub_categories
                        }, services);
                    }
                } else {
                    return this.apiResponse.successResponseWithExtraData(res, "No records found.", {
                        subcategory_id: subcategory_id,
                        sub_categories: categoryInfo.sub_categories
                    }, []);
                }
            } else {
                const services = await this.serviceModel.aggregate([
                    { $match: Query },
                    {
                        $lookup:
                        {
                            from: 'ratings',
                            localField: '_id',
                            foreignField: "service_id",
                            as: "ratings"
                        }
                    },
                    {
                        $addFields: {
                            cart_quantity: 0,
                            is_fav: 0,
                        }
                    },
                    { $skip: skip },
                    { $limit: limits },
                    {
                        $project: {
                            _id: 1,
                            duration: 1,
                            available_for: { $cond: ["$age_group", "$age_group", ""] },
                            stylist_type: 1,
                            "service_description": { $cond: ["$description", "$description", ""] },
                            regular_price: 1,
                            cart_quantity: 1,
                            sale_price: 1,
                            quantity: 1,
                            featured_image: 1,
                            section_image: 1,
                            images: 1,
                            videos: 1,
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            "is_fav": 1,
                            title: 1,
                            created_at: 1,
                            status: 1,
                            updated_at: 1
                        }
                    }
                ]);

                if (services.length > 0) {
                    let all = 0;
                    for (let s = 0; s < services.length; s++) {
                        const serviceData = services[s]
                        all++;
                        serviceData.featured_image = (serviceData.featured_image) ? constants.SERVICE_FEATURED_IMAGE + serviceData.featured_image : '';
                        serviceData.section_image = (serviceData.section_image) ? constants.SERVICE_SECTION_IMAGE + serviceData.section_image : '';
                        for (var i = 0; i < serviceData.images.length; i++) {
                            serviceData.images[i].image = (serviceData.images[i].image) ? constants.SERVICE_IMAGE + serviceData.images[i].image : '';
                        }
                        for (var i = 0; i < serviceData.videos.length; i++) {
                            serviceData.videos[i].video = (serviceData.videos[i].video) ? constants.SERVICE_VIDEO + serviceData.videos[i].video : '';
                        }
                    }

                    if (pages < 1) {
                        return this.apiResponse.successResponseWithData(res, "Services found successfully.", []);
                    } else {
                        if (all == services.length) {
                            return this.apiResponse.successResponseWithExtraData(res, "Services found successfully.", {
                                subcategory_id: '',
                                sub_categories: ''
                            }, services);
                        }
                    }
                } else {
                    return this.apiResponse.successResponseWithExtraData(res, "No records found.", {
                        subcategory_id: '',
                        sub_categories: ''
                    }, []);
                }
            }
        } catch (err) {
            console.log(err);
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async setPreference(req: Request, res: Response) {
        try {
            const { user_id, preference } = req.body;

            const userInfo = await this.userModel.findOne({ _id: user_id }, { _id: 1 })
            if (!userInfo) {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Record not found!')
            }
            await this.userModel.updateOne({ _id: user_id }, { preference: preference });
            const userData = await this.userModel.findOne({ _id: user_id }, { preference: 1, _id: 0 });
            return this.apiResponse.successResponseWithData(res, 'Record updated!', userData)
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async searchStylist(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit, search, gender_filter, rating_filter, name_filter, sort, stylist_level } = req.body;

            const pages = page ? parseInt(page) : 1
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limits * pages) - limits;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'addresses.active': true });
            if (userInfo) {
                const config = await this.configModel.findOne({}, { customer_stylist_radius: 1 })
                const radius = config && config.customer_stylist_radius ? config.customer_stylist_radius : 20
                const searchFilter = search ? search : null;
                const stylistLevel = stylist_level ? stylist_level : 'senior';
                const preference = userInfo.preference.length > 0 ? userInfo.preference : [];
                const genderFilter = gender_filter ? gender_filter.split(',') : undefined;
                const ratingFilter = rating_filter ? parseInt(rating_filter) : 0;
                const nameFilter = name_filter ? name_filter : undefined;
                const sortFilter = sort ? sort : "avg_rating";
                let sortingMatchObj = {}
                let genderMatchObj = {}
                let ratingMatchObj = {}
                let nameMatchObj = {}

                if (sortFilter == "avg_rating") {
                    sortingMatchObj = { $sort: { "avg_rating": -1 } };
                } else if (sortFilter == "most_preferred") {
                    sortingMatchObj = { $sort: { "stylist_fav_count": -1 } };
                } else if (sortFilter == "completed_services") {
                    sortingMatchObj = { $sort: { "completed_order_count": -1 } };
                } else {
                    sortingMatchObj = { $sort: { "avg_rating": -1 } };
                }

                if (genderFilter && genderFilter.length > 0) {
                    genderMatchObj = { $match: { gender: { $in: genderFilter } } }
                } else {
                    genderMatchObj = { $match: { gender: { $in: ['men', 'women'] } } }
                }

                if (ratingFilter === 0) {
                    ratingMatchObj = { $match: { avg_rating: { $gte: 0 } } }
                } else {
                    ratingMatchObj = { $match: { avg_rating: { $gte: ratingFilter } } }
                }

                if (nameFilter) {
                    nameMatchObj = { $match: { full_name: { $regex: nameFilter, $options: "i" } } }
                } else {
                    nameMatchObj = { $match: { online: 1 } }
                }

                const activeAddress = userInfo.addresses.find(function (elem: { active: boolean }) {
                    if (elem.active) {
                        return elem;
                    }
                });

                if (activeAddress) {
                    console.log(activeAddress.lng, activeAddress.lat)
                    const Query = [];

                    Query.push({
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [parseFloat(activeAddress.lng), parseFloat(activeAddress.lat)]
                            },
                            key: "location",
                            distanceField: "distance",
                            maxDistance: radius * constants.METERS_PER_MILE,
                            spherical: true
                        }
                    });

                    Query.push({
                        $lookup:
                        {
                            from: "ratings",
                            localField: "_id",
                            foreignField: "stylist_id",
                            as: "ratings"
                        }
                    });

                    Query.push(
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: "stylist_id",
                                as: "orders"
                            }
                        },
                        {
                            $lookup: {
                                from: 'favourites',
                                localField: '_id',
                                foreignField: "stylist_id",
                                as: "favs"
                            }
                        },
                        {
                            $addFields: {
                                "completed_orders": {
                                    $filter: {
                                        input: "$orders",
                                        as: "order",
                                        cond: { $eq: ["$$order.booking_status", 4] }
                                    }
                                }
                            }
                        },
                    )

                    if (stylistLevel) {
                        Query.push({
                            $match: {
                                experience: stylistLevel,
                            }
                        });
                    }

                    const gender = [];
                    if (preference.length > 0) {
                        for (let i = 0; i < preference.length; i++) {
                            const genderValue = preference[i];
                            gender.push(genderValue)
                        }
                    } else {
                        gender.push("men", "women")
                    }

                    Query.push({
                        $match: {
                            gender: { $in: gender }
                        }
                    });

                    if (search) {
                        Query.push({
                            $match: {
                                full_name: {
                                    $regex: search + ".*$",
                                    $options: "i"
                                }
                            }
                        });
                    }

                    Query.push({
                        $project: {
                            _id: 1,
                            firstname: 1,
                            lastname: 1,
                            middlename: 1,
                            distance: 1,
                            online: 1,
                            experience: 1,
                            gender: 1,
                            completed_order_count: {
                                $cond: ["$completed_orders", { $size: "$completed_orders" }, 0]
                            },
                            "stylist_fav_count": { $cond: ["$favs", { $size: "$favs" }, 0] },
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            profile: {
                                $cond: {
                                    if: { $ne: ["$profile", ""] },
                                    then: { $concat: [constants.STYLIST_PROFILE, "", "$profile"] },
                                    else: ""
                                }
                            }
                        }
                    },
                        { $skip: skip },
                        { $limit: limits },
                        nameMatchObj,
                        genderMatchObj,
                        sortingMatchObj,
                        ratingMatchObj
                    );

                    const stylistInfo = await this.serviceProviderModel.aggregate(Query);
                    if (pages < 1) {
                        return this.apiResponse.successResponseWithData(res, "Stylist found successfully", []);
                    } else {
                        return this.apiResponse.successResponseWithData(res, "Stylist found successfully", stylistInfo);
                    }
                } else {
                    return this.apiResponse.ErrorResponse(res, "No active location found.", {});
                }
            } else {
                return this.apiResponse.ErrorResponse(res, "user not found", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }


    async showAllActiveStylist(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit, gender_filter, rating_filter, name_filter, stylist_type, sort } = req.body;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'addresses.active': true });
            if (userInfo) {
                const pages = page ? parseInt(page) : 1
                const limits = limit ? parseInt(limit) : 10;
                const skip = (limits * pages) - limits;

                const activeAddress = userInfo.addresses.find(elem => elem.active ? elem : null)
                const blockedStylists = userInfo.blocked_stylist.filter(elem => elem.block_status == "active").map(elem => elem.stylist_id);
                const config = await this.configModel.findOne({}, { customer_stylist_radius: 1 });
                const radius = config && config.customer_stylist_radius ? config.customer_stylist_radius : 20
                if (activeAddress) {
                    const genderFilter = gender_filter ? gender_filter.split(',') : null;
                    const nameFilter = name_filter ? name_filter : null;
                    const stylistTypeFilter = stylist_type ? stylist_type : null;
                    const sortFilter = sort ? sort : "avg_rating";
                    const ratingFilter = rating_filter ? parseInt(rating_filter) : 0;
                    const requestId = req.headers.requestid;
                    let sortingMatchObj = {}
                    let genderMatchObj = {}
                    let ratingMatchObj = {}
                    let nameMatchObj = {}
                    let stylistMatchObj = {}

                    if (sortFilter == "avg_rating") {
                        sortingMatchObj = { $sort: { "avg_rating": -1 } };
                    } else if (sortFilter == "most_preferred") {
                        sortingMatchObj = { $sort: { "stylist_fav_count": -1 } };
                    } else if (sortFilter == "completed_services") {
                        sortingMatchObj = { $sort: { "completed_order_count": -1 } };
                    } else {
                        sortingMatchObj = { $sort: { "avg_rating": -1 } };
                    }

                    if (genderFilter && genderFilter.length) {
                        genderMatchObj = { $match: { gender: { $in: genderFilter } } }
                    } else {
                        genderMatchObj = { $match: { gender: { $in: ["men", "women"] } } }
                    }

                    if (stylistTypeFilter) {
                        stylistMatchObj = { $match: { experience: { $in: [stylistTypeFilter] } } }
                    } else {
                        stylistMatchObj = { $match: { experience: { $in: ['advanced', 'senior'] } } }
                    }

                    if (nameFilter) {
                        nameMatchObj = { $match: { full_name: { $regex: nameFilter, $options: "i" } } }
                    } else {
                        nameMatchObj = { $match: { online: 0 } }
                    }

                    if (ratingFilter === 0) {
                        ratingMatchObj = { $match: { avg_rating: { $gte: 0 } } }
                    } else {
                        ratingMatchObj = { $match: { avg_rating: { $gte: ratingFilter } } }
                    }

                    const stylistInfo = await this.serviceProviderModel.aggregate([{
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [parseFloat(activeAddress.lng), parseFloat(activeAddress.lat)]
                            },
                            key: "location",
                            query: {
                                online: 0,
                                registration_status: "accepted",
                                deleted: false,
                                status: true
                            },
                            distanceField: "customer_distance",
                            maxDistance: radius * constants.METERS_PER_MILE,
                            distanceMultiplier: constants.MILES_PER_METER,
                            spherical: true
                        }
                    },
                    {
                        $match: {
                            $expr: {
                                $lte: ["$customer_distance", "$radius"]
                            }
                        }
                    },
                    {
                        $match: {
                            "_id": { $nin: blockedStylists }
                        }
                    },
                    {
                        $match: {
                            $expr: {
                                $not: {
                                    $in: [String(user._id), "$blocked_customer"]
                                }
                            }
                        }
                    },
                        nameMatchObj,
                        genderMatchObj,
                        stylistMatchObj,
                    {
                        $lookup: {
                            from: 'ratings',
                            localField: "_id",
                            foreignField: "stylist_id",
                            as: "ratings"
                        }
                    },
                    {
                        $lookup: {
                            from: 'orders',
                            localField: '_id',
                            foreignField: "stylist_id",
                            as: "orders"
                        }
                    },
                    {
                        $lookup: {
                            from: 'favourites',
                            localField: '_id',
                            foreignField: "stylist_id",
                            as: "favs"
                        }
                    },
                    {
                        $addFields: {
                            "completed_orders": {
                                $filter: {
                                    input: "$orders",
                                    as: "order",
                                    cond: { $eq: ["$$order.booking_status", 4] }
                                }
                            }
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            firstname: 1,
                            lastname: 1,
                            middlename: 1,
                            location: 1,
                            radius: 1,
                            completed_order_count: {
                                $cond: ["$completed_orders", { $size: "$completed_orders" }, 0]
                            },
                            "stylist_fav_count": { $cond: ["$favs", { $size: "$favs" }, 0] },
                            online: 1,
                            "rating_count": { $size: "$ratings" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            experience: 1,
                            gender: 1,
                            profile: {
                                $cond: {
                                    if: { $ne: ["$profile", ""] },
                                    then: { $concat: [constants.STYLIST_PROFILE, "", "$profile"] },
                                    else: ""
                                }
                            }
                        }
                    },
                        sortingMatchObj,
                        ratingMatchObj
                        // {$skip: skip},
                        // {$limit: limit}
                    ])

                    if (stylistInfo.length > 0) {
                        // let actievStylistInfo = await Promise.all(stylistInfo.map(async (stylist: UserDto) => {
                        //     return new Promise((resolve, reject) => {
                        //         axios.get("https://api.nextbillion.io/directions/json?origin=" + stylist.location.coordinates[1] + "," + stylist.location.coordinates[0] + "&destination=" + activeAddress.lat + "," + activeAddress.lng + "&key=" + process.env.NEXT_BILLION_KEY).then((response) => {
                        //             stylist.distance = response.data.routes[0].distance * constants.MILES_PER_METER;
                        //             resolve(stylist);
                        //         }, (error) => {
                        //             console.log(error.response.data);
                        //             stylist.distance = null;
                        //             resolve(stylist);
                        //         });
                        //     })
                        // }))

                        // const actievStylistdetails: any = actievStylistInfo.filter((stylist: { distance: number, radius: number }) => stylist.distance != null && stylist.distance <= stylist.radius ? stylist : null);

                        let stylistArr = [];
                        for (let i = 0; i < stylistInfo.length; i++) {
                            if (stylistInfo[i].experience === 'senior') {
                                stylistArr.push(stylistInfo[i])
                            }
                            if (stylistInfo[i].experience === 'advanced') {
                                stylistArr.push(stylistInfo[i])
                            }
                        }

                        let paginatedResult = {};
                        if (requestId) {
                            res.status(200)
                            res.setHeader("requestId", requestId)
                            res.json({ status: 200, message: "Active stylist found successfully.", data: stylistArr })
                            return res
                        }

                        if (pages < 1) {
                            paginatedResult = { totalPage: 0, currentPage: 0, result: [] }
                        } else if (pages) {
                            paginatedResult = { totalPage: Math.ceil(stylistArr.length / limits), currentPage: stylistArr.length > 0 ? pages : 0, result: stylistArr }
                        } else {
                            paginatedResult = { totalPage: Math.ceil(stylistArr.length / limits), result: stylistArr }
                        }
                        return res.status(200).json({ status: 200, message: "Active stylist found successfully.", data: paginatedResult });
                    } else {
                        return res.status(200).json({ status: 200, message: "No records found.", data: { totalPage: 1, currentPage: 1, result: [] } });
                    }
                } else {
                    return this.apiResponse.ErrorResponse(res, "No active location found.", {});
                }
            } else {
                return this.apiResponse.ErrorResponse(res, "No records found.", {});
            }

        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async getAllActiveStylist(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit, stylist_type, gender_filter, name_filter, rating_filter, sort } = req.body;

            const pages = page ? parseInt(page) : 1;
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limits * pages) - limits;

            const userInfo = await this.userModel.findOne({ _id: user._id, 'addresses.active': true });
            if (userInfo) {
                const config = await this.configModel.findOne({}, { customer_stylist_radius: 1 });
                const radius = config && config.customer_stylist_radius ? config.customer_stylist_radius : 20;
                const stylistTypeFilter = stylist_type ? stylist_type : null;
                const genderFilter = gender_filter ? gender_filter.split(",") : null;
                const nameFilter = name_filter ? name_filter : null;
                const ratingFilter = rating_filter ? parseInt(rating_filter) : 0;
                const sortFilter = sort ? sort : "avg_rating";
                let stylistTypeMatchObj = {};
                let genderMatchObj = {};
                let nameMatchObj = {};
                let sortingMatchObj = {}

                const activeAddress = userInfo.addresses.find(elem => elem.active ? elem : null);
                const blockedStylists = userInfo.blocked_stylist.filter(elem => elem.block_status == "active").map(elem => elem.stylist_id);

                if (stylistTypeFilter) {
                    stylistTypeMatchObj = { $match: { experience: { $in: [stylistTypeFilter] } } }
                } else {
                    stylistTypeMatchObj = { $match: { experience: { $in: ['advanced', 'senior'] } } }
                }

                if (genderFilter && genderFilter.length) {
                    genderMatchObj = { $match: { gender: { $in: [genderFilter] } } };
                } else {
                    genderMatchObj = { $match: { gender: { $in: ["men", "women"] } } };
                }

                if (nameFilter) {
                    nameMatchObj = { $match: { full_name: { $regex: nameFilter, $options: "i" } } }
                } else {
                    nameMatchObj = { $match: { online: 1 } }
                }

                if (sortFilter == "avg_rating") {
                    sortingMatchObj = { $sort: { "avg_rating": -1 } };
                } else if (sortFilter == "most_preferred") {
                    sortingMatchObj = { $sort: { "stylist_fav_count": -1 } };
                } else if (sortFilter == "completed_services") {
                    sortingMatchObj = { $sort: { "completed_order_count": -1 } };
                } else {
                    sortingMatchObj = { $sort: { "avg_rating": -1 } };
                }

                if (activeAddress) {
                    const stylistInfo = await this.serviceProviderModel.aggregate([
                        {
                            $geoNear: {
                                near: {
                                    type: "Point",
                                    coordinates: [parseFloat(activeAddress.lng), parseFloat(activeAddress.lat)]
                                },
                                key: "location",
                                query: {
                                    online: 1,
                                    registration_status: "accepted",
                                    deleted: false,
                                    status: true
                                },
                                distanceField: "customer_distance",
                                maxDistance: radius * constants.METERS_PER_MILE,
                                distanceMultiplier: constants.MILES_PER_METER,
                                spherical: true
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $lte: ["$customer_distance", "$radius"]
                                }
                            }
                        },
                        {
                            $match: {
                                "_id": { $nin: blockedStylists }
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $not: {
                                        $in: [String(user._id), "$blocked_customer"]
                                    }
                                }
                            }
                        },
                        genderMatchObj,
                        stylistTypeMatchObj,
                        nameMatchObj,
                        {
                            $lookup: {
                                from: 'ratings',
                                localField: "_id",
                                foreignField: "stylist_id",
                                as: "ratings"
                            }
                        },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: "stylist_id",
                                as: "orders"
                            }
                        },
                        {
                            $lookup: {
                                from: 'favourites',
                                localField: '_id',
                                foreignField: "stylist_id",
                                as: "favs"
                            }
                        },
                        {
                            $addFields: {
                                "completed_orders": {
                                    $filter: {
                                        input: "$orders",
                                        as: "order",
                                        cond: { $eq: ["$$order.booking_status", 4] }
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                firstname: 1,
                                lastname: 1,
                                middlename: 1,
                                location: 1,
                                radius: 1,
                                completed_order_count: {
                                    $cond: ["$completed_orders", { $size: "$completed_orders" }, 0]
                                },
                                "stylist_fav_count": { $cond: ["$favs", { $size: "$favs" }, 0] },
                                online: 1,
                                "rating_count": { $size: "$ratings" },
                                "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                                experience: 1,
                                gender: 1,
                                profile: {
                                    $cond: {
                                        if: { $ne: ["$profile", ""] },
                                        then: { $concat: [constants.STYLIST_PROFILE, "", "$profile"] },
                                        else: ""
                                    }
                                }
                            }
                        }
                        //{$skip: skip},
                        //{$limit: limit}
                    ]);

                    if (stylistInfo.length > 0) {
                        // const activeStylistInfo = await Promise.all(stylistInfo.map(async (stylist) => {
                        //     return new Promise((resolve, reject) => {
                        //         axios.get("https://api.nextbillion.io/directions/json?origin=" + stylist.location.coordinates[1] + "," + stylist.location.coordinates[0] + "&destination=" + activeAddress.lat + "," + activeAddress.lng + "&key=" + process.env.NEXT_BILLION_KEY).then((response) => {
                        //             stylist.distance = response.data.routes[0].distance * constants.MILES_PER_METER;
                        //             stylist.duration = response.data.routes[0].duration;
                        //             resolve(stylist);
                        //         }, (error) => {
                        //             console.log(error);
                        //             stylist.distance = null;
                        //             stylist.duration = null;
                        //             resolve(stylist);
                        //         })
                        //     })
                        // }))

                        // const actievStylistdetails: any = activeStylistInfo.filter((stylist: { duration: number, distance: number, radius: number }) => stylist.duration != null && stylist.distance != null && stylist.duration <= 45 && stylist.distance <= stylist.radius);

                        let stylistArr = [];
                        for (let i = 0; i < stylistInfo.length; i++) {
                            if (stylistInfo[i].experience === 'senior') {
                                stylistArr.push(stylistInfo[i])
                            }
                            if (stylistInfo[i].experience === 'advanced') {
                                stylistArr.push(stylistInfo[i])
                            }
                        }

                        let paginatedResult = {};
                        if (pages > 1) {
                            paginatedResult = { totalPage: 0, currentPage: 0, result: [] }
                        } else if (pages) {
                            paginatedResult = { totalPage: Math.ceil(stylistArr.length / limits), currentPage: stylistArr.length > 0 ? pages : 0, result: stylistArr }
                        } else {
                            paginatedResult = { totalPage: Math.ceil(stylistArr.length / limits), result: stylistArr }
                        }
                        return this.apiResponse.successResponseWithData(res, "Active stylist found successfully.", paginatedResult);
                    } else {
                        return res.status(200).json({ status: 200, message: "No records found.", data: { totalPage: 1, currentPage: 1, result: [] } });
                    }
                } else {
                    return this.apiResponse.ErrorResponse(res, "No active location found.", {});
                }
            } else {
                return this.apiResponse.ErrorResponse(res, "No records found.", {});
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async stylistDetail(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit, stylist_id, filter, profile_id } = req.body;

            const pages = page ? page : 1;
            const limits = limit ? parseInt(limit) : 10;
            const skip = (limits * pages) - limits;

            const favouriteStylist = await this.favouriteModel.findOne({ stylist_id: stylist_id, user_id: user._id }, { created_at: -1 });
            const stylistInfo = await this.serviceProviderModel.aggregate([
                {
                    $match: {
                        _id: new Types.ObjectId(stylist_id),
                        registration_status: 'accepted',
                        deleted: false,
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        pipeline: [
                            {
                                $match: { stylist_id: stylist_id, booking_status: 3 }
                            },
                            { $project: { _id: 1 } }
                        ],
                        as: "orders"
                    }
                },
                {
                    $addFields: {
                        "is_fav": 0
                    }
                },
                { $lookup: { from: 'ratings', localField: '_id', foreignField: 'stylist_id', as: "ratings" } },
                {
                    $project: {
                        "profile": { $concat: [constants.STYLIST_PROFILE, "$profile"] },
                        "portfolio_images": {
                            $map:
                            {
                                input: "$portfolio_images",
                                as: "image",
                                in: { $concat: [constants.STYLIST_PORTFOLIO, stylist_id, "/", "$$image.image"] }
                            }
                        },
                        "portfolio_videos": {
                            $map:
                            {
                                input: "$portfolio_videos",
                                as: "video",
                                in: { $concat: [constants.STYLIST_PORTFOLIO, stylist_id, "/", "$$video.video"] }
                            }
                        },
                        rating_count: { $size: "$ratings" },
                        "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                        "firstname": 1,
                        "lastname": 1,
                        "full_name": 1,
                        "online": 1,
                        "email": 1,
                        "gender": 1,
                        "is_order_active": { $cond: [{ $size: "$orders" }, 1, 0] },
                        "country_code": 1,
                        "phone_number": 1,
                        "experience": 1,
                        "about": 1,
                        "skills": 1,
                    }
                }
            ]);

            if (stylistInfo.length > 0) {
                let matchQuery = {};
                if (filter) {
                    matchQuery = { $match: { stylist_id: new Types.ObjectId(stylist_id), available_for: { $in: filter.split(',') }, approved: true, deleted: false, disable: false } }
                } else {
                    matchQuery = { $match: { stylist_id: new Types.ObjectId(stylist_id), approved: true, deleted: false, disable: false } }
                }

                const customServices = await this.customServiceModel.aggregate([
                    matchQuery,
                    { $lookup: { from: 'ratings', localField: '_id', foreignField: 'custom_service_id', as: "ratings" } },
                    { $skip: skip },
                    { $limit: limits },
                    {
                        $addFields: {
                            cart_quantity: 0
                        }
                    },
                    {
                        $lookup: {
                            from: 'favourites',
                            let: { user_id: user._id, service_id: "$_id" },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$$user_id", "$user_id"] },
                                            { $eq: ["$$service_id", "$service_id"] },
                                        ]
                                    }
                                }
                            }],
                            as: "is_fav"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            duration: { $cond: ["$section_image", "$section_image", 0] },
                            stylist_type: { $cond: ["$stylist_type", "$stylist_type", []] },
                            "service_description": { $cond: ["$description", "$description", ""] },
                            featured_image: { $cond: ["$featured_image", "$featured_image", ""] },
                            section_image: { $cond: ["$section_image", "$section_image", ""] },
                            created_at: 1,
                            status: { $cond: ["$section_image", "$section_image", false] },
                            updated_at: 1,
                            regular_price: 1,
                            sale_price: 1,
                            available_for: 1,
                            "is_fav": { $size: "$is_fav" },
                            "avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                            "rating_count": { $size: "$ratings" },
                            "quantity": { $cond: { if: "$quantity", then: "$quantity", else: 1 } },
                            "cart_quantity": 1,
                            images: {
                                $map: {
                                    input: "$images",
                                    as: "image",
                                    in: { _id: "$$image._id", image: { $concat: [constants.CUSTOM_SERVICE_IMAGE, "$$image.image"] } }
                                }
                            },
                            videos: {
                                $map: {
                                    input: "$videos",
                                    as: "video",
                                    in: { _id: "$$video._id", video: { $concat: [constants.CUSTOM_SERVICE_VIDEO, "$$video.video"] } }
                                }
                            },
                            title: 1
                        }
                    },
                ]);

                const cartItems = await this.customerCartModel.aggregate([
                    { $match: { user_id: new Types.ObjectId(user._id) } },
                    {
                        $project: {
                            "cart_profiles": { $filter: { input: "$cart_profiles", as: "cart", cond: { $eq: ["$$cart.profile_id", new Types.ObjectId(profile_id)] } } }
                        }
                    }
                ])

                const cartItemDetails = cartItems && cartItems[0] && cartItems[0].cart_profiles[0];
                if (cartItemDetails && cartItemDetails.cart_items.length > 0) {
                    for (let i = 0; i < cartItemDetails.cart_items.length; i++) {
                        const index = customServices.map((element) => { return element._id.toString() }).indexOf(cartItemDetails.cart_items[i].service_id.toString())
                        if (index > -1) {
                            customServices[index].cart_quantity = cartItemDetails.cart_items[i].quantity
                        }
                    }
                }

                stylistInfo[0].is_fav = favouriteStylist ? 1 : 0;
                stylistInfo[0].services = customServices.length > 0 ? customServices : [];
                return this.apiResponse.successResponseWithData(res, 'Record found!', stylistInfo);
            } else {
                return this.apiResponse.successResponseWithData(res, 'Record not found!', []);
            }
        } catch (e) {
            console.log(`e`, e)
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async findNearByStylist(req: Request, res: Response) {
        try {
            const { lng, lat } = req.body;

            const latitude = lat ? lat : 0;
            const longitude = lng ? lng : 0;

            const stylistInfo = await this.serviceProviderModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        key: "location",
                        query: {
                            registration_status: "accepted",
                            deleted: false,
                            status: true
                        },
                        distanceField: "distance",
                        maxDistance: 1000,
                        spherical: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                    }
                }
            ]);
            if (stylistInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, "Stylist found successfully", { stylist_count: stylistInfo.length > 0 ? stylistInfo.length : 0 })
            } else {
                return this.apiResponse.successResponseWithData(res, "Stylist not found", { stylist_count: 0 })
            }
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, []);
        }
    }


    async stylistAvailability(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { stylist_id } = req.body;

            const stylistInfo = await this.serviceProviderModel.findOne({ _id: stylist_id });
            const orderInfo = await this.orderModel.find({ stylist_id: stylist_id, booking_status: { $in: [1, 2, 3] } });
            const isStylistBlocked = await this.userModel.findOne({ _id: user._id, blocked_stylist: { $elemMatch: { stylist_id: stylist_id, block_status: 'active' } } })
            if (stylistInfo.blocked_customer.length > 0 && stylistInfo.blocked_customer.indexOf(user._id) >= 0) {
                return this.apiResponse.successResponseWithData(res, 'Stylist has blocked the customer!', {})
            } else if (orderInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Stylist already in active order', {})
            } else if (isStylistBlocked) {
                return this.apiResponse.successResponseWithData(res, 'Customer has blocked by stylist!', {})
            } else {
                return this.apiResponse.successResponseWithData(res, "Stylist found successfully", stylistInfo)
            }
        } catch (error) {
            return this.apiResponse.ErrorResponse(res, error.message, []);
        }
    }


    async bookingDetail(req: Request, res: Response) {
        try {
            const { order_id, } = req.body;

            const orderInfo = await this.orderModel.aggregate([
                { $match: { _id: new Types.ObjectId(order_id) } },
                { $lookup: { from: "service_providers", localField: "stylist_id", foreignField: "_id", as: "stylist" } },
                { $unwind: { path: "$stylist", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "ratings", localField: "user_id", foreignField: "user_id", as: "reviews" } },
                {
                    $addFields: {
                        created: { $convert: { input: "$created_at", to: "long", onError: "0" } },
                        block_check: {
                            $filter: {
                                input: "$user.blocked_stylist",
                                as: "stylist",
                                cond: { $eq: ["$stylist_id", "$$stylist.stylist_id"] }
                            }
                        },
                        reviews: {
                            $filter: {
                                input: "$reviews",
                                as: "reviews",
                                cond: { $eq: ["$stylist_id", "$$reviews.stylist_id"] }
                            }
                        }
                    }
                },
                {
                    $project: {
                        order_number: 1,
                        booking_status: 1,
                        wallet_used: 1,
                        wallet_amount_used: 1,
                        payment_status: 1,
                        direct_order: 1,
                        stripe_customer_id: 1,
                        date: 1,
                        cart: 1,
                        bill_details: 1,
                        otp: '$stylist.otp',
                        is_blocked: { $cond: ["$block_check", { $size: "$block_check" }, 0] },
                        is_reviewed: { $size: "$reviews" },
                        booking_type: 1,
                        order_accepted_at: 1,
                        created_at: "$created",
                        expired_at: '',
                        started_service_at: 1,
                        completed_at: 1,
                        reschedule_count: { $cond: ["$reschedule_count", "$reschedule_count", 0] },
                        cancelled_reason: { $cond: ["$cancelled_reason", "$cancelled_reason", ""] },
                        active_location: "$active_location.address",
                        "assigned_stylist._id": { $cond: ["$stylist", "$stylist._id", ""] },
                        "assigned_stylist.profile": { $cond: ["$stylist", { $concat: [constants.STYLIST_PROFILE, "$stylist.profile"] }, ""] },
                        "assigned_stylist.firstname": { $cond: ["$stylist", "$stylist.firstname", ""] },
                        "assigned_stylist.lastname": { $cond: ["$stylist", "$stylist.lastname", ""] },
                        "assigned_stylist.full_name": { $cond: ["$stylist", "$stylist.full_name", ""] },
                        "assigned_stylist.experience": { $cond: ["$stylist", "$stylist.experience", ""] },
                        "assigned_stylist.phone_number": { $cond: ["$stylist", "$stylist.phone_number", ""] },
                        "card_used": { $cond: ["$user", { $filter: { input: "$user.cards", as: "cards", cond: { $eq: ["$$cards.customerId", "$stripe_customer_id"] } } }, []] },
                    }
                },
            ]);

            if (orderInfo.length > 0) {
                orderInfo[0].expired_at = orderInfo[0].created_at + 5 * 60 * 1000;
                return this.apiResponse.successResponseWithData(res, '', orderInfo[0]);
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Order not found!');
            }
        } catch (e) {
            console.log(e)
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async transactionListing(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit, transaction_type } = req.body;
            const { from_date, to_date } = req.query;

            const pages = page ? parseInt(page) : 1
            const limits = limit ? parseInt(limit) : 10
            const skip = (limits * pages) - limits;

            const transactionTypeFilter = transaction_type ? transaction_type : "";
            let transactionTypeMatchObj = {};
            let query = {};

            const walletBalance = await this.userModel.findOne({ _id: user._id }, { wallet_balance: 1 });
            if (from_date && to_date) {
                query = { user_id: new Types.ObjectId(user._id), created_at: { $gte: new Date(from_date.toString()), $lte: new Date(to_date.toString()) } }
            } else {
                query = { user_id: new Types.ObjectId(user._id) }
            }

            if (transactionTypeFilter) {
                transactionTypeMatchObj = { $match: { type: { $in: [transactionTypeFilter] } } }
            } else {
                transactionTypeMatchObj = { $match: { user_id: new Types.ObjectId(user._id), type: { $in: ["other", "card-refund", "refund", "reward", "order-deduction"] } } }
            }

            const transactionDetails = await this.customerTransactionModel.aggregate([
                { $match: query },
                transactionTypeMatchObj,
                {
                    $addFields: {
                        timestamp: { $toLong: "$created_at" }
                    }
                },
                { $limit: limits },
                { $skip: skip },
                { $sort: { created_at: -1 } }
            ])
            if (transactionDetails.length > 0) {
                const responseObj = {
                    balance: walletBalance.wallet_balance ? walletBalance.wallet_balance : 0,
                    transactionDetails
                }
                return this.apiResponse.successResponseWithData(res, 'Record found!', responseObj)
            } else {
                return res.status(200).json({ status: 200, message: "No transactions found", data: { balance: 0, transaction: [] } })
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async getAdminTimeSlots(req: Request, res: Response) {
        try {
            const configSetting = await this.configModel.findOne({})
            if (configSetting.schedule && configSetting.schedule.length > 0) {
                const globalPlatformData = JSON.parse(JSON.stringify(configSetting))
                const responseObj = {
                    start_date: "",
                    end_date: "",
                    holidays: globalPlatformData.holidays,
                    scheduled_days: globalPlatformData.schedule
                }
                return this.apiResponse.successResponseWithData(res, 'Record found', responseObj)
            } else {
                throw new Error("No Schedule found!")
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async getStylistTimeSlots(req: Request, res: Response) {
        try {
            const { stylist_id } = req.body;

            const responseObj = {
                start_date: 0,
                end_date: 0,
                schedule_type: '',
                scheduled_days: []
            }

            const stylistActiveSchedule = await this.serviceProviderModel.findById(stylist_id)

            if (!stylistActiveSchedule) {
                return this.apiResponse.successResponseWithData(res, 'Stylist not found', {})
            }

            responseObj.schedule_type = stylistActiveSchedule.active_schedule_type
            let scheduleList = await this.scheduleModel.aggregate([
                {
                    $match: {
                        stylist_id: new Types.ObjectId(stylist_id),
                        schedule_type: stylistActiveSchedule ? stylistActiveSchedule.active_schedule_type : 'basic'
                    }
                }
            ])
            if (!scheduleList.length) {
                const errorResponse = {
                    start_date: null,
                    end_date: null,
                    scheduled_days: [],
                    schedule_type: responseObj.schedule_type ? responseObj.schedule_type : "basic"
                }
                return this.apiResponse.successResponseWithData(res, 'Record not found', errorResponse)
            }
            if (scheduleList.length && scheduleList[0] && scheduleList[0].schedule_type == 'basic') {
                let currentDate = moment()
                for (let i = 1; i < 31; i++) {
                    let nextDay = currentDate.format('dddd')
                    nextDay = WEEKDAY_LIST[nextDay]
                    let existDayDetails = null
                    let isActive = false
                    scheduleList.find(data => {
                        const isInScheduledDays = data.scheduled_days.find(o => o.day == nextDay)
                        if (isInScheduledDays) {
                            isActive = data.active
                            existDayDetails = isInScheduledDays.scheduled_times
                        }
                    })
                    if (existDayDetails) {
                        responseObj.scheduled_days.push({
                            date: new Date(currentDate.toDate()).getTime(),
                            active: isActive,
                            scheduled_times: existDayDetails
                        })
                    }
                    currentDate = currentDate.add(1, 'day')
                }
                responseObj.start_date = responseObj.scheduled_days[0].date
                responseObj.end_date = responseObj.scheduled_days[responseObj.scheduled_days.length - 1].date
            } else {
                let currentDate = moment()
                for (let i = 1; i < 31; i++) {
                    let nextDay = currentDate.format('dddd')
                    nextDay = WEEKDAY_LIST[nextDay]
                    const weekOfMonth = (0 | currentDate.date() / 7) + 1;
                    let existDayDetails = null
                    let isActive = false
                    scheduleList.find(data => {
                        const isInScheduledDays = data.scheduled_days.find(o => o.day == nextDay && data.week == weekOfMonth)
                        if (isInScheduledDays) {
                            isActive = data.active
                            existDayDetails = isInScheduledDays.scheduled_times
                        }
                    })
                    if (existDayDetails) {
                        responseObj.scheduled_days.push({
                            date: new Date(currentDate.toDate()).getTime(),
                            active: isActive,
                            scheduled_times: existDayDetails
                        })
                    }
                    currentDate = currentDate.add(1, 'day')
                }
                responseObj.start_date = responseObj.scheduled_days[0].date
                responseObj.end_date = responseObj.scheduled_days[responseObj.scheduled_days.length - 1].date
            }
            return this.apiResponse.successResponseWithData(res, 'Record found', responseObj)
        } catch (e) {
            console.log(`e`, e)
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async paymentListing(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { page, limit } = req.body;
            const { from_date, to_date } = req.query;

            const pages = page ? parseInt(page) : 1
            const limits = limit ? parseInt(limit) : 10
            const skip = (limits * pages) - limits
            let query = {};

            if (req.query.from_date && req.query.to_date) {
                query = { user_id: new Types.ObjectId(user._id), type: "payment", created_at: { $gte: from_date, $lte: to_date } }
            } else {
                query = { user_id: new Types.ObjectId(user._id), type: "payment" }
            }

            const customerTransactionInfo = await this.customerTransactionModel.aggregate([
                { $match: query },
                {
                    $addFields: {
                        timestamp: { $toLong: "$created_at" }
                    }
                },
                { $skip: skip },
                { $limit: limits },
                { $sort: { _id: -1 } },
            ])

            if (customerTransactionInfo.length > 0) {
                if (pages < 1) {
                    res.status(200).json({ status: 200, message: "No transaction found!", data: [] })
                } else {
                    return this.apiResponse.successResponseWithData(res, 'Record found!', customerTransactionInfo);
                }
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }


    async addToWallet(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { amount, stripe_customer_id } = req.body;

            await this.utility.createCharge(amount, stripe_customer_id);
            await this.customerTransactionModel.create({
                user_id: user._id,
                amount: amount,
                message: `${amount} deducted from card`,
                type: 'payment',
                transaction_type: "deduction"
            });

            await this.customerTransactionModel.create({
                user_id: user._id,
                amount: amount,
                message: `${amount} added into wallet`,
                type: 'other',
                transaction_type: "addition"
            })
            await this.userModel.updateOne({ _id: user._id }, { $inc: { wallet_balance: amount } });
            return this.apiResponse.successResponseWithNoData(res, 'Successfully added into wallet')
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, []);
        }
    }
}