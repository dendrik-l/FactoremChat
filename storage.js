const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = 'mongodb+srv://liu_rex:admin@cluster0-pc5e4.mongodb.net/?retryWrites=true&w=majority';

const dbName = 'chat'
const collectionName = 'messages'

var db = {connected: false, collection: null}
 
// Use connect method to connect to the server
const initDbConnection = () => {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        db.connected = true
        db.collection = client.db(dbName).collection(collectionName)
      });
}

const insertMessages = msgs => {
    if (!(db.connected)) {
        throw 'Database is not connected'
    }
    db.collection.insertMany(msgs, (error, result) => {
        assert.equal(error, null);
        console.log(`${result.insertedCount} out of ${msgs.length} messages backed up`)
    }) 
}

const retrieveHistory = async (criterias, options) => {
    if (!(db.connected)) {
        throw 'Database is not connected'
    }
    const results = await db.collection.find(criterias, options).toArray()
    return results
}


const getChatHistory = (userId) => {
    return 'mock history'
}

const getQuotations = (userId) => {
    return Array(5)
}

module.exports = {getChatHistory, getQuotations, initDbConnection, insertMessages, retrieveHistory}
