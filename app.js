// App
const Document = require('./models/documents');
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
const roomUsers = {};

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
    // console.log('user connected:', socket.user.email);

    socket.on('join-room', ({ roomId }) => {
        const username = socket.user.email;
        // console.log("Socket connection Start");
        socket.join(roomId);
        // console.log(`SocketId ${socket.id}, RoomId: ${roomId}, user: ${username}`);

        if (!roomUsers[roomId]) {
            // console.log(`creating roomUsers for ${roomId}`);
            roomUsers[roomId] = [];
        }

        const userExists = roomUsers[roomId].find(user => user.username === username);
        if (!userExists) {
            // console.log(`adding ${username} to ${roomId}`);
            roomUsers[roomId].push({id: socket.id, username});
            socket.broadcast.to(roomId).emit('user-joined', username);
            // console.log(`notfied other about ${roomId} and ${username}`)
        } else {
            console.log(`${username} already in ${roomId}`);
        }

        io.in(roomId).emit('connected-users', roomUsers[roomId].map(user => user.username))
        // console.log(`Updated users in room ${roomId}:`, JSON.stringify(roomUsers[roomId]));
    });

    socket.on('updateDoc', async (data) => {
        const { roomId, field, value } = data;
        const username = socket.user.email;
        const documentId = roomId;
        try {
            await Document.update(documentId, { [field]: value }, username)
            
            socket.to(roomId).emit('docUpdate', { field, value });
            // console.log(`Updated field ${field} with value ${value} in document ${documentId}`);
        } catch (error){
            console.error(`Failed to update document: ${error.message}`);
        }
    });

    socket.on('leave-room', ({ roomId }) => {
        const username = socket.user.email;
        // console.log(`${username} is leaving the room`);

        roomUsers[roomId] = roomUsers[roomId].filter(user => user.username !== username)

        io.in(roomId).emit('connected-users', roomUsers[roomId].map(user => user.username))
        // console.log(`${username} left ${roomId}:`, JSON.stringify(roomUsers[roomId]));

        if (roomUsers[roomId].length === 0) {
            delete roomUsers[roomId];
        }
    }) 
});

server.listen(port, () => {
    console.log('API running on port ' + port);
});

module.exports = server;
