const { body } = require('express-validator');

const UsersModel = require(__path_models + 'users')

let isUsernameExist = async (username) => {
    try {
        let user = await UsersModel.getItemByUsername(username);
        if (!user) return Promise.resolve();
        else return Promise.reject();
    } catch (err) {
        console.log(err);
        return Promise.reject();
    }
}

module.exports = {
    saveValidate: async (req, res, next) => {
        await body('fullname')
            .notEmpty({ ignore_whitespace: true }).withMessage('Fullname không được rỗng')
            .run(req);

        await body('username')
            .notEmpty({ ignore_whitespace: true }).withMessage('Username không được rỗng')
            .custom(isUsernameExist).withMessage('Username đã tồn tại')
            .run(req);

        if (!req.body.id) {
            await body('password')
                .notEmpty({ ignore_whitespace: true }).withMessage('Password không được rỗng')
                .isLength({ min: 8, max: undefined }).withMessage('Password phải có ít nhất 8 ký tự')
                .run(req);
        }

        await body('phone')
            .notEmpty({ ignore_whitespace: true }).withMessage('Phone không được rỗng')
            .isNumeric().withMessage('Phone phải là số')
            .isInt().withMessage('Phone phải là số')
            .isLength({ min: 10, max: 10 }).withMessage('Phone phải có 10 chữ số')
            .run(req);

        await body('status')
            .notEmpty({ ignore_whitespace: true }).withMessage('Status không được rỗng')
            .isIn(['active', 'inactive']).withMessage('Status không hợp lệ')
            .run(req);

        await body('group_id')
            .notEmpty({ ignore_whitespace: true }).withMessage('Group không được rỗng')
            .run(req);

        next();
    },
    changeProfileValidate: async (req, res, next) => {
        await body('fullname')
            .notEmpty({ ignore_whitespace: true }).withMessage('Fullname không được rỗng')
            .run(req);

        await body('phone')
            .notEmpty({ ignore_whitespace: true }).withMessage('Phone không được rỗng')
            .isNumeric().withMessage('Phone phải là số')
            .isInt().withMessage('Phone phải là số')
            .isLength({ min: 10, max: 10 }).withMessage('Phone phải có 10 chữ số')
            .run(req);

        next();
    },
    changePasswordValidate: async (req, res, next) => {
        await body('old_password')
            .custom(old_password => old_password == req.body.conform_password).withMessage('Confirm Password không chính xác')
            .custom(async (old_password) => {
                try {
                    if (await UsersModel.checkPassword(req.user.id, old_password)) return Promise.resolve();
                    else return Promise.reject();
                } catch (err) {
                    console.log(err);
                    return Promise.reject();
                }
            }).withMessage('Old Password không chính xác')
            .run(req);

        await body('new_password')
            .notEmpty({ ignore_whitespace: true }).withMessage('Password không được rỗng')
            .isLength({ min: 8, max: undefined }).withMessage('Password phải có ít nhất 8 ký tự')
            .run(req);

        next();
    },
}
