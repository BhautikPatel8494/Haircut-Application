import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model, Types } from "mongoose";
import { Ratings } from "../schema/rating.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { constants } from "../utils/constant";

@Injectable()
export class RatingService {
    constructor(
        @InjectModel('Rating') private readonly ratingModel: Model<Ratings>,
        private readonly apiResponse: ApiResponse
    ) { }

    async stylistRating(req: Request, res: Response) {
        try {
            const { user_id, stylist_id, value, message } = req.body;

            const createObj = {
                user_id: user_id,
                stylist_id: stylist_id,
                value: value,
                message: message ? message : ''
            }

            const findRating = await this.ratingModel.findOne({ user_id: user_id, stylist_id: stylist_id });
            if (findRating) {
                return this.apiResponse.ErrorResponseWithoutData(res, 'Already rated!');
            }
            const ratingResponse = await this.ratingModel.create(createObj);
            return this.apiResponse.successResponseWithData(res, 'Record created!', ratingResponse);
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async listStylistRating(req: Request, res: Response) {
        try {
            const { page, limit, filter, stylist_id } = req.body;

            const limits = limit ? parseInt(limit) : 10;
            const pages = page ? parseInt(page) : 1;
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

            if (pages <= 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found', []);
            } else if (ratingInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found', ratingInfo);
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, 'No records found!')
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    // async listServiceRating(req: Request, res: Response) {
    //     try {
    //         let matchObj = {}
    //         if (req.body.service_id) {
    //             matchObj = { service_id: ObjectId(req.body.service_id) }
    //         } else if (req.body.custom_service_id) {
    //             matchObj = { custom_service_id: ObjectId(req.body.custom_service_id) }
    //         } else {
    //             throw new Error("Please enter either service id or custom service id")
    //         }
    //         let limit = req.body.limit ? parseInt(req.body.limit) : 10;
    //         let page = req.body.page ? parseInt(req.body.page) - 1 : 0;
    //         let skip = limit * page;
    //         let sort = req.body.filter ? req.body.filter : 'highest';
    //         let queryObj = {};
    //         if (sort == "highest") {
    //             queryObj = { value: -1 };
    //         } else if (sort == "lowest") {
    //             queryObj = { value: 1 };
    //         } else if (sort == "newest") {
    //             queryObj = { _id: -1 };
    //         } else {
    //             apiResponse.ErrorResponseWithoutData(res, 'Not a valid value for filter');
    //             return;
    //         }

    //         let rating = await RatingModel.aggregate([
    //             { $match: matchObj },
    //             { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
    //             { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    //             { $skip: skip },
    //             { $limit: limit },
    //             { $sort: queryObj },
    //             {
    //                 $addFields: {
    //                     "timestamp": { "$toLong": "$updated_at" }
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     "value": 1,
    //                     "rating_type": 1,
    //                     "message": 1,
    //                     "user_id": 1,
    //                     "service_id": 1,
    //                     "custom_service_id": 1,
    //                     "created_at": 1,
    //                     "updated_at": 1,
    //                     "timestamp": 1,
    //                     "first_name": "$user.firstname",
    //                     "last_name": "$user.lastname",
    //                     "full_name": "$user.full_name",
    //                     "profile_pic": { $cond: [{ $eq: ["$user.profile", ""] }, "", { $concat: [constants.CUSTOMER_PROFILE, "$user.profile"] }] }
    //                 }
    //             }
    //         ])
    //         if (!rating[0]) {
    //             throw new Error("Unable to find any ratings")
    //         }
    //         apiResponse.successResponseWithData(res, 'record found', rating)
    //     } catch (e) {
    //         return apiResponse.ErrorResponse(res, e.message, {});
    //     }
    // }
}