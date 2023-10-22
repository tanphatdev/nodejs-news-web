const { body } = require('express-validator');


module.exports = async (req, res, next) => {
    await body('name')
        .notEmpty({ ignore_whitespace: true }).withMessage('Name không được rỗng')
        .run(req);

    await body('status')
        .notEmpty({ ignore_whitespace: true }).withMessage('Status không được rỗng')
        .isIn(['active', 'inactive']).withMessage('Status không hợp lệ')
        .run(req);

    await body('group_acp')
        .notEmpty({ ignore_whitespace: true }).withMessage('Group ACP không được rỗng')
        .run(req);

    next();
}
