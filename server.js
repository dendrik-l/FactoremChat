const path = require('path')
const http = require('http')
const express = require('express')
const authenticateJwt = require('./Authentication')
const storage = require('./storage')

const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)

class ConnectionInformation {
    UidToSkt = {}
    SidToUid = {}

    constructor(){}

    addNewConnectionInfo(socket, uid){
        this.UidToSkt[uid] = socket
        this.SidToUid[socket.id] = uid
        return [socket.id, uid]
    }
    
    getTargetSocket(targetUid){
        return this.UidToSkt[targetUid]
    }

    handleDisconnectionInfo(socket){
        const sid = socket.id        
        const uid = this.SidToUid[sid]
        delete this.UidToSkt[uid]
        delete this.SidToUid[sid]
        return uid
    }

    getUid(sid){
        return this.SidToUid[sid]
    }

    getStatus(){
        return [this.UidToSkt,this.SidToUid]
    }
}

const cnntnInfo = new ConnectionInformation()

app.use(express.static(path.join(__dirname,'public')))

server.listen(3030, () => console.log('Messaging server running on port 3030'))

storage.initDbConnection()


io.on('connection', socket => {
    console.log('User connected')

    socket.on('login', credentials => {
        const uid = credentials.user;
        cnntnInfo.addNewConnectionInfo(socket, uid);        
        console.info(`User ${uid} has connected on socket ${socket.id}.`)
        //console.log('connection informations: ', cnntnInfo.getStatus())
    })

    /*
    socket.on('authenticate', jwt => {
        if (!authenticateJwt(jwt)){
            // connection is unidentified. Close the connection.
            socket.disconnect()
            return
        }
        const uid = extractUid(jwt)
        cnntnInfo.addNewConnectionInfo(socket,uid)
        console.info(`User ${uid} has connected on socket ${socket.id}.`)
    })
    */

    socket.on('chat history', () => {
        // TODO: Retrieve chat histories for user
        //socket.emit('chat history', getChatHistory(1))
    })

    socket.on('register chat', (user, chat) => {
        const uid = cnntnInfo.getUid(socket.id)
        if (!(chat in chats)) {
            chats[chat] = {parties: [uid], messages: []}
        } else if (chats[chat].parties.length == 1) {
            chats[chat].parties.push(uid)
        }
        //console.log(uid, chat)
        //console.log(chats)
    })

    socket.on('message', (msg,ack) => {
        const uid = cnntnInfo.getUid(socket.id)
        msg.origin = uid
        //console.log(msg)
        //console.log(chats)
        const parties = chats[msg.chat].parties
        if (parties.length == 2){
            let targetUid = parties[1-parties.findIndex(id => id == uid)]
            let targetSocket = cnntnInfo.getTargetSocket(targetUid)
            if (targetSocket != null){
                //console.log(`from ${uid} to ${targetUid} for chat ${msg.chat}`)
                targetSocket.emit('message', msg)
            }
        }
        chats[msg.chat].messages.push(msg)
        ack()
    })

    /*
    socket.on('message', msg => {
        console.log(msg)
        // TODO: get target uid from quotation id in the message
        const targetUid = getTargetUid(msg)
        const targetSocket = cnntnInfo.getTargetSocket(targetUid)
        if (targetSocket != null){
            targetSocket.emit('message', msg)
        }
        // TODO: store to mongodb
        db.store(msg)
    })
    */

    socket.on('disconnect', reason => {
        const uid = cnntnInfo.handleDisconnectionInfo(socket)
        console.info(`User ${uid} has disconnected.`)
        //console.log('connection informations: ', cnntnInfo.getStatus())
    })

})

// Temp for dev only
const chats = {}