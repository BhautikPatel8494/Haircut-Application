import { Injectable } from "@nestjs/common";
import { Request, Response } from "express";
import { Twilio } from 'twilio';
import axios from 'axios';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { SosAlarms } from "../schema/sosAlarm.schema";
import { Contacts } from "../schema/contact.schema";
import { CurrentUserDto } from "../authentication/authentication.dto";
import { ApiResponse } from "../utils/apiResponse.service";

@Injectable()
export class SosService {
    constructor(
        @InjectModel('SosAlarm') private readonly sosAlarmModel: Model<SosAlarms>,
        @InjectModel('Contact') private readonly contactModel: Model<Contacts>,
        private readonly apiResponse: ApiResponse
    ) { }

    async createSos(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { lat, lon, acc, stylist } = req.body;

            const responseObj = {
                noonlight: {},
                database: {},
                contacts: {},
                sms: []
            }

            const noonLightResponse = await axios.post(process.env.NOONLIGHT_URL, {
                location: {
                    coordinates: {
                        lat: parseFloat(lat),
                        lng: parseFloat(lon),
                        accuracy: parseFloat(acc)
                    }
                },
                services: {
                    other: true
                },
                name: `${user.firstname} ${user.lastname}`,
                phone: `1${user.phone_number}`
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.NOONLIGHT_SERVER_TOKEN}`
                }
            });

            if (noonLightResponse.data?.id) {
                responseObj.noonlight = { status: "success", message: noonLightResponse.data };

                const createAlarmObj = {
                    user_id: stylist ? stylist : user._id,
                    type: "customer",
                    alarm_id: noonLightResponse.data.id,
                    status: noonLightResponse.data.status,
                    updates: [
                        {
                            responsible: user._id,
                            responsible_type: 'customer',
                            action: 'create',
                            data: {
                                lat: parseInt(lat),
                                lon: parseInt(lon),
                                accuracy: parseInt(acc)
                            }
                        }
                    ]
                };

                await this.sosAlarmModel.create(createAlarmObj);
                responseObj.database = { status: "success", message: "Saved alarm on database" };
            }

            const contactInfo = await this.contactModel.find({ "user_id": stylist ? stylist : user._id, "type": "customer", status: true });

            if (contactInfo.length == 0) {
                responseObj.contacts = { status: "warnings", message: "No emergency contacts set", detail: "" };
            }

            await Promise.all(contactInfo.map(async (contact) => {
                try {
                    let message = `Hi ${contact.name}, our customer ${user.firstname} ${user.middlename} ${user.lastname} has requested...`;
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    await client.messages.create({ body: message, from: process.env.TWILIO_SENDER_ID, to: `+${contact.phone_number}` });
                    responseObj.sms.push({ status: "success", message: "Send message to " + contact.name + " " + contact.phone_number });

                } catch (err) {
                    responseObj.sms.push({ status: "error", message: "Error sending contact message to " + contact.name + " " + contact.phone_number, detail: err });
                }
            }));
            return this.apiResponse.successResponseWithData(res, "SOS request completed", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {})
        }
    }

    async updateSos(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { alarm_id, lat, lon, acc } = req.body;

            const responseObj = {
                noonlight: {},
                database: {},
            };

            const noonLightResponse = await axios.post(process.env.NOONLIGHT_URL + "/" + alarm_id + "/locations", {
                coordinates: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lon),
                    accuracy: parseFloat(acc)
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.NOONLIGHT_SERVER_TOKEN}`
                }
            });

            responseObj.noonlight = { status: "success", message: noonLightResponse.data };

            await this.sosAlarmModel.updateOne({ alarm_id: alarm_id }, {
                $push: {
                    "updates": {
                        "responsible": user._id,
                        "responsible_type": "customer",
                        "action": "update_location",
                        data: {
                            "lat": parseFloat(lat),
                            "lon": parseFloat(lon),
                            "accuracy": parseFloat(acc)
                        }
                    }
                }
            });

            responseObj.database = { status: "success", message: "Saved alarm update on database" };
            return this.apiResponse.successResponseWithData(res, "SOS update completed", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {})
        }
    }

    async endSos(user: CurrentUserDto, req: Request, res: Response) {
        try {
            const { alarm_id } = req.body;

            const responseObj = {
                noonlight: {},
                database: {},
                contacts: {},
                sms: []
            };

            const noonLightResponse = await axios.post(process.env.NOONLIGHT_URL + "/" + alarm_id + "/status", {
                status: 'CANCELED'
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.NOONLIGHT_SERVER_TOKEN}`
                }
            });

            responseObj.noonlight = { status: "success", message: noonLightResponse.data };

            await this.sosAlarmModel.updateOne({ alarm_id: alarm_id }, {
                $set: {
                    status: noonLightResponse.status
                },
                $push: {
                    "updates": {
                        "responsible": user._id,
                        "responsible_type": "customer",
                        "action": "cancel"
                    }
                }
            });

            responseObj.database = { status: "success", message: "Saved alarm end on database" };

            const contactInfo = await this.contactModel.find({ "user_id": req.body.customer ? req.body.customer : user._id, "type": "customer", status: true });
            if (contactInfo.length == 0) {
                responseObj.contacts = { status: "warnings", message: "No emergency contacts set", detail: "" };
            }

            await Promise.all(contactInfo.map(async (contact) => {
                try {
                    let message = `Hi ${contact.name}, our customer ${user.firstname} ${user.middlename}, ${user.lastname} has ended the SOS request...`;
                    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    await client.messages.create({ body: message, from: process.env.TWILIO_SENDER_ID, to: `+${contact.phone_number}` });

                    responseObj.sms.push({ status: "success", message: "Send message to " + contact.name + " " + contact.phone_number });

                } catch (err) {
                    responseObj.sms.push({ status: "error", message: "Error sending contact message to " + contact.name + " " + contact.phone_number, detail: err });
                }
            }));
            return this.apiResponse.successResponseWithData(res, "SOS request ended", responseObj);
        } catch (err) {
            return this.apiResponse.ErrorResponse(res, err.message, {});
        }
    }
}