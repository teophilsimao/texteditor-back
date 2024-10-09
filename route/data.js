// routes/data.js
const express = require('express');
const Data = require('../models/data');
const router = express.Router();

// Get all documents
router.get('/', async (req, res) => {
    try {
        const documents = await Data.getAll();
        res.status(201).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'ajaj', error });
    }
});

// Get one document
router.get('/:id', async (req, res) => {
    try {
        const document = await Data.getOne(req.params.id);
        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: 'ajaj', error });
    }
});

// Create a document
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Need a title for the docs m8' });
        }

        const document = {
            title,
            content,
            createdAt: new Date()
        };

        const docId = await Data.create(document);
        const newDoc = await Data.getOne(docId);
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ message: 'ajaj', error });
    }
});

// Update a document
router.put('/:id', async (req, res) => {
    try {
        const { title, content } = req.body;

        const updatedData = {};
        if (title !== undefined) {
            updatedData.title = title;
        }
        if (content !== undefined) {
            updatedData.content = content;
        }
        updatedData.updatedAt = new Date();

        await Data.update(req.params.id, updatedData);
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'ajaj', error });
    }
});

// Delete a document
router.delete('/:id', async (req, res) => {
    try {
        await Data.delete(req.params.id);
        res.json({ message: 'Gonners' });
    } catch (error) {
        res.status(500).json({ message: 'ajaj', error });
    }
});

module.exports = router;
