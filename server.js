const app = require("express")()
const Msg = require("./models/messages")
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'jhskhqki834jhkndjaswd'

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const User = require('./models/user')

//database connection
mongoose.connect('mongodb+srv://admin:admin@chatbot.kvjz8.mongodb.net/message?retryWrites=true&w=majority').then(() => {
    console.log('...................Database connected..............')
}).catch(err => console.log(err));


const http = require('http').createServer(app)
const cors = require('cors');
const PORT = 5000


//Creating server side socket
const io = require('socket.io')(http)

app.use(cors())

//Index.html request
app.get("/index.html", (req, res) =>
    res.sendFile(__dirname + "/index.html"))



app.get("/userLogIn/login.html", (req, res) =>
    res.sendFile(__dirname + "/userLogin/login.html"))



app.get("/userLogIn/signUp.html", (req, res) =>
    res.sendFile(__dirname + "/userLogin/signUp.html"))


//Default
app.get("/", (req, res) => {
    res.send("<h1>Welcome To ChatBot")
})



//Register new users
app.post('/api/register', async (req, res) => {
    console.log(req.body)

    const { username, firstname, lastname, password: plainTextPassword } = req.body

    const password = await bcrypt.hash(plainTextPassword, 10)

    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', error: 'Invalid username' })
    }

    if (!firstname || typeof firstname !== 'string') {
        return res.json({ status: 'error', error: 'Invalid firstname' })
    }

    if (!lastname || typeof lastname !== 'string') {
        return res.json({ status: 'error', error: 'Invalid lastname' })
    }

    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({ status: 'error', error: 'Invalid password' })
    }

    try {

        const response = await User.create({
            username,
            firstname,
            lastname,
            password
        })
        console.log('User created successfully: ', response)

    } catch (error) {
        if (error.code === 11000) {
            return res.json({ status: 'error', error: "Username already in use" })
        }
        throw error;
    }

    res.json({ status: 'ok' })
})

//Login
app.post('/api/login', async (req, res) => {

    const { username, password } = req.body

    const user = await User.findOne({ username }).lean()


    if (!user) {
        return res.json({ status: 'error', error: "Invalid Username/Password" })
    } if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
            {
            id: user._id,
            username: user.username
            },
            JWT_SECRET
        )

        return res.json({ status: 'ok', data: token })
    }
    res.json({ status: 'error', error: "Invalid Username/Password" })


})

//New connection request
io.on("connection", (socket) => {
    console.log('Connection Created....')
    // console.log(socket.id)

    socket.emit('sendSocket', socket.id)

    socket.emit('welcome', `Welcome to Chatbot. Your id is ${socket.id}`)

    // socket.on('message', (data) => {
    //     console.log(data)

    //     //current client
    //     //socket.emit('newMessage',data)


    //     //send to all the clients
    //     const msg = {
    //         sender: socket.id,
    //         message: data
    //     }
    //     // io.sockets.emit('newMessage',msg)

    //     socket.broadcast.emit('newMessage', msg)
    // })

    //join group
    socket.on('join', (roomName) => {


        socket.join(roomName)
        const msg = {
            sender: socket.id,
            message: ' joined the group!'
        }
        socket.emit('newMessage', msg)
        socket.broadcast.to(roomName).emit('newMessage', msg)

        Msg.find({ room: roomName }, function (err, docs) {
            if (err) {
                throw err;
            } socket.emit('load old messages', docs)
        })
    })

    //send message to group
    socket.on('room_message', (data) => {

        const msg = {
            sender: socket.id,
            message: data.message
        }

        const newMsg = new Msg({
            from: socket.id,
            room: data.room,
            message: data.message
        })
        newMsg.save(function (err) {
            if (err) {
                throw err;
            }
            socket.emit('newMessage', msg)
            socket.broadcast.to(data.room).emit('newMessage', msg)
        })

    })

     //disconnect user
     socket.on('disconnect', () => {
        console.log(`${socket.id} Client Disconnect....`)
    })

})

//HTTP server started
http.listen(PORT, () => {
    console.log(`Server successfully running at ${PORT}`)
})