// App

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const port = process.env.PORT || 1337;
const app = express();
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cors());

const documentRoute = require('./route/documents');
const authRoute = require('./route/auth');

app.use('/documents', documentRoute);
app.use('/', authRoute);

// const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33A1', '#A133FF'];
// const roomUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.log('token not found');
    }

    jwt.verify(token, jwtSecret, (err, decode) => {
        if (err) {
            console.log('token not accepted');
        }

        socket.user = decode;
        next();
    })
})

io.on('connection', (socket) => {
    console.log('user connected:', socket.user.email);

    socket.on('create', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('updateDoc', (data) => {
        const { roomId, field, value } = data;

        socket.to(roomId).emit('docUpdate', { field, value });
        console.log(data)
    });
});

server.listen(port, () => {
    console.log('API running on port ' + port);
});

module.exports = server;
