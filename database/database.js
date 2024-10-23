// Database

const mongo = require('mongodb').MongoClient;
// const collectionName = 'documents';
require('dotenv').config();

const database = {
    getDb: async function getDb(collectionName) {       
        let dsn = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.zarw2.mongodb.net/texteditor?retryWrites=true&w=majority&appName=Cluster0"`

        if (process.env.NODE_ENV === 'test') {
            dsn = `mongodb://localhost:27017/test`;
        }

        const client = await mongo.connect(dsn);
        const db = await client.db();
        const collection = collectionName ? await db.collection(collectionName) : null;

        return {
            db: db,
            collection: collection,
            client: client,
        };
    }
}


module.exports = database;