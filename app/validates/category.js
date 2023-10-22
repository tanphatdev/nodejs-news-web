const { body } = require('express-validator');

module.exports = async (req, res, next) => {
    await body('name')
        .notEmpty({ ignore_whitespace: true }).withMessage('Name không được rỗng')
        .run(req);

    await body('slug')
        .notEmpty({ ignore_whitespace: true }).withMessage('Slug không được rỗng')
        .run(req);

    await body('ordering')
        .notEmpty({ ignore_whitespace: true }).withMessage('Ordering không được rỗng')
        .isNumeric().withMessage('Ordering phải là một số')
        .isInt().withMessage('Ordering phải là một số nguyên')
        .isInt({ gt: 0 }).withMessage('Ordering phải là một số nguyên lớn hơn 0')
        .run(req);

    await body('status')
        .notEmpty({ ignore_whitespace: true }).withMessage('Status không được rỗng')
        .isIn(['active', 'inactive']).withMessage('Status không hợp lệ')
        .run(req);

    next();
}
