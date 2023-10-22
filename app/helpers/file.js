const multer = require('multer');
const path = require('path');
const randomstring = require("randomstring");
const fs = require('fs');

module.exports = {
    upload: (field, folderDes = 'users', fileNameLength = 10, fileSizeMb = 1, fileExtension = 'jpeg|jpg|png') => {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, __path_uploads + folderDes + '/');
            },
            filename: (req, file, cb) => {
                cb(null, randomstring.generate(fileNameLength) + path.extname(file.originalname));
            }
        })

        const fileFilter = (req, file, cb) => {
            const filetypes = new RegExp(fileExtension);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);

            if (extname && mimetype) {
                return cb(null, true);
            } else {
                return cb(new multer.MulterError("FILE_EXTENSION_ERROR"));
            }
        }

        const upload = multer({
            storage: storage,
            fileFilter: fileFilter,
            limits: {
                fileSize: fileSizeMb * 1024 * 1024,
            },
        }).single(field);

        return upload;
    },
    remove: (folder, fileName) => {
        if (fileName) {
            let path = folder + fileName;

            if (fs.existsSync(path)) {
                fs.unlink(path, (err) => {
                    if (err) console.log(err);
                });
            }
        }
    },
}