// Documents models

const mongo = require('mongodb');
const database = require('../database/database');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Data = {
    getAll: async (userEmail) => {
        const db = await database.getDb('documents');
        return await db.collection.find({ 
            $or: [
                {userEmail},
                {collaborator: userEmail}
            ] 
        }).toArray();
    },

    getOne: async (id, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        return await db.collection.findOne({ 
            _id: docId, 
            $or: [
                {userEmail},
                {collaborator: userEmail}
            ] 
        });
    },

    create: async (document, userEmail) => {
        const db = await database.getDb('documents');
        const newDocument = {
            ...document,
            userEmail,
            createdAt: new Date()
        };
        const result = await db.collection.insertOne(newDocument);
        return result.insertedId;
    },

    update: async (id, updatedData, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndUpdate(
            { _id: docId, $or: [{userEmail}, {collaborator: userEmail}] },
            { $set: updatedData },
            { returnOriginal: false }
        );
    },

    delete: async (id, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndDelete({ _id: docId, userEmail });
    },

    share: async (id, email, userEmail) => {
        const { db, collection, client }  = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        const document = await collection.findOne({ _id: docId, userEmail});

        if (!document) {
            throw new Error("document not found");
        }

        const userCollection = db.collection('users');
        const collaborator = await userCollection.findOne({email});
        if (collaborator) {
            await collection.updateOne(
                { _id: docId },
                { $addToSet: {collaborator: email}}
            );
            
            return {message: "Document shared"};
        } else {
            const invitationUrl = `http://localhost:3000/#/register?email=${email}`;

            const msg = {
                to: email,
                from: 'anteo.ssr@gmail.com',
                subject: `invitation from ${userEmail}`,
                text: `You've been invited to collaborate on a document. Please register using this link: ${invitationUrl}`,
            }

            await sgMail.send(msg);

            await collection.updateOne(
                { _id: docId },
                { $addToSet: { collaborator: email } }
            );

            return {message: 'invitation sent'}
        }
    }
};

module.exports = Data;
