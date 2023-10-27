const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const dbUri = process.env.db_uri;
const serverPort = process.env.server_port;
const dbClient = new MongoClient(dbUri);

const clients = dbClient.db("Database-0").collection("Clients");

// Middleware.
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// Routes.
app.get("/", (request, response) => {
  response.redirect("/clients/list");
});

app.get("/clients/list", (request, response) => {
  response.sendFile(__dirname + "/public/html/client-list.html");
});

app.get("/clients/add", (request, response) => {
  response.sendFile(__dirname + "/public/html/client-add.html");
});

// API.
app.get("/api/clients/:id?", async (request, response) => {
  const id = request.params.id;
  let data;
  if (id) {
    const objectId = new ObjectId(id);
    data = await clients.findOne({ _id: objectId });
  } else {
    const cursor = clients.find();
    data = await cursor.toArray();
  }
  response.send(data);
});

app.post("/api/clients", async (request, response) => {
  const newClient = {
    firstName: request.body["first-name"],
    lastName: request.body["last-name"],
    email: request.body["email"],
  };
  const dbResponse = await clients.insertOne(newClient);

  if (dbResponse.acknowledged) {
    console.log("Added client to database", newClient);
    response.sendStatus(201);
  } else {
    console.log("Failed to add client to database", newClient);
    response.sendStatus(400);
  }
});

app.delete("/api/clients/:id", async (request, response) => {
  const id = request.params.id;
  const objectId = new ObjectId(id);
  const dbResponse = await clients.deleteOne({ _id: objectId });

  if (dbResponse.acknowledged && dbResponse.deletedCount > 0) {
    console.log(`Deleted client with ID ${id}.`);
    response.sendStatus(204);
  } else {
    console.log(`Failed to delete client with ID ${id}.`);
    response.sendStatus(404);
  }
});

// Clean up after receiving interrupt signal.
process.on("SIGINT", async () => {
  console.log("Closing database connection...");
  await dbClient.close();
  console.log("Exiting...");
  process.exit();
});

// Connect to database, then start Express server.
dbClient
  .connect()
  .then(() => {
    console.log("Connected to database.");

    app.listen(serverPort, () => {
      console.log(`Server running on port ${serverPort}.`);
    });
  })
  .catch((error) => {
    console.log("Failed to connect to database.");
    console.log(error.cause);
  });
