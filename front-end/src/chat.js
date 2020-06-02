import React from 'react';
import io from 'socket.io-client';


class Chat extends React.Component{

    constructor(props){
        super(props);
        this.state = {loggedIn: false, activeChats: [], messages: {}}
        this.handleLogin = this.handleLogin.bind(this);
        this.handleNewChat = this.handleNewChat.bind(this);        
        this.handleChatSelection = this.handleChatSelection.bind(this);
        this.handleNewMessage = this.handleNewMessage.bind(this);
    }

    componentDidMount(){
        this.socket = io('http://localhost:3030');
        this.socket.on('message', msg => {
            console.log(msg)
            // message conversion
            const newMsg = {origin: msg.origin, message: msg.message.data, time: new Date()}
            const messages = this.state.messages
            messages[msg.chat].push(newMsg)
            console.log(messages)
            this.setState({messages}, () => {
                console.log(this.state)
            })
        })
    }

    handleLogin(user) {
        this.socket.emit('login',{user})
        this.setState({loggedIn: !this.state.loggedIn, user})
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
        this.socket.emit('message', {
            origin: this.state.user,
            chat: this.state.currentChat,
            message: {
                metaData: {
                    type: 'text'
                },
                data: message
            }})
        const msg = {origin: this.state.user, message, time: new Date()}
        const msgs = this.state.messages
        msgs[this.state.currentChat].push(msg)
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
                    <ChatList chats={this.state.activeChats} selected={this.state.currentChat} handleClick={this.handleChatSelection}/>
                    {this.state.currentChat
                    ? <div>
                        <MessageArea messages={this.state.messages[this.state.currentChat]}/>
                        <MessageInput handleMessage={this.handleNewMessage}/>
                    </div>
                    : <p>No chat</p>
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
        //console.log(this.props.messages)
        const msgs = this.props.messages.map( (msg,i) => {
            return <Message key={i} data={msg}/>
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
        return (
            <div>
                <p><b>{this.props.data.origin}</b>: {this.props.data.message}</p>
                <span>{this.props.data.time.getHours()}:{this.props.data.time.getMinutes()}</span>
            </div>
        )
    }
}

export default Chat;