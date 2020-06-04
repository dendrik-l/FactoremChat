const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

var db = {connected: false, db: null}
 
// Use connect method to connect to the server
const initDbConnection = (cnntnString, dbName) => {
    MongoClient.connect(cnntnString, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to MongoDB");
        db.connected = true
        db.db = client.db(dbName)
      });
}

const insertDocuments = (collection, documents) => {
    if (!(db.connected)) {
        throw 'Database is not connected'
    }
    db.db.collection(collection).insertMany(documents, (error, result) => {
        assert.equal(error, null);
        console.log(`${result.insertedCount}/${documents.length} documents for collection ${collection} backed up`)
    }) 
}

const retrieveDocuments = async (collection, criterias, options) => {
    if (!(db.connected)) {
        throw 'Database is not connected'
    }
    return await db.db.collection(collection).find(criterias, options).toArray()
}

module.exports = {initDbConnection, insertDocuments, retrieveDocuments}
