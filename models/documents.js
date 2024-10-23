// Documents models

const mongo = require('mongodb');
const database = require('../database/database');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Documents object
const docs = {
    //All retrieved from the database

    //Gets all the documents
    getAll: async (userEmail) => {
        const db = await database.getDb('documents');
        return await db.collection.find({ 
            $or: [
                {userEmail},
                {collaborator: userEmail}
            ] 
        }).toArray();
    },

    //Gets one specifik document
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

    //Creates a document
    create: async (document, userEmail) => {
        const db = await database.getDb('documents');
        const newDocument = {
            ...document,
            userEmail,
            createdAt: new Date(),
            type: document.type || 'text'
        };
        const response = await db.collection.insertOne(newDocument);
        return response.insertedId;
    },

    //Updates a document
    update: async (id, updatedData, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndUpdate(
            { _id: docId, $or: [{userEmail}, {collaborator: userEmail}] },
            { $set: updatedData },
            { returnOriginal: false }
        );
    },

    //Deletes a document
    delete: async (id, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        await db.collection.findOneAndDelete({ _id: docId, userEmail });
    },

    //Shares a document to another user
    share: async (id, email, userEmail) => {
        const { db, collection }  = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        const document = await collection.findOne({ _id: docId, userEmail});

        if (!document) {
            throw new Error("document not found");
        }

        const userCollection = db.collection('users');
        const collaborator = await userCollection.findOne({email});

        //Checks if the invited user already exists
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
    },

    //Allows processing of a document executed in codemode
    codeMode: async (data) => {
        const response = await fetch('https://execjs.emilfolino.se/code', {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        });

        const textResponse = await response.text();
        console.log('Response Text:', textResponse);

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Execution failed: ${errorResponse.message}`);
        }

        return JSON.parse(textResponse);
    }
};

module.exports = docs;
