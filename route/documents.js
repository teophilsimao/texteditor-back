const express = require('express');
const Data = require('../models/documents');
const auth = require('../models/auth');
const database = require('../database/database');
const router = express.Router();

// Check for token authentication
router.use(auth.checkToken);

// Get all documents
router.get('/', async (req, res) => {
    try {
        const userEmail = req.user.email;
        const documents = await Data.getAll(userEmail);
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
});

// Get a specific document
router.get('/:id', async (req, res) => {
    try {
        const userEmail = req.user.email;
        const document = await Data.getOne(req.params.id, userEmail);
        
        if (!document) {
            return res.status(404).json({ message: 'Document not found or you do not have permission.' });
        }

        res.status(200).json(document);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching document', error });
    }
});

// Create a document
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const document = {
            title,
            content,
            createdAt: new Date()
        };

        const docId = await Data.create(document, req.user.email);
        const newDoc = await Data.getOne(docId, req.user.email);
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(500).json({ message: 'Error creating document', error });
    }
});

// Update a document
router.put('/:id', async (req, res) => {
    try {
        const userEmail = req.user.email;
        const updatedData = {
            ...req.body,
            updatedAt: new Date()
        };

        await Data.update(req.params.id, updatedData, userEmail);
        res.json({ message: 'Document updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating document', error });
    }
});

// Delete a document
router.delete('/:id', async (req, res) => {
    try {
        const userEmail = req.user.email;
        await Data.delete(req.params.id, userEmail);
        res.json({ message: 'Document deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error });
    }
});

// share document
router.post('/:id/share', async (req, res) => {
    const email = req.body.email;
    const userEmail = req.user.email;

    try {
        const result = await Data.share(req.params.id, email, userEmail);
        return res.status(200).json(result);
    } catch (e) {
        console.log(e)
        return res.status(404).json({
            errors: {
                status: 404,
                title: "Error",
                detail: e.message
            }
        });
    } 
})

module.exports = router;
