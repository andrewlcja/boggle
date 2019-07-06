// custom modules
const api = require('./api');

// node modules
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// route all api calls to this folder
app.use('/', api);

// start express server
app.listen(port, () => console.log(`Boggle app listening on port ${port}!`));