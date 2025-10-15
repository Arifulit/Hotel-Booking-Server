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
    const db = client.db("hotel-booking");
    const roomCollection = db.collection("hotel");
    const bookingCollection = db.collection("book-room");
    // const receivedCollection = db.collection("receives");

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
        const room = await roomCollection.findOne({
          _id: new ObjectId(roomId),
        });
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

  
    function formatDateTime(input = new Date()) {
      const d = new Date(input);
      const pad = (n) => n.toString().padStart(2, "0");
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

  
    app.post("/book-room", async (req, res) => {
      const newBooking = req.body;

      try {
        // Check room exists and availability from rooms collection
        const room = await roomCollection.findOne({
          roomName: newBooking.roomName,
        });
        if (!room) {
          return res.status(404).json({ message: "Room not found." });
        }
        if (room.available === false) {
          return res
            .status(400)
            .json({ message: "This room is already booked." });
        }

        // Prepare booking document with formatted timestamps
        const now = new Date();
        newBooking.available = false;
        newBooking.status = "booked";
        newBooking.createdAtISO = now.toISOString();
        newBooking.createdAt = formatDateTime(now); // human readable

        // Mark room unavailable and insert booking
        await roomCollection.updateOne(
          { roomName: newBooking.roomName },
          { $set: { available: false } }
        );

        const result = await bookingCollection.insertOne(newBooking);
        res.status(201).json({ message: "Room booked successfully!", result });
      } catch (error) {
        console.error("Error booking room:", error);
        res
          .status(500)
          .json({ message: "An error occurred while booking the room." });
      }
    });
    

    app.put("/book-room/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;

      // Normalize time value and store ISO + formatted string
      const timeValue = updatedData.time
        ? new Date(updatedData.time)
        : new Date();
      const updateDoc = {
        $set: {
          bookingDateISO: timeValue.toISOString(),
          bookingDate: formatDateTime(timeValue),
        },
      };

      try {
        const result = await bookingCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        console.log(result);
        res.send(result);
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send({ error: "Failed to update the booking." });
      }
    });
  
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
        const room = await bookingCollection.findOne({
          _id: new ObjectId(roomId),
        });
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

      const toObjectId = (v) => {
        try {
          return new ObjectId(v);
        } catch {
          return null;
        }
      };

      try {
        const oid = toObjectId(id) || id;
        const booking = await bookingCollection.findOne({ _id: oid });
        if (!booking)
          return res.status(404).json({ message: "Booking not found." });

        // Determine room filter (prefer roomId, fallback to roomName)
        let roomFilter = null;
        if (booking.roomId) {
          const rid = toObjectId(booking.roomId) || booking.roomId;
          roomFilter = { _id: rid };
        } else if (booking.roomName) {
          roomFilter = { roomName: booking.roomName };
        }

        // Set room available = true so others can book
        if (roomFilter) {
          await roomCollection.updateOne(roomFilter, {
            $set: { available: true },
          });
        }

        // Delete the booking
        const result = await bookingCollection.deleteOne({ _id: oid });

        if (result.deletedCount === 0) {
          return res.status(500).json({ message: "Failed to delete booking." });
        }

        res.status(200).json({
          message: "Booking deleted and room set to available.",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "An error occurred during deletion." });
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
