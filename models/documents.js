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
        // console.log('connected to database');
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
        // console.log(`founf document ${docId}`);
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
        };
        const response = await db.collection.insertOne(newDocument);
        // console.log(`New document created with ID: ${response.insertedId}`)
        return response.insertedId;
    },

    //Updates a document
    update: async (id, updatedData, userEmail) => {
        const db = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        // console.log(`updating document ${docId}`);
        await db.collection.findOneAndUpdate(
            { _id: docId, $or: [{userEmail}, {collaborator: userEmail}] },
            { $set: updatedData },
            { returnOriginal: false }
        );
    },

    //Deletes a document from userEmail (owner or collaborator)
    delete: async (id, userEmail) => {
        const {db, collection} = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        const document = await collection.findOne({_id: docId})
        if (document.userEmail === userEmail) {
            await collection.findOneAndDelete({ _id: docId, userEmail });
            // console.log('Document has been removed')
        } else {
            await collection.updateOne(
                {_id: docId},
                {$pull: {collaborator: userEmail}}
            );
            // console.log('You are have been removed from the document as a collaborator!');
        }
    },

    //Shares a document to another user
    share: async (id, email, userEmail) => {
        const { db, collection }  = await database.getDb('documents');
        const docId = new mongo.ObjectId(id);
        const document = await collection.findOne({ _id: docId, userEmail});

        if (!document) {
            console.log("document not found");
        }

        const userCollection = db.collection('users');
        const collaborator = await userCollection.findOne({email});

        if (collaborator) {
            const invitationUrl = `http://localhost:3000/`;
            const msg = {
                to: email,
                from: 'anteo.ssr@gmail.com',
                subject: `${userEmail} has added you as a collaborator`,
                text: `You've added as a collaborator on a document. Login using this link: ${invitationUrl}`,
            }

            await sgMail.send(msg);
            await collection.updateOne(
                { _id: docId },
                { $addToSet: {collaborator: email}}
            );
            // console.log('Document shared');
        } else {
            const invitationUrl = `http://localhost:3000/#/register?email=${email}`;
            const msg = {
                to: email,
                from: 'anteo.ssr@gmail.com',
                subject: `invitation from ${userEmail}`,
                text: `You've been invited to collaborate on a document. Register using this link: ${invitationUrl}`,
            }

            await sgMail.send(msg);
            await collection.updateOne(
                { _id: docId },
                { $addToSet: { collaborator: email } }
            );
            // console.log('Document shared');
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
            console.log(`Execution failed: ${errorResponse.message}`);
        }
        console.log('data processed');
        return JSON.parse(textResponse);
    }
};

module.exports = docs;
