const { body } = require('express-validator');

module.exports = {
    validateItem: async (req, res, next) => {
        await body('name')
            .notEmpty().withMessage('Name không được rỗng')
            .run(req);

        await body('ordering')
            .notEmpty().withMessage('Ordering không được rỗng')
            .isNumeric().withMessage('Ordering phải là một số')
            .isInt().withMessage('Ordering phải là một số nguyên')
            .isInt({ gt: 0 }).withMessage('Ordering phải là một số nguyên lớn hơn 0')
            .run(req);

        await body('status')
            .notEmpty().withMessage('Status không được rỗng')
            .isIn(['active', 'inactive']).withMessage('Status không hợp lệ')
            .run(req);

        await body('content')
            .notEmpty().withMessage('Content không được rỗng')
            .run(req);

        next();
    }
}
