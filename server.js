const path = require('path')
const http = require('http')
const express = require('express')
const assert = require('assert');
require('dotenv').config()

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

    isConnectedUser(uid){
        return uid in this.UidToSkt
    }
}

const handleLogin = (socket) => {
    socket.on('login', (credentials,ack) => {
        const uid = credentials.user;
        if (cnntnInfo.isConnectedUser(uid)){
            ack('Who are you')
            return
        }
        cnntnInfo.addNewConnectionInfo(socket, uid);        
        console.info(`User ${uid} has connected on socket ${socket.id}.`)
        ack('okay')
    })
}

const handleRetrieveHistory = (socket) => {
    socket.on('get chat history', async (chats, ack) => {
        // TODO: Retrieve chat histories for user
        const uid = cnntnInfo.getUid(socket.id)
        assert.notStrictEqual(uid, null)
        const history = {}
        chats.forEach(async (chat,i) => {
            const criterias = {parties: uid, chat}
            const options = {projection: {_id: 0, parties: 0}, sort: {time: 1}}
            const temp = await storage.retrieveDocuments('messages', criterias, options)
            history[chat] = temp
            if (i == chats.length-1){
                ack(history)
            }
        })
    })
}
const handleRegisterChat = (socket) => {
    socket.on('register chat', (user, chat) => {
        const uid = cnntnInfo.getUid(socket.id)
        if (!(chat in chats)) {
            chats[chat] = {parties: [uid]}
        } else if (chats[chat].parties.length == 1) {
            chats[chat].parties.push(uid)
            const chatRoomInfo = {chat, parties: chats[chat].parties}
            storage.insertDocuments('chats', [chatRoomInfo])
        }
    })
}

const handleMessage = (socket) => {
    socket.on('message', msg => {
        const uid = cnntnInfo.getUid(socket.id)
        msg.origin = uid
        try {
            let temp = msg
            temp.parties = chats[msg.chat].parties
            storage.insertDocuments('messages', [temp])
        } catch (error){
            console.error(error)
        }        
        const parties = chats[msg.chat].parties
        if (parties.length == 2){
            let targetUid = parties[1-parties.findIndex(id => id == uid)]
            let targetSocket = cnntnInfo.getTargetSocket(targetUid)
            if (targetSocket != null){
                targetSocket.emit('message', msg)
            }
        }
    })
}

const handleGetChatRooms = (socket) => {
    socket.on('get chat rooms', async (ack) => {
        const uid = cnntnInfo.getUid(socket.id)
        const criterias = {parties: uid}
        const options = {projection:{_id:0, chat:1}, sort:{chat:1}}
        const chatRooms = await storage.retrieveDocuments('chats', criterias, options)
        ack(chatRooms)
    })
}

const handleUserDisconnection = (socket) => {
    socket.on('disconnect', reason => {
        const uid = cnntnInfo.handleDisconnectionInfo(socket)
        console.info(`User ${uid} has disconnected.`)
        //console.log('connection informations: ', cnntnInfo.getStatus())
    })
}

const registerIOOperations = () => {
    io.on('connection', socket => {
        handleLogin(socket)
        handleMessage(socket)
        handleRegisterChat(socket)
        handleRetrieveHistory(socket)
        handleUserDisconnection(socket)
        handleGetChatRooms(socket)
})}

const initilizeServer = () => {
    cnntnInfo = new ConnectionInformation()
    server.listen(3030, () => console.log('Messaging server running on port 3030'))
    storage.initDbConnection(dbCnntnString, db_name )
    registerIOOperations()
}

const db_url = process.env.DB_URL
const db_user = process.env.DB_USER
const db_pass = process.env.DB_PASS
const db_name = process.env.DB_NAME
const dbCnntnString = db_url.replace('{user}',db_user).replace('{pass}',db_pass)

var cnntnInfo
var chats = {}
initilizeServer()