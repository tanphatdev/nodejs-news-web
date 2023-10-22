var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/category', require('./category'));
router.use('/article', require('./article'));

module.exports = router;
