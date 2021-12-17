import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response } from "express";
import { Model } from "mongoose";

import { Contact } from "../schema/contact.schema";
import { ApiResponse } from "../utils/apiResponse.service";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { CreateContactDto, DeleteContact } from "./contact.dto";

@Injectable()
export class ContactService {
    constructor(
        @InjectModel('Contact') private readonly contactModel: Model<Contact>,
        private readonly apiResponse: ApiResponse
    ) { }

    async createContact(user: CurrentUserDto, contactBody: CreateContactDto, res: Response) {
        try {
            const { name, phone_number } = contactBody;

            const contactInfo = await this.contactModel.find({});

            const namesInfo = contactInfo.map(obj => {
                return obj['name']
            });

            const phoneNumberInfo = contactInfo.map(obj => {
                return obj['phone_number']
            });

            if (phoneNumberInfo.indexOf(phone_number) >= 0 && namesInfo.indexOf(name) >= 0) {
                return this.apiResponse.ErrorResponseWithoutData(res, 'This name and mobile number is already entered!');
            }

            const createObj = {
                user_id: user._id,
                name: name,
                phone_number: phone_number
            }

            const contactResponse = await this.contactModel.create(createObj);
            return this.apiResponse.successResponseWithData(res, 'Record created!', contactResponse);
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }


    async listContacts(user: CurrentUserDto, res: Response) {
        try {
            const contactInfo = await this.contactModel.find({ user_id: user._id });
            if (contactInfo.length > 0) {
                return this.apiResponse.successResponseWithData(res, 'Record found!', contactInfo);
            } else {
                return this.apiResponse.ErrorResponse(res, 'Record found!', []);
            }
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {});
        }
    }

    async deleteContact(contactBody: DeleteContact, res: Response) {
        try {
            await this.contactModel.deleteOne({ _id: contactBody.contact_id });
            return this.apiResponse.successResponseWithNoData(res, 'Contact deleted!');
        } catch (e) {
            return this.apiResponse.ErrorResponse(res, e.message, {})
        }
    }
}