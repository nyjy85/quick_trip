var router = require('express').Router();
var path = require('path');

router.use('/modules', require('./modules'));
router.use('/home', require('./home'));

module.exports = router;