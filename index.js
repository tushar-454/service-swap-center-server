const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const port = process.env.port || 5000;

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized Access' });
    }
    req.user = decoded;
    next();
  });
};

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
    // await client.connect();

    const serviceSwapCenter = client.db('serviceSwapCenter');
    const servicesCollection = serviceSwapCenter.collection('services');
    const bookingCollection = serviceSwapCenter.collection('booking');

    // jwt api authentication api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: false,
      });
      res.send({ success: true });
    });

    // api for delete token
    app.post('/jwtremove', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 });
      res.send({ success: true });
    });

    // get all services from database
    app.get('/services', async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = { email: email };
      }
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    // get one service by id from database
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    // post a service in database
    app.post('/services', async (req, res) => {
      const serviceData = req.body;
      const result = await servicesCollection.insertOne(serviceData);
      res.send(result);
    });

    // add booked data in database
    app.post('/booking', async (req, res) => {
      const bookedData = req.body;
      const result = await bookingCollection.insertOne(bookedData);
      res.send(result);
    });

    // get booking data based on user email
    app.get('/booking', verifyToken, async (req, res) => {
      const email = req.query.email;
      const type = req.query.type;
      if (req.user.email !== email) {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
      let query = {};
      if (email && type) {
        query = { [type]: email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // delete user added service by uid
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const result = await servicesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // update service by service id
    app.put('/service/:id', async (req, res) => {
      const id = req.params.id;
      const getupdatedDoc = req.body;
      const updatedDoc = {
        $set: {
          email: getupdatedDoc.email,
          authorImage: getupdatedDoc.authorImage,
          authorName: getupdatedDoc.authorName,
          name: getupdatedDoc.name,
          image: getupdatedDoc.image,
          price: getupdatedDoc.price,
          servicearea: getupdatedDoc.servicearea,
          description: getupdatedDoc.description,
        },
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await servicesCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // delete user added bookedData from database
    app.delete('/booking', async (req, res) => {
      const whoBookedEmail = req.query.whoBooked;
      const id = req.query.id;
      const query = { _id: new ObjectId(id), whoBooked: whoBookedEmail };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // update booking status in database
    app.put('/booking', async (req, res) => {
      const id = req.query.id;
      const updatedStatus = req.body.status;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: updatedStatus,
        },
      };
      const result = await bookingCollection.updateOne(query, updatedDoc);
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
