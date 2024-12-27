


const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config(); // Load environment variables

const port = process.env.PORT || 4000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1bdxs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// MongoDB connection
async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    // Ping the database to confirm the connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment successfully!");

    // Collections
    // const roomCollection = client.db("hotel-booking").collection("hotel");
    // const bookingCollection = roomCollection.collection("book-room");


    const db = client.db('hotel-booking')
    const roomCollection  = db.collection('hotel')
    const bookingCollection = db.collection('book-room')
    const  receivedCollection = db.collection('receives')

    // Route to fetch all rooms
    app.get("/rooms", async (req, res) => {
      try {
        const rooms = await roomCollection.find().toArray();
        res.status(200).json(rooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
      }
    });

 


    // Route to fetch a single room by ID
    app.get("/rooms/:id", async (req, res) => {
      try {
        const roomId = req.params.id;
        const room = await roomCollection.findOne({ _id: new ObjectId(roomId) });
        if (room) {
          res.status(200).json(room);
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Failed to fetch room" });
      }
    });

 

app.post("/book-room", async (req, res) => {
  const newBooking = req.body;

  console.log(newBooking);


  try {
    // Ensure required fields are provided
    // if (!newBooking.roomId || !newBooking.userId || !newBooking.bookingDate) {
    //   return res.status(400).json({ message: "Missing required fields." });
    // }

    // Check if a booking with the same roomId already exists
    const existingBooking = await bookingCollection.findOne({roomName: newBooking.roomName });

    if (existingBooking) {
      // If a booking with the same roomId exists, respond with an error message
      return res.status(400).json({ message: "This room is already booked." });
    }

    // If no booking exists with the same roomId, insert the new booking
    await roomCollection.updateOne({ roomName: newBooking.roomName }, { $set: { available: false } });
    const result = await bookingCollection.insertOne(newBooking);
    res.status(201).json({ message: "Room booked successfully!", result });
  } catch (error) {
    console.error("Error booking room:", error);
    res.status(500).json({ message: "An error occurred while booking the room." });
  }
});








// get book data  

app.get("/book-room", async (req, res) => {
  try {
    const rooms = await bookingCollection.find().toArray(); // Fetch booking data from the collection
    res.status(200).json(rooms); // Send the data as JSON
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});



    // Route to fetch a single room by ID
    app.get("/book-room/:id", async (req, res) => {
      try {
        const roomId = req.params.id;
        const room = await bookingCollection.findOne({ _id: new ObjectId(roomId) });
        if (room) {
          res.status(200).json(room);
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Failed to fetch room" });
      }
    });

  


    
// DELETE route to delete a visa application by ID

app.delete("/book-room/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await bookingCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "An error occurred during deletion." });
  }
});



app.put("/book-room/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedData = req.body;

  const updateDoc = {
      $set: {
        bookingDate: updatedData.time,
      },
  };

  try {
      const result = await bookingCollection.updateOne(filter, updateDoc, options);
      console.log(result);
      res.send(result);
  } catch (error) {
      console.error("Error updating tutorial:", error);
      res.status(500).send({ error: "Failed to update the tutorial." });
 }
 });


// Post a review
app.post("/reviews/:roomId", (req, res) => {
  try {
    const rooms = readData();
    const room = rooms.find((r) => r.id === parseInt(req.params.roomId));
    if (!room) return res.status(404).json({ error: "Room not found." });

    const newReview = {
      username: req.body.username,
      rating: req.body.rating,
      comment: req.body.comment,
      timestamp: new Date().toISOString(),
    };

    room.reviews.push(newReview);
    writeData(rooms);

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: "Failed to post review." });
  }
});


     
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.error);

// Root route
app.get("/", (req, res) => {
  res.send("Hotel Booking Server is Running!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});