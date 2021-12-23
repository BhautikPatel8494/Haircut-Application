import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response } from 'express';
import { Model, Types } from "mongoose";

import { Favourites } from "../schema/favourite.schema";
import { Schedules } from "../schema/schedule.schema";
import { Users } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { CreateFavouriteDto, RemoveStylistOrService } from "./favourite.dto";
import { FilterDto } from "../home/home.dto";
import { constants } from "../utils/constant";

@Injectable()
export class FavouriteService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<Users>,
        @InjectModel('Favourite') private readonly favouriteModel: Model<Favourites>,
        @InjectModel('Schedule') private readonly scheduleModel: Model<Schedules>,
        private readonly apiResponse: ApiResponse
    ) { }

    async addFavServiceStylist(favouriteBody: CreateFavouriteDto, res: Response) {
        try {
            const { user_id, stylist_id, service_id, type } = favouriteBody;

            if (!service_id && !stylist_id) {
                return this.apiResponse.validationError(res, 'Please enter either stylist or service id');
            }

            let matchObj = {};
            if (stylist_id) {
                matchObj = { user_id: user_id, stylist_id: stylist_id }
                const userInfo = await this.userModel.findOne({ _id: user_id, blocked_stylist: { $elemMatch: { stylist_id: stylist_id, block_status: 'active' } } })
                if (userInfo) {
                    return this.apiResponse.ErrorResponseWithoutData(res, 'This user is present in blocked list!');
                }
            }
            if (service_id) {
                matchObj = { user_id: user_id, service_id: service_id }
            }

            const isFavouriteExist = await this.favouriteModel.findOne(matchObj, { _id: 1 })
            if (isFavouriteExist) {
                return this.apiResponse.notFoundResponseWithNoData(res, 'Record already present!')
            }

            const createData = {
                user_id: user_id,
                stylist_id: stylist_id,
                service_id: service_id,
                type: type
            }
            const favouriteData = await this.favouriteModel.create(createData);
            return this.apiResponse.successResponseWithData(res, 'Record created!', favouriteData);
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async listFavServices(filterBody: FilterDto, res: Response) {
        try {
            const { user_id } = filterBody;

            const favouriteInfo = await this.favouriteModel.aggregate([
                { $match: { user_id: new Types.ObjectId(user_id), service_id: { $type: "objectId" } } },
                { $lookup: { from: 'services', localField: 'service_id', foreignField: '_id', as: 'service' } },
                { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'custom_services', localField: 'service_id', foreignField: '_id', as: "custom_service" } },
                { $unwind: { path: '$custom_service', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "service_providers", localField: "custom_service.stylist_id", foreignField: "_id", as: "provider" } },
                { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: "service_id",
                        foreignField: "service_id",
                        as: "ratings"
                    }
                },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: "service_id",
                        foreignField: "custom_service_id",
                        as: "custom_ratings"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        "service._id": 1,
                        "service.duration": 1,
                        "service.stylist_type": 1,
                        "service.description": 1,
                        "service.regular_price": 1,
                        "service.sale_price": 1,
                        "service.quantity": 1,
                        "service.featured_image": { $concat: [constants.SERVICE_FEATURED_IMAGE, "$service.featured_image"] },
                        "service.section_image": { $concat: [constants.SERVICE_SECTION_IMAGE, "$service.section_image"] },
                        "service.images": {
                            $map: {
                                input: "$service.images",
                                as: "images",
                                in: { _id: "$$images._id", image: { $concat: [constants.SERVICE_IMAGE, "$$images.image"] } }
                            }
                        },
                        "service.videos": {
                            $map: {
                                input: "$service.videos",
                                as: "videos",
                                in: { _id: "$$videos._id", image: { $concat: [constants.SERVICE_VIDEO, "$$videos.video"] } }
                            }
                        },
                        "service.status": 1,
                        "service.title": 1,
                        "service.available_for":"$service.age_group",
                        "service.avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                        "custom_service._id": 1,
                        "custom_service.title": 1,
                        "custom_service.featured_image": "",
                        "custom_service.stylist_type": "$provider.experience",
                        "custom_service.avg_rating": { $cond: [{ $size: "$custom_ratings" }, { $avg: "$custom_ratings.value" }, 0] },
                        "custom_service.images": {
                            $map: {
                                input: "$custom_service.images",
                                as: "images",
                                in: { $concat: [constants.CUSTOM_SERVICE_IMAGE, "$$images.image"] }
                            }
                        },
                    }
                }
            ]);

            if (favouriteInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found', favouriteInfo);
            } else {
                return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async listFavStylist(filterBody: FilterDto, res: Response) {
        try {
            const { user_id } = filterBody;

            const userInfo = await this.userModel.findOne({ _id: user_id }, { blocked_stylist: 1 })
            const blocked_stylists = userInfo && userInfo.blocked_stylist.length > 0 ? userInfo.blocked_stylist : [];
            const blockStylistIds = [];

            if (blocked_stylists.length > 0) {
                blocked_stylists.map((obj: { block_status: string, stylist_id: string }) => {
                    if (obj.block_status == 'active') {
                        blockStylistIds.push(obj.stylist_id)
                    }
                })
            }

            const favStylistInfo = await this.favouriteModel.aggregate([
                { $match: { user_id: new Types.ObjectId(user_id), stylist_id: { $nin: blockStylistIds } } },
                { $lookup: { from: 'service_providers', localField: 'stylist_id', foreignField: '_id', as: 'stylist' } },
                { $lookup: { from: 'orders', pipeline: [{ $match: { stylist_id: { $nin: blockStylistIds }, booking_status: 3 } }, { $project: { _id: 1 } }], as: "orders" } },
                { $unwind: { path: '$stylist', preserveNullAndEmptyArrays: false } },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: "stylist_id",
                        foreignField: "stylist_id",
                        as: "ratings"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        "stylist._id": 1,
                        "stylist.online": 1,
                        "stylist.experience": 1,
                        "stylist.active_schedule_type": 1,
                        "stylist.profile": { $concat: [constants.STYLIST_PROFILE, "$stylist.profile"] },
                        "stylist.avg_rating": { $cond: [{ $size: "$ratings" }, { $avg: "$ratings.value" }, 0] },
                        "is_order_active": { $cond: [{ $size: "$orders" }, 1, 0] },
                        "stylist.firstname": 1,
                        "stylist.lastname": 1,
                        "stylist.middlename": 1
                    }
                }
            ]);

            if (favStylistInfo.length > 0) {
                let updatedStylistDetail = [];
                let isSlotAvailable = 0
                for (let i = 0; i < favStylistInfo.length; i++) {
                    const element = favStylistInfo[i]
                    const scheduleInfo = await this.scheduleModel.findOne({ stylist_id: element.stylist && element.stylist._id, schedule_type: element.stylist && element.stylist.active_schedule_type });
                    if (scheduleInfo) {
                        scheduleInfo.scheduled_days && scheduleInfo.scheduled_days.map((scheduleDays) => {
                            const isAllDisable = scheduleDays.scheduled_times.filter(timeInfo => timeInfo.active).length == scheduleDays.scheduled_times.length
                            if (isAllDisable) {
                                isSlotAvailable = 1
                            }
                        })
                    }
                    updatedStylistDetail.push({
                        ...element,
                        is_slots_available: isSlotAvailable
                    })
                }
                return this.apiResponse.successResponseWithData(res, 'Record found', updatedStylistDetail);
            } else {
                return this.apiResponse.notFoundResponseWithNoData(res, 'Record not found');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async removeFavServiceOrStylist(user: CurrentUserDto, favouriteBody: RemoveStylistOrService, res: Response) {
        try {
            const { service_id, stylist_id } = favouriteBody;

            let query = {};
            if (service_id) {
                query = { user_id: user._id, service_id: service_id }
            } else if (stylist_id) {
                query = { user_id: user._id, stylist_id: stylist_id }
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, "Unexpected!");
            }

            const favServiceStylistInfo = await this.favouriteModel.findOne(query);
            if (favServiceStylistInfo) {
                await this.favouriteModel.deleteOne(query);
                return this.apiResponse.successResponseWithNoData(res, 'Record deleted!');
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Record not found!');
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }
}