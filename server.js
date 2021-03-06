require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const cors = require('cors')
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    }
});
app.use(cors());

app.get('/', (req, res) => {
    res.send('serverRunning...')
})
const users = {};
const socketToRoom = {};


io.on('connection', socket => {

    socket.on("join room", roomID => {
        socket.join(roomID)
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);


        socket.emit("all users", usersInThisRoom);

        // socket.on('startShare', () => {
        //     socket.emit("all myUsers", users);

        // })

        socket.on("sending signal", payload => {
            io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
        });
        
        socket.on("returning signal", payload => {
            io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });

        socket.on('disconnect', () => {
            // console.log('socket.id', socket.id);
            const roomID = socketToRoom[socket.id];
            let room = users[roomID];
            if (room) {
                room = room.filter(id => id !== socket.id);
                users[roomID] = room;
            }
            socket.broadcast.emit('userLeft', socket.id)
        });


        socket.on('amountOnClick', (myid) => {
            console.log(myid);
            const roomID = socketToRoom[myid];
            let room = users[roomID];
            if (room) {
                room = room.filter(id => id !== myid);
                users[roomID] = room;
            }
            socket.emit('userLeft', myid)
        });

        socket.on('close', (myid) => {
            
            const roomID = socketToRoom[myid];
            let room = users[roomID];
            if (room) {
                room = room.filter(id => id !== myid);
                users[roomID] = room;
            }
            socket.broadcast.emit('userLeft', myid)
        });



    })

    socket.on('chatRoom', roomID => {
        socket.join(roomID);
        socket.emit('userId-Joined');
        socket.on('message', ({ name, message }) => {
            console.log(message);
            io.to(roomID).emit('message', { name, message })
        })
    })

});

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));


