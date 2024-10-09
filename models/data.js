const mongo = require('mongodb');
const database = require('../database/database');

const Data = {
    getAll: async () => {
        const db = await database.getDb();
        return await db.collection.find().toArray();
    },

    getOne: async (id) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        return await db.collection.findOne({ _id: docId });
    },

    create: async (document) => {
        const db = await database.getDb();
        const result = await db.collection.insertOne(document);
        return result.insertedId;
    },

    update: async (id, updatedData) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndUpdate(
            { _id: docId },
            { $set: updatedData },
            { returnOriginal: false }
        );
    },

    delete: async (id) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndDelete({ _id: docId });
    }
};

module.exports = Data;