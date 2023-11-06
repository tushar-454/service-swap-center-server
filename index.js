const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.port || 5000;
// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@service-swap-center.0rpazty.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const serviceSwapCenter = client.db('serviceSwapCenter');
    const servicesCollection = serviceSwapCenter.collection('services');

    // get all services from database
    app.get('/services', async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send({ message: 'Api is working' });
});

app.listen(port, () => {
  console.log(`Server is running http://localhost:${port}`);
});
