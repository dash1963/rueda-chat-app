const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateLocationMessage, generateMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const http = require('http')
const path = require('path')
const app     = express()
const server = http.createServer(app)
const io = socketio(server)

const clog = console.log

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static( publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('join', (options, callback ) => {
        const { error, user } = addUser({id: socket.id, ...options})

        if (error) {
           return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin - Serginho','Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin - Serginho',`${user.username} has entered the room!!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });


        callback()

        // socket.emit,  io.emit,     socket.broadcast.emit
        //               io.to.emit,  socket.broadcast.to.emit

    });

    socket.on('sendMessage', (message, callback) => {
       const filter = new Filter()
       if ( filter.isProfane(message) ) {
           return callback('Profanity is not allowed')
       }
       const user = getUser(socket.id)
       io.to(user.room).emit('message', generateMessage(user.username, message))
       callback()
    });

    socket.on('shareLocation', (coords, callback) => { 
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message', generateMessage('admin - Serginho',`${user.username} has left the bulding!!!`))
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
})



server.listen(port, () => {
    clog(`Server runing on port${port}`)
})