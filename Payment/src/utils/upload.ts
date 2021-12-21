import { Request } from 'express';
import { diskStorage } from 'multer';

export const storage = {
    storage: diskStorage({
        destination: function (req: Request, file: { originalname: string }, cb: any) {
            return cb(null, "./public/images/", function (err: any, succ: any) {
                if (err)
                    throw err;
            });
        },
        filename: function (req: Request, file: { originalname: string }, cb: any) {
            let name = (Date.now() + Date.now() + file.originalname);
            name = name.replace(/ /g, '-');
            cb(null, name, function (err: any, succ1: any) {
                if (err)
                    throw err
            });
        }
    })
}