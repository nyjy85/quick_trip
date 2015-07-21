var router = require('express').Router();
var path = require('path');

router.use('/home', require('./home'));

module.exports = router;