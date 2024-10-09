// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 1337;
const app = express();

app.use(express.json());
app.use(cors());

const dataRoutes = require('./route/data');

app.use('/data', dataRoutes);

const server = app.listen(port, () => {
    console.log('API running on port ' + port);
});

module.exports = server;
