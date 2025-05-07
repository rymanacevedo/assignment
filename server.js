// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Import ObjectId from MongoDB
require('dotenv').config();

const app = express();
const uri = "mongodb+srv://jonathangreene888:ORlxmjYki5ViUzio@baseballapicluster.povu9p6.mongodb.net/?retryWrites=true&w=majority&appName=baseballapicluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: false,
});

async function run() {
  try {
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
}
run().catch(console.dir);

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:8080'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
  const playerName = req.body.message;
  console.log('Player Name:', playerName);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: `Tell me a little about ${playerName} the pro baseball player using only last name.` },
        ],
        max_tokens: 150,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ response: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing your request.' });
  }
});

// Endpoint to fetch and insert baseball stats
app.get('/api/baseball', async (req, res) => {
  try {
    // Ensure the MongoDB client is connected
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    // Fetch data from the baseball API
    const response = await axios.get('https://api.hirefraction.com/api/test/baseball');
    const players = response.data;

    // Connect to the MongoDB collection
    const database = client.db('baseballDB'); 
    const collection = database.collection('players'); 

    // Insert all players into MongoDB
    const result = await collection.insertMany(players, { ordered: false });

    console.log(`Inserted ${result.insertedCount} players into MongoDB.`);
    res.json({ message: `${result.insertedCount} players inserted into MongoDB.` });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error: Some records already exist in the database.');
      res.status(409).json({ error: 'Duplicate key error: Some records already exist in the database.' });
    } else {
      console.error('Error fetching or inserting baseball stats:', error.message);
      res.status(500).json({ error: 'Error fetching or inserting baseball stats.' });
    }
  }
});

// Endpoint to fetch baseball stats from MongoDB
app.get('/api/baseball/players', async (req, res) => {
  try {
    // Ensure the MongoDB client is connected
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    // Connect to the MongoDB collection
    const database = client.db('baseballDB'); 
    const collection = database.collection('players'); 

    // Fetch all players from the collection
    const players = await collection.find({}).toArray();

    console.log(`Fetched ${players.length} players from MongoDB.`);
    res.json(players); // Send the players data to the frontend
  } catch (error) {
    console.error('Error fetching players from MongoDB:', error.message);
    res.status(500).json({ error: 'Error fetching players from MongoDB.' });
  }
});

// Endpoint to update a player's name
app.put('/api/baseball/players/:id', async (req, res) => {
  const playerId = req.params.id; // Extract the player ID from the URL
  const { name } = req.body; // Extract the new name from the request body

  if (!name) {
    return res.status(400).json({ error: 'Player name is required.' });
  }

  // Validate the playerId format
  if (!ObjectId.isValid(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID format.' });
  }

  try {
    // Ensure the MongoDB client is connected
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    // Connect to the MongoDB collection
    const database = client.db('baseballDB');
    const collection = database.collection('players');

    // Convert playerId to ObjectId
    const objectId = new ObjectId(playerId);

    // Update the player's name in the database
    const result = await collection.updateOne(
      { _id: objectId }, // Match the player by ObjectId
      { $set: { "Player name": name } } // Update the "Player name" field
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    res.json({ message: 'Player name updated successfully.' });
  } catch (error) {
    console.error('Error updating player name:', error.message);
    res.status(500).json({ error: 'Error updating player name.' });
  }
});

// Gracefully close the MongoDB client on application exit
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

app.listen(3000, () => console.log('Server running on port 3000'));