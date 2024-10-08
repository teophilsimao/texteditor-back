const express = require('express');
const cors = require('cors');
const mongo = require('mongodb');
const database = require('./database/database');
require('dotenv').config();

const port = process.env.PORT || 1337;
const app = express();
app.use(express.json());
app.use(cors());

// Get all documents
app.get('/', async (req, res) => {
    try {
        const db = await database.getDb();
        const documents = await db.collection.find().toArray();

        res.status(201).json(documents);
    } catch (error) {
        res.status(500).json({message: 'ajaj', error})
    }
});

// Get one document
app.get('/:id', async (req, res) => {
    try {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(req.params.id);
        const document = await db.collection.findOne({_id: docId});

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({message: 'ajaj', error})
    }
});

// Created
app.post('/', async (req, res) => {
    try {
        const db = await database.getDb();
        const { title, content} = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Need a title fo the docs m8'});
        }

        const document = {
            title,
            content,
            createdAt: new Date()
        };

        const result = await db.collection.insertOne(document);

        const docId = result.insertedId;
        const theDoc = await db.collection.findOne({_id: docId})

        res.status(201).json(theDoc);
    } catch (error) {
        res.status(500).json({message: 'ajaj', error});
    }
});


// Update
app.put('/:id', async (req, res) => {
    try {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(req.params.id);
        const { title, content} = req.body;

        const theUpdate = {};
        if (title !== undefined) {
            theUpdate.title = title;
        }
        if (content !== undefined) {
            theUpdate.content = content;
        }
        theUpdate.updatedAt = new Date();

        await db.collection.findOneAndUpdate(
            { _id: docId }, 
            { $set: theUpdate },
            { returnOriginal: false }
        );

        res.json({message: 'Updated'});
    } catch (error) {
        res.status(500).json({message: 'ajaj', error});
    }
})

// Delete
app.delete('/:id', async (req, res) => {
    try {
        const db = await database.getDb();
        const docId = new mongo.ObjectId(req.params.id);
        await db.collection.findOneAndDelete({_id: docId});
        res.json({message: 'Gonners'})
    } catch (error) {
        res.status(500).json({message: 'ajaj', error});
    }
})

const server = app.listen(port, () => {
    console.log('API port ' + port);
});

module.exports = server;