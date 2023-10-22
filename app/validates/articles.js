const { body } = require('express-validator');


module.exports = async (req, res, next) => {
    await body('name')
        .notEmpty().withMessage('Name không được rỗng')
        .run(req);

    await body('slug')
        .notEmpty({ ignore_whitespace: true }).withMessage('Slug không được rỗng')
        .run(req);

    await body('status')
        .notEmpty().withMessage('Status không được rỗng')
        .isIn(['active', 'inactive']).withMessage('Status không hợp lệ')
        .run(req);

    await body('special')
        .notEmpty().withMessage('Special không được rỗng')
        .isIn(['active', 'inactive']).withMessage('Special không hợp lệ')
        .run(req);

    await body('category_id')
        .notEmpty().withMessage('Category không được rỗng')
        .run(req);

    await body('content')
        .notEmpty().withMessage('Content không được rỗng')
        .run(req);

    next();
}
