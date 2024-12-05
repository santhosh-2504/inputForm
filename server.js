require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));

// Schema and Model
const dataSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        imgUrl: { type: String, required: true },
        buyLink: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }, // Automatically adds timestamp
    },
    { collection: 'products' }
);

// Create TTL index on `createdAt` field with 30 days expiration (2592000 seconds)
dataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Data = mongoose.model('Data', dataSchema);

// POST route to add data
app.post('/add-data', async (req, res) => {
    const { title, description, imgUrl, buyLink } = req.body;

    try {
        const newData = new Data({ title, description, imgUrl, buyLink });
        await newData.save();
        res.status(201).send({ message: 'Data added successfully', data: newData });
    } catch (err) {
        console.error('Error adding data:', err);
        res.status(500).send({ error: 'Failed to add data' });
    }
});

// GET route to fetch all data
app.get('/get-data', async (req, res) => {
    try {
        const data = await Data.find().sort({ createdAt: -1 }); // Sort by most recent
        res.status(200).send(data);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send({ error: 'Failed to fetch data' });
    }
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public'))); // Serve files from the 'public' directory

// For all other routes, serve the index.html (single-page application behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
