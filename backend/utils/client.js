var restify = require('../node_modules/restify-clients');
const logger= require('./../config/winston');
require('dotenv').config()
var client = restify.createJsonClient({    
    url: process.env.EVENT_SERVICE_API_URL
    //url: 'http://localhost:2001'
});
module.exports = client