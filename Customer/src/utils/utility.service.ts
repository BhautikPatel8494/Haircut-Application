import { Injectable } from "@nestjs/common";

import * as fs from 'fs'
import * as AWS from 'aws-sdk'
import jwt from "jsonwebtoken"
import ffmpeg from 'fluent-ffmpeg'
import * as FileType from 'file-type'
import stripe from 'stripe'
import { config } from "dotenv";
import { constants } from "./constant";
config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

@Injectable()
export class Utility {

    randomNumber = function (length) {
        var text = "";
        var possible = "123456789";
        for (var i = 0; i < length; i++) {
            var sup = Math.floor(Math.random() * possible.length);
            text += i > 0 && sup == i ? "0" : possible.charAt(sup);
        }
        return Number(text);
    };

    calculateAge = function (birthday) { // birthday is a date
        var ageDifMs = Date.now() - new Date(birthday).getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    getUserType = function (age, gender) {
        if (age <= constants.KID_AGE)
            return 'kid';
        else if (age > constants.SENIOR_AGE)
            return 'senior';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && gender === 'men')
            return 'men';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && gender === 'women')
            return 'women';
    }

    getUserTypeByRelation = function (age, relation) {

        console.log('relation', relation);
        if (age <= constants.KID_AGE)
            return 'kid';
        else if (age > constants.SENIOR_AGE)
            return 'senior';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && (relation === 'daughter' || relation === 'wife' || relation === 'mother'))
            return 'women';
        else if ((age > constants.KID_AGE && age <= constants.SENIOR_AGE) && (relation === 'husband' || relation === 'son' || relation === 'father'))
            return 'men';
    }

    uploadFile = (path, fileName, content_type, bucket) => {

        return new Promise(function (resolve, reject) {
            // Read content from the file
            //const fileContent = fs.readFileSync(path+fileName);     
            const readStream = fs.createReadStream(path + fileName);
            // Setting up S3 upload parameters       
            // Uploading files to the bucket
            var response = {};
            const params = {
                Bucket: bucket,
                Key: fileName,
                ACL: 'public-read',
                Body: readStream,
                ContentType: content_type
            };

            s3.upload(params, async function (err, data) {
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


    deleteS3File = (fileName, bucket_name) => {

        return new Promise(function (resolve, reject) {
            var response = {};
            const params = {
                Bucket: bucket_name,
                Key: fileName
            };

            s3.deleteObject(params, function (err, data) {
                console.log('err', err);
                if (err) {
                    response = {
                        message: 'error',
                        data: err
                    }
                }
                if (data) {
                    console.log('data', data);
                }
            });
        });
    };

    createThumbnail = function (file, bucket_path, bucket) {
        var fileName = file.split('.');
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
                        //console.log('err',err);
                    }
                    if (data) {
                        //console.log('data', data);
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

    containsObject = (obj, list) => {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].start_time === obj.start_time || list[i].end_time === obj.end_time) {
                return true;
            }
        }

        return false;
    }

    verifyUser = (token) => {
        return new Promise(function (resolve, reject) {
            jwt.verify(token, process.env.JWT_SECRET, { complete: true, audience: process.env.JWT_AUDIENCE }, function (err, token_data) {
                if (err) {
                    reject(err);
                }
                if (token_data) {
                    resolve(token_data);
                }
            });
        });
    }

    getMonthName = (month) => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[month];
    }

    getWeeksInMonth = (week) => {

        var d = new Date();
        var month = d.getMonth();
        var year = d.getFullYear();
        const weeks = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        let dayOfWeek = firstDay.getDay();
        let start;
        let end;

        for (let i = 1; i < daysInMonth + 1; i++) {

            if (dayOfWeek === 0 || i === 1) {
                start = i;
            }

            if (dayOfWeek === 6 || i === daysInMonth) {

                end = i;

                if (start !== end) {

                    weeks.push({
                        start: new Date(year, month, parseInt(start) + 1),
                        end: new Date(year, month, parseInt(end) + 1)
                    });
                }
            }

            dayOfWeek = new Date(year, month, i).getDay();
        }

        if (weeks) {
            return weeks[week];
        }
    }
    createCharge = async (charge, customer_id) => {
        // console.log(charge,customer_id);
        //
        // let paymentIntent = await stripe.paymentIntents.create({
        //     amount: charge,
        //     currency: 'usd',
        //     customer: customer_id,
        // });

        // let response = await stripe.charges.create({
        const responseObj = {
            amount: 500,
            currency: 'usd',
            customer: `${Date.now()}customer_id`
        }
        // });
        return responseObj;
    }

}