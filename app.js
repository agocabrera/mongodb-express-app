const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, BSON } = require("mongodb");
const { BadRequestError, NotFoundError } = require("./errors.js");
require("dotenv").config();

const app = express();
const dbClient = new MongoClient(process.env.DB_URI);
const clients = dbClient.db("Database-0").collection("Clients");

// Middleware.
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// Routes.
app.get("/", (request, response) => {
  return response.redirect("/clients/list");
});

app.get("/clients/list", (request, response) => {
  return response.sendFile(__dirname + "/public/html/client-list.html");
});

app.get("/clients/add", (request, response) => {
  return response.sendFile(__dirname + "/public/html/client-add.html");
});

// API.
app.get("/api/clients", async (request, response) => {
  const cursor = clients.find();
  const data = await cursor.toArray();
  return response.status(200).send(data);
});

app.get("/api/clients/:id", async (request, response, next) => {
  const id = request.params.id;

  if (!id) {
    const error = new BadRequestError(
      "Request is missing ID of client to be retrieved."
    );
    next(error);
  }

  try {
    const objectId = new ObjectId(id);
    const data = await clients.findOne({ _id: objectId });

    if (data === null) {
      throw new NotFoundError("A client with provided ID was not found.");
    }

    return response.status(200).send(data);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/clients", async (request, response) => {
  const { firstName, lastName, email } = request.body;

  if (!firstName) {
    const error = new BadRequestError(
      "Request is missing first name of client to be added."
    );
    return next(error);
  }

  if (!lastName) {
    const error = new BadRequestError(
      "Request is missing last name of client to be added."
    );
    return next(error);
  }

  if (!email) {
    const error = new BadRequestError(
      "Request is missing email of client to be added."
    );
    return next(error);
  }

  const newClient = {
    firstName,
    lastName,
    email,
  };

  const dbResponse = await clients.insertOne(newClient);

  if (dbResponse.acknowledged) {
    console.log("Added client to database", newClient);
    return response.sendStatus(201);
  } else {
    console.log("Failed to add client to database", newClient);
    return response.sendStatus(400);
  }
});

app.delete("/api/clients/:id", async (request, response, next) => {
  const id = request.params.id;

  if (!id) {
    const error = new BadRequestError(
      "Request is missing ID of client to be deleted."
    );
    return next(error);
  }

  try {
    const objectId = new ObjectId(id);
    const dbResponse = await clients.deleteOne({ _id: objectId });

    if (dbResponse.deletedCount === 0) {
      const error = new NotFoundError(
        "A client with provided ID was not found. No records were deleted."
      );
      return next(error);
    }

    if (dbResponse.acknowledged && dbResponse.deletedCount > 0) {
      console.log(`Deleted client with ID ${id}.`);
      return response.sendStatus(204);
    } else {
      console.log(`Failed to delete client with ID ${id}.`);
      return response.sendStatus(404);
    }
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware.
app.use((error, request, response, next) => {
  if (error instanceof BSON.BSONError) {
    return response
      .status(400)
      .json({ error: "ID provided by request is not valid." });
  }

  return response.status(error.statusCode).json({ error: error.message });
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

    app.listen(process.env.SERVER_PORT, () => {
      console.log(`Server running on port ${process.env.SERVER_PORT}.`);
    });
  })
  .catch((error) => {
    console.log("Failed to connect to database.");
    console.log(error.cause);
  });
