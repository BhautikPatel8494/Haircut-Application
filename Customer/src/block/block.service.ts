import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model, Types } from "mongoose";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { Users } from "../schema/user.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { BlockStylistRemoveDto, BlockUnblockStylistDto, CreateBlockStylistDto } from "./block.dto";

@Injectable()
export class BlockService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<Users>,
        private readonly apiResponse: ApiResponse
    ) { }

    async blockStylist(user: CurrentUserDto, blockStylistBody: CreateBlockStylistDto, res: Response) {
        try {
            const { stylist_id, name, image, block_status, experience } = blockStylistBody;

            const userInfo = await this.userModel.aggregate([
                { $match: { _id: new Types.ObjectId(user._id) } },
                {
                    $addFields: {
                        stylist_id: { $convert: { input: new Types.ObjectId(stylist_id), to: "objectId" } },
                    }
                },
                {
                    $project: {
                        stylist: {
                            $filter: {
                                input: "$blocked_stylist",
                                as: "stylist",
                                cond: { $eq: ["$$stylist.stylist_id", "$stylist_id"] }
                            }
                        }
                    }
                }
            ])

            if (userInfo.length > 0 && userInfo[0].stylist.length > 0) {
                return this.apiResponse.ErrorResponseWithoutData(res, "This record is already added!");
            }

            const updateObj = {
                _id: new Types.ObjectId(),
                stylist_id: stylist_id,
                name: name,
                image: image,
                block_status: block_status,
                experience: experience
            }
            await this.userModel.updateOne({ _id: user._id }, { $push: { blocked_stylist: updateObj } });
            return this.apiResponse.successResponseWithData(res, "Record updated!", updateObj);
        } catch (e) {
            return this.apiResponse.ErrorResponseWithoutData(res, e.message);
        }
    }

    async listBlockStylist(user: CurrentUserDto, filterBody: Request, res: Response) {
        try {
            const { page, limit }: any = filterBody.query;

            const pages = parseInt(page) ? parseInt(page) : 1
            const limits = limit ? parseInt(limit) : 10
            const skip = (limits * pages) - limits;

            const userInfo = await this.userModel.findOne({ _id: user._id }, { blocked_stylist: 1, _id: 0 }).skip(skip).limit(limits);
            if (userInfo) {
                return this.apiResponse.successResponseWithData(res, "Record found!", userInfo.blocked_stylist);
            } else if (userInfo.blocked_stylist.length < 1) {
                return this.apiResponse.ErrorResponseWithoutData(res, "This user is not present");
            } else {
                return this.apiResponse.ErrorResponseWithoutData(res, "No record found!");
            }

        } catch (e) {
            return this.apiResponse.ErrorResponseWithoutData(res, e.message);
        }
    }


    async blockUnlockStylist(user: CurrentUserDto, blockStylistBody: BlockUnblockStylistDto, res: Response) {
        try {
            const { item_id, status } = blockStylistBody;

            const userInfo = await this.userModel.aggregate([
                { $match: { _id: new Types.ObjectId(user._id) } },
                {
                    $addFields: {
                        item_id: { $convert: { input: item_id, to: "objectId" } },
                    }
                },
                {
                    $project: {
                        stylist: {
                            $filter: {
                                input: "$blocked_stylist",
                                as: "stylist",
                                cond: { $eq: ["$$stylist._id", "$item_id"] }
                            }
                        }
                    }
                }
            ])

            if (userInfo.length < 0 && userInfo[0].stylist) {
                return this.apiResponse.successResponseWithNoData(res, "This item id is not valid")
            }

            await this.userModel.updateOne(
                { _id: user._id },
                { $set: { "blocked_stylist.$[inner].block_status": status } },
                { "arrayFilters": [{ "inner._id": item_id }] }
            );
            return this.apiResponse.successResponseWithNoData(res, 'Record updated!')
        } catch (e) {
            return this.apiResponse.ErrorResponseWithoutData(res, e.message);
        }
    }

    async removeFromBlockedList(user: CurrentUserDto, blockStylistBody: BlockStylistRemoveDto, res: Response) {
        try {
            const { stylist_id } = blockStylistBody;

            const userInfo = await this.userModel.aggregate([
                { $match: { _id: new Types.ObjectId(user._id) } },
                {
                    $addFields: {
                        stylist_id: { $convert: { input: stylist_id, to: "objectId" } },
                    }
                },
                {
                    $project: {
                        stylist: {
                            $filter: {
                                input: "$blocked_stylist",
                                as: "stylist",
                                cond: { $eq: ["$$stylist.stylist_id", "$stylist_id"] }
                            }
                        }
                    }
                }
            ])
            if (userInfo.length < 0 && !userInfo[0].stylist) {
                return this.apiResponse.ErrorResponseWithoutData(res, "This item id is not valid");
            }

            await this.userModel.updateOne({ _id: user._id }, { $pull: { "blocked_stylist": { "stylist_id": stylist_id } } });
            return this.apiResponse.successResponseWithNoData(res, 'Record updated!')
        } catch (e) {
            return this.apiResponse.ErrorResponseWithoutData(res, e.message);
        }
    }
}