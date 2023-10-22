const multer = require('multer');

module.exports = (upload, field, fieldName) => {

    return (req, res, next) => {

        upload(req, res, function (err) {

            req.multerErrors = [];

            if (err instanceof multer.MulterError) {

                switch (err.code) {
                    case "LIMIT_FILE_SIZE":
                        req.multerErrors.push({ msg: `${fieldName} không được lớn hơn 1 MB`, path: field, });
                        break;
                    case "FILE_EXTENSION_ERROR":
                        req.multerErrors.push({ msg: `${fieldName} phải là file png hoặc jpg`, path: field, });
                        break;
                    default:
                        req.multerErrors.push({ msg: err.message, path: field, });
                }

            } else if (err) {

                return res.status(500).send('Something went wrong, try again');

            }
            else if (req.body.id == '' && req.file == undefined && req.multerErrors.length == 0) {

                req.multerErrors.push({ msg: `${fieldName} không được rỗng`, path: field, });
            }

            next();
        })
    }
}