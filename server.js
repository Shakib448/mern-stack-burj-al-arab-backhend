const express = require("express");
const app = express();
const admin = require("firebase-admin");
require("dotenv").config();

const cors = require("cors");
const boydParser = require("body-parser");

const MongoClient = require("mongodb").MongoClient;

const PORT = 5000;

app.use(cors());
app.use(boydParser.json());

const serviceAccount = require("./fire-auth-9ce8d-firebase-adminsdk-ua9q3-d7ae5e9af5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fire-auth-9ce8d.firebaseio.com",
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qebvf.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");
  //   client.close();

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: req.query.email }).toArray((err, doc) => {
              // this find method used filtering the email
              res.status(200).send(doc);
            });
          } else {
            res.status(401).send("Un authorized access");
          }
          // ...
        })
        .catch(function (err) {
          console.log(err);
          res.status(401).send("Un authorized access");
        });
    } else {
      res.status(401).send("Un authorized access");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`The server is listening at http://localhost:${PORT}`);
});
