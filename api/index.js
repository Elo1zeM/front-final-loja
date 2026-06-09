const dotenv = require('dotenv');
dotenv.config();
const serverless = require('serverless-http');
const app = require('../app');

module.exports = serverless(app);
