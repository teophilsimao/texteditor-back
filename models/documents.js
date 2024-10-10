const mongo = require('mongodb');
const database = require('../database/database');

const Data = {
    getAll: async (userEmail) => {
        const db = await database.getDb();
        return await db.collection.find({ userEmail }).toArray();
    },

    getOne: async (id, userEmail) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        return await db.collection.findOne({ _id: docId, userEmail });
    },

    create: async (document, userEmail) => {
        const db = await database.getDb();
        const newDocument = {
            ...document,
            userEmail,
            createdAt: new Date()
        };
        const result = await db.collection.insertOne(newDocument);
        return result.insertedId;
    },

    update: async (id, updatedData, userEmail) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndUpdate(
            { _id: docId, userEmail },
            { $set: updatedData },
            { returnOriginal: false }
        );
    },

    delete: async (id, userEmail) => {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndDelete({ _id: docId, userEmail });
    }
};

module.exports = Data;
