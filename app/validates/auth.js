const { body } = require('express-validator');


module.exports = async (req, res, next) => {

    await body('username')
        .notEmpty({ ignore_whitespace: true }).withMessage('Email không được rỗng')
        .run(req);

    await body('password')
        .notEmpty({ ignore_whitespace: true }).withMessage('Password không được rỗng')
        .run(req);

    next();
}
