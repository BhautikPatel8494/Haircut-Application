import { diskStorage } from "multer";

export const editFileName = (req, file, cb) => {
    var name = (Date.now() + Date.now() + file.originalname);
    name = name.replace(/ /g, '-');
    cb(null, name, function (err, succ1) {
        if (err)
            throw err

    });
};

export const storage = {
    storage: diskStorage({
        destination: '../../public/images',
        filename: editFileName,
    }),
};
