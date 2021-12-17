import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response } from "express";
import { Model, Types } from "mongoose";

import { Ratings } from "../schema/rating.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { FilterDto } from "../home/home.dto";
import { constants } from "../utils/constant";
import { CreateRatingDto } from "./rating.dto";

@Injectable()
export class RatingService {
    constructor(
        @InjectModel('Rating') private readonly ratingModel: Model<Ratings>,
        private readonly apiResponse: ApiResponse
    ) { }

    async stylistRating(rating: CreateRatingDto, res: Response) {
        try {
            const { user_id, stylist_id, value, message } = rating;

            const createObj = {
                user_id: user_id,
                stylist_id: stylist_id,
                value: value,
                message: message ? message : ''
            }

            const findRatingInfo = await this.ratingModel.findOne({ user_id: user_id, stylist_id: stylist_id });
            if (findRatingInfo) {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Already rated!');
            }
            const ratingResponse = await this.ratingModel.create(createObj);
            return this.apiResponse.successResponseWithData(res, 'Record created!', ratingResponse);
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async customServiceRating(rating: CreateRatingDto, res: Response) {
        try {
            const { user_id, custom_service_id, value } = rating;

            const createObj = {
                user_id: user_id,
                custom_service_id: custom_service_id,
                value: value
            }

            const findRatingInfo = await this.ratingModel.findOne({ user_id: user_id, custom_service_id: custom_service_id });
            if (findRatingInfo) {
                return this.apiResponse.ErrorResponseWithoutData(res, "Already rated!");
            }

            const ratingResponse = await this.ratingModel.create(createObj);
            return this.apiResponse.successResponseWithData(res, 'Record created!', ratingResponse)
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async serviceRating(rating: CreateRatingDto, res: Response) {
        try {
            const { user_id, service_id, value } = rating;

            const createObj = {
                user_id: user_id,
                service_id: service_id,
                value: value
            }

            const findRatingInfo = await this.ratingModel.findOne({ user_id: user_id, service_id: service_id });
            if (findRatingInfo) {
                return this.apiResponse.ErrorResponseWithoutData(res, "Already rated!");
            }

            const ratingResponse = await this.ratingModel.create(createObj);
            return this.apiResponse.successResponseWithData(res, 'Record created!', ratingResponse)
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async listStylistRating(filterBody: FilterDto, res: Response) {
        try {
            const { page, limit, filter, stylist_id } = filterBody;

            const pages = page ? page : 1;
            const limits = limit ? limit : 10;
            const skip = (limits * pages) - limits;
            const sortingFilter = filter ? filter : 'highest';
            let matchQueryObj = {};

            if (sortingFilter == "highest") {
                matchQueryObj = { value: -1 };
            } else if (sortingFilter == "lowest") {
                matchQueryObj = { value: 1 };
            } else if (sortingFilter == "newest") {
                matchQueryObj = { _id: -1 };
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Not a valid value for filter');
            }

            const ratingInfo = await this.ratingModel.aggregate([
                { $match: { stylist_id: new Types.ObjectId(stylist_id) } },
                { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                { $skip: skip },
                { $limit: limits },

                { $sort: matchQueryObj },
                {
                    $addFields: {
                        "timestamp": { "$toLong": "$updated_at" }
                    }
                },
                {
                    $project: {
                        "value": 1,
                        "rating_type": 1,
                        "message": 1,
                        "user_id": 1,
                        "stylist_id": 1,
                        "created_at": 1,
                        "updated_at": 1,
                        "timestamp": 1,
                        "first_name": "$user.firstname",
                        "last_name": "$user.lastname",
                        "full_name": "$user.full_name",
                        "profile_pic": { $cond: [{ $eq: ["$user.profile", ""] }, "", { $concat: [constants.CUSTOMER_PROFILE, "$user.profile"] }] }
                    }
                }
            ])

            if (ratingInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found', ratingInfo);
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'No records found!')
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async listServiceRating(filterBody: FilterDto, res: Response) {
        try {
            const { page, limit, filter, service_id, custom_service_id } = filterBody;

            const pages = page ? page : 1;
            const limits = limit ? limit : 10;
            const skip = (limits * pages) - limits;
            const sortingFilter = filter ? filter : 'highest';
            let matchQueryObj = {}

            if (service_id) {
                matchQueryObj = { service_id: new Types.ObjectId(service_id) }
            } else if (custom_service_id) {
                matchQueryObj = { custom_service_id: new Types.ObjectId(custom_service_id) }
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, "Please enter either service id or custom service id")
            }

            let sortingMatchObj = {};
            if (sortingFilter == "highest") {
                sortingMatchObj = { value: -1 };
            } else if (sortingFilter == "lowest") {
                sortingMatchObj = { value: 1 };
            } else if (sortingFilter == "newest") {
                sortingMatchObj = { _id: -1 };
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Not a valid value for filter');
            }

            const ratingInfo = await this.ratingModel.aggregate([
                { $match: matchQueryObj },
                { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                { $skip: skip },
                { $limit: limits },
                { $sort: sortingMatchObj },
                {
                    $addFields: {
                        "timestamp": { "$toLong": "$updated_at" }
                    }
                },
                {
                    $project: {
                        "value": 1,
                        "rating_type": 1,
                        "message": 1,
                        "user_id": 1,
                        "service_id": 1,
                        "custom_service_id": 1,
                        "created_at": 1,
                        "updated_at": 1,
                        "timestamp": 1,
                        "first_name": "$user.firstname",
                        "last_name": "$user.lastname",
                        "full_name": "$user.full_name",
                        "profile_pic": { $cond: [{ $eq: ["$user.profile", ""] }, "", { $concat: [constants.CUSTOMER_PROFILE, "$user.profile"] }] }
                    }
                }
            ])

            if (ratingInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found', ratingInfo)
            } else {
                return this.apiResponse.successResponseWithData(res, 'Record not found', [])
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }
}