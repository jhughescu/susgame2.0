const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;


const testController = require('./controllers/testController');

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
