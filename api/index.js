// node modules
const express = require("express");
const router = express.Router();
const controller = require('./controller');

// routes request to respective controller method
router.post('/games', controller.createGame);

router.put('/games/:id', controller.updateGame);

router.get('/games/:id', controller.getGame)

module.exports = router;