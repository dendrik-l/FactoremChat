const socket = io()

socket.on('message', msg => console.log('New message: ' + msg))

socket.on('connect', () => {
    // TODO: Offer messaging server its JWT for identification
    // Find out how to get JWT from the existing frontend storage

    socket.emit('authenticate', jwt)
})

var obj = {
    quotation: '12345',
    message: {
        metaData: {
            format: 'text'
        },
        data: 'abcd'
    }
}

console.log(obj)

socket.emit('message', obj)