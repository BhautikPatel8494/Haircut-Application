import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as AWS from "aws-sdk";

import { KID_AGE, SENIOR_AGE } from "./constant";

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

@Injectable()
export class UtilityService {
    
    getUserType(age, gender) {
        if (age <= KID_AGE)
            return 'kid';
        else if (age > SENIOR_AGE)
            return 'senior';
        else if ((age > KID_AGE && age <= SENIOR_AGE) && gender === 'men')
            return 'men';
        else if ((age > KID_AGE && age <= SENIOR_AGE) && gender === 'women')
            return 'women';
    }

    calculateAge(birthday) {
        var ageDifMs = Date.now() - new Date(birthday).getTime();
        var ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    generateOTP() {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    }

    uploadFile(path, fileName, content_type, bucket) {

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

}