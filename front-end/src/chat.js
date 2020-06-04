import React from 'react';
import io from 'socket.io-client';
import ReactFileReader from 'react-file-reader';
const filesize = require('file-size');


class Chat extends React.Component{

    constructor(props){
        super(props);
        this.state = {user: null, loggedIn: false, activeChats: [], messages: {}, currentChat: null};
        this.handleLogin = this.handleLogin.bind(this);
        this.handleNewChat = this.handleNewChat.bind(this);        
        this.handleChatSelection = this.handleChatSelection.bind(this);
        this.handleNewMessage = this.handleNewMessage.bind(this);
    }

    initState() {
        this.setState({user: null, loggedIn: false, activeChats: [], messages: {}, currentChat: null}, () => {
            console.log('State initialized')
        })
    }

    componentDidMount(){
        this.socket = io();
        this.socket.on('message', msg => {
            //console.log(msg)
            // message conversion
            const messages = this.state.messages
            messages[msg.chat].push(msg)
            //console.log(messages)
            this.setState({messages}, () => {
                //console.log(this.state)
            })
        })
        this.socket.on('disconnect', reason => {
            this.initState()
            alert('connection lost, login again!')
        })
    }

    handleLogin(user) {
        this.socket.emit('login',{user}, res => {
            if (res === 'okay'){
                this.setState({loggedIn: !this.state.loggedIn, user})
                console.log(this.state)
                let activeChats, messages
                let currentChat = null
                this.socket.emit('get chat rooms', rooms => {
                    activeChats = rooms.map(element => element.chat)
                    if (!(activeChats.length === 0)) {
                        currentChat = activeChats[0]
                    }
                    this.socket.emit('get chat history', activeChats, history => {
                        messages = history
                        console.log(messages, history)
                        this.setState({activeChats,messages,currentChat})
                    })
                })   
            } else{
                alert('Login failed.')
            }
        })
             
    }

    handleNewChat(chatName){
        this.setState({currentChat: chatName, activeChats: this.state.activeChats.concat(chatName)})
        const messages = this.state.messages
        messages[chatName] = []
        this.setState({messages}, () => {
            this.socket.emit('register chat', this.state.user, this.state.currentChat)
        })
    }

    handleChatSelection(chatName){
        this.setState({currentChat: chatName})
    }

    handleNewMessage(message){
        const msg = {
            origin: this.state.user,
            chat: this.state.currentChat,
            time: new Date().toString(),
            message: {
                metaData: {
                    type: 'text'
                },
                data: message
            }}
        this.socket.emit('message', msg)
        const msgs = this.state.messages
        msgs[this.state.currentChat].push(msg)
        this.setState({messages: msgs})
    }

    handleUploadFile = files => {
        console.log(files)
        const data = files.base64
        const file = files.fileList.item(0)
        const fileMsg = {
            origin: this.state.user,
            chat: this.state.currentChat,
            time: new Date().toString(),
            message: {
                metaData:{
                    type: file.type,
                    name: file.name,
                    size: file.size,
                    lastModified: file.lastModified
                },
                data
            }
        }
        
        this.socket.emit('message', fileMsg, () => {
            console.log('One file sent')
        })
        const msgs = this.state.messages
        msgs[this.state.currentChat].push(fileMsg)
        this.setState({messages: msgs})
    }

    render(){
        return (
            <div>
                {!this.state.loggedIn
                ? <SingleInputForm title="User: " handleSubmit={this.handleLogin}/>
                : <div>
                    <UserInfo user={this.state.user}/>
                    <SingleInputForm title="New Chat: " handleSubmit={this.handleNewChat}/>
                    {(!(this.state.currentChat == null))
                    ? <div>
                        <ChatList chats={this.state.activeChats} selected={this.state.currentChat} handleClick={this.handleChatSelection}/>
                        <MessageArea messages={this.state.messages[this.state.currentChat]}/>
                        <MessageInput handleMessage={this.handleNewMessage}/>
                        <ReactFileReader handleFiles={this.handleUploadFile} base64={true}>
                            <button>Upload</button>
                        </ReactFileReader>
                    </div>
                    : <p>No active chat yet. Add a new chat first!</p>
                    }
                    
                </div>                
                }
            </div>
        );
    }

}

class SingleInputForm extends React.Component{

    constructor(props){
        super(props)
        this.state = {value: ''}
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value})
    }

    handleSubmit = (event) => {
        this.props.handleSubmit(this.state.value);
        this.setState({value: ''})
        event.preventDefault();
    }

    render(){
        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    {this.props.title}          
                    <input type="text" value={this.state.value} onChange={this.handleChange}></input>
                </label>
                <input type="submit" value="Submit"></input>
            </form>
        );
    }
}

class UserInfo extends React.Component{

    render(){
        return (
            <p>Logged in user: {this.props.user}</p>
        )
    }
}

class ChatList extends React.Component{

    constructor(props){
        super(props)
        this.handleChange = this.handleChange.bind(this)
    }

    handleChange(event) {
        this.props.handleClick(event.target.value)
    }

    render(){
        const options = this.props.chats.map(item => {
            return <option key={item} value={item}>{item}</option>
        })
        return (
            <div>
                <label> Select the chat: </label>
                <select value={this.props.selected} onChange={this.handleChange}>
                    {options}
                </select>
            </div>
            
        )
    }

}

class MessageArea extends React.Component {

    render(){
        const msgs = this.props.messages.map( (msg,i) => {
            return <Message key={i} message={msg}/>
        })
        return (
            <div>
                {msgs}
            </div>
        )
    }

}

class MessageInput extends React.Component {

    constructor(props){
        super(props)
        this.state = {value: ''}
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    handleSubmit(event){
        event.preventDefault()
        this.props.handleMessage(this.state.value)
        this.setState({value: ''})      
    }

    handleChange(event){
        this.setState({value: event.target.value})
    }

    render(){
        return (
            <form onSubmit={this.handleSubmit}>
                <textarea value={this.state.value} onChange={this.handleChange} />
                <button type="submit">Send</button>
            </form>
        )
    }

}

class Message extends React.Component {
    render() {
        const message = this.props.message;
        const toShow = (message.message.metaData.type === 'text')
        ? message.message.data
        : message.message.metaData.name + '  ' + filesize(message.message.metaData.size).human()
        const origin = message.origin
        const date = new Date(message.time)
        const timeStamp = date.getHours() + ':' + date.getMinutes()
        return (
            <div>
                <p><b>{origin}</b>: {toShow}</p>
                <span>{timeStamp}</span>
            </div>
        )
    }
}

export default Chat;