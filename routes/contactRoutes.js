import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const newContact = new Contact({
            name,
            email,
            message,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });

        await newContact.save();

        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

export default router;
