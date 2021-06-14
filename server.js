const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const botName = 'Vox Hailer';


//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //welcome user
        socket.emit('message', formatMessage(botName, 'Welcome to the Vox!'));

        //message when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the vox`));

        //send users and room info

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //listen for chat message
    socket.on('chatMessage', (msg) => {

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //message when user disconnects
    socket.on('disconnect', () => {
        const user = userLeaves(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the Vox`));

            //send users and room info

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running or port ${PORT}`));