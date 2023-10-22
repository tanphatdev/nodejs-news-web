var express = require('express');
var router = express.Router();

const systemConfig = require(__path_configs + 'system');
const auth = require(__path_configs + 'auth');

router.use('/auth', require('./auth'));
router.use('/category', auth(), require('./category'));
router.use('/articles', auth(), require('./articles'));
router.use('/groups', auth({ onlyAdmin: true }), require('./groups'));
router.use('/users', auth({ onlyAdmin: true }), require('./users'));
router.use('/', auth(), require('./site'));

module.exports = router;
