import { Injectable } from "@nestjs/common";
import * as fs from 'fs'
import * as AWS from 'aws-sdk'
import ffmpeg from 'fluent-ffmpeg'
// import * as FileType from 'file-type'
import stripe from 'stripe'
import { config } from "dotenv";

import { constants } from "./constant";
config();

const stripeData = new stripe(process.env.STRIPE_SANDBOX_KEY, {
    apiVersion: '2020-08-27'
})
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

@Injectable()
export class Utility {

    randomNumber = function (length: number) {
        var text = "";
        var possible = "123456789";
        for (var i = 0; i < length; i++) {
            var sup = Math.floor(Math.random() * possible.length);
            text += i > 0 && sup == i ? "0" : possible.charAt(sup);
        }
        return Number(text);
    };

    calculateAge = function (birthday: string | number | Date) { // birthday is a date
        var ageDifMs = Date.now() - new Date(birthday).getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    getUserType = function (age: number, gender: string) {
        if (age <= constants.KID_AGE)
            return 'kid';
        else if (age > constants.SENIOR_AGE)
            return 'senior';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && gender === 'men')
            return 'men';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && gender === 'women')
            return 'women';
    }

    getUserTypeByRelation = function (age: number, relation: string) {
        if (age <= constants.KID_AGE)
            return 'kid';
        else if (age > constants.SENIOR_AGE)
            return 'senior';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && (relation === 'daughter' || relation === 'wife' || relation === 'mother'))
            return 'women';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && (relation === 'husband' || relation === 'son' || relation === 'father'))
            return 'men';
    }

    uploadFile = (path: string, fileName: string, content_type: string, bucket: string) => {
        return new Promise(function (resolve, reject) {
            const readStream = fs.createReadStream(path + fileName);
            var response = {};
            const params = {
                Bucket: bucket,
                Key: fileName,
                ACL: 'public-read',
                Body: readStream,
                ContentType: content_type
            };

            s3.upload(params, async function (err: any, data: { Location: string; }) {
                readStream.destroy();
                if (err) {
                    response = {
                        message: 'error',
                        data: err
                    }
                }

                if (data) {
                    fs.unlink(path + fileName, function (err) {
                        if (err) {
                            response = {
                                message: 'error',
                                data: err
                            }
                            reject(response);
                        } else {
                            console.log(`File uploaded successfully. ${data.Location}`);
                            response = {
                                message: 'success',
                                data: data.Location
                            }
                            resolve(response);
                        }
                    });
                }
            });
        });
    };

    getS3File = (fileName: string, bucket_name: string) => {
        console.log(fileName, bucket_name)
        return new Promise(function (resolve, reject) {
            var response = {};
            const params = {
                Bucket: bucket_name,
                Key: fileName
            };

            s3.getObject(params, function (err, data) {
                console.log('err', err);
                if (err) {
                    response = {
                        message: 'error',
                        data: err
                    }
                    reject(err)
                }
                if (data) {
                    resolve(data);
                }
            });
        });
    }

    deleteS3File = (fileName: string, bucket_name: string) => {
        return new Promise(function (resolve, reject) {
            const params = {
                Bucket: bucket_name,
                Key: fileName
            };

            s3.deleteObject(params, function (err, data) {
                if (err) {
                    reject(err)
                }
                if (data) {
                    resolve(data)
                }
            });
        });
    };

    createThumbnail = function (file: string, bucket_path: string, bucket: string) {
        let fileName = file.split('.');
        ffmpeg(bucket_path + file)
            .on('filenames', function (filenames) {
                console.log('Will generate ' + filenames.join(', '))
            })
            .on('end', async function (success, error) {

                const readStream = fs.createReadStream('thumbnails/' + fileName[0] + '.png');
                // const fileType = await FileType.fileTypeFromFile('thumbnails/' + fileName[0] + '.png');

                const params = {
                    Bucket: bucket,
                    Key: fileName[0] + '.png',
                    ACL: 'public-read',
                    Body: readStream,
                    // ContentType: fileType.mime
                };

                s3.upload(params, async function (err, data) {
                    readStream.destroy();
                    if (err) {
                        console.log('err', err);
                    }
                    if (data) {
                        console.log('data', data);
                        fs.unlink('thumbnails/' + fileName[0] + '.png', () => { });
                    }
                });
            })
            .screenshots({
                count: 1,
                filename: fileName[0] + '.png',
                folder: 'thumbnails',
                // size: '320x240',
                //size:dimensions.width*dimensions.height
            });
    }

    containsObject = (obj: { start_time: string, end_time: string }, list: [{ start_time: string, end_time: string }]) => {
        for (let i = 0; i < list.length; i++) {
            if (list[i].start_time === obj.start_time || list[i].end_time === obj.end_time) {
                return true;
            }
        }
        return false;
    }

    getMonthName = (month: string) => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[month];
    }

    // getWeeksInMonth = (week) => {
    //     var d = new Date();
    //     var month = d.getMonth();
    //     var year = d.getFullYear();
    //     const weeks = [];
    //     const firstDay = new Date(year, month, 1);
    //     const lastDay = new Date(year, month + 1, 0);
    //     const daysInMonth = lastDay.getDate();
    //     let dayOfWeek = firstDay.getDay();
    //     let start;
    //     let end;

    //     for (let i = 1; i < daysInMonth + 1; i++) {

    //         if (dayOfWeek === 0 || i === 1) {
    //             start = i;
    //         }

    //         if (dayOfWeek === 6 || i === daysInMonth) {

    //             end = i;

    //             if (start !== end) {

    //                 weeks.push({
    //                     start: new Date(year, month, parseInt(start) + 1),
    //                     end: new Date(year, month, parseInt(end) + 1)
    //                 });
    //             }
    //         }

    //         dayOfWeek = new Date(year, month, i).getDay();
    //     }

    //     if (weeks) {
    //         return weeks[week];
    //     }
    // }

    createCharge = async (amount: number, customer_id: string) => {
        // console.log(charge,customer_id);
        //
        // let paymentIntent = await stripe.paymentIntents.create({
        //     amount: charge,
        //     currency: 'usd',
        //     customer: customer_id,
        // });

        let response = await stripeData.charges.create({
            amount: amount,
            currency: 'usd',
            customer: customer_id
        });
        // });
        return response;
    }

}