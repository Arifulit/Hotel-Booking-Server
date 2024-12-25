const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config(); // Load environment variables

const port = process.env.PORT || 5000;
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

  // post the booking data
    app.post("/book-room", async (req, res) => {
      const newBook = req.body;
      console.log("Received new tutorial:",newBook);
      const result = await bookingCollection.insertOne(newBook); // Insert data into MongoDB
      res.send(result); // Respond with the result
      });



// app.post("/book-room", async (req, res) => {
//   const newBook = req.body;
//   console.log("Received booking:", newBook);

//   try {
//     // Find the room by name and update its availability
//     const roomName = newBook.roomName;  // Get room name from the request

//     console.log(roomName);


//     const updatedRoom = await bookingCollection.updateOne(
//       { name: roomName },  // Find the room by its name
//       { $set: { available: false } }  // Mark the room as unavailable
//     );

//     if (updatedRoom.modifiedCount === 0) {
//       return res.status(400).send({ message: "Room not found or already booked." });
//     }

//     // Insert the booking details into the database
//     const result = await bookingCollection.insertOne(newBook);

//     res.status(200).send({ message: "Room booked successfully!", result });
//   } catch (error) {
//     console.error("Error booking the room:", error);
//     res.status(500).send({ message: "There was an issue booking the room. Please try again." });
//   }
// });






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

// Server-side routes to handle booking and fetching reviews

// POST endpoint to book a room
// POST endpoint to book a room
// app.post("/book-room", async (req, res) => {
//   try {
//     const { roomId, bookingDate, userId } = req.body; // Assume `userId` identifies the user

//     // Check if the room is already booked
//     const existingBooking = await bookingCollection.findOne({ roomId });
//     if (existingBooking) {
//       return res.status(400).json({ message: "This room is already booked." });
//     }

//     // Create a new booking
//     const newBooking = {
//       roomId,
//       bookingDate,
//       userId,
//       createdAt: new Date(),
//     };

//     // Insert the booking data
//     const result = await bookingCollection.insertOne(newBooking);

//     // Mark the room as unavailable in the rooms collection
//     await roomsCollection.updateOne(
//       { id: roomId },
//       { $set: { available: false } }
//     );

//     console.log("New booking:", newBooking);
//     res.status(201).json({ success: true, message: "Room booked successfully.", booking: newBooking });
//   } catch (error) {
//     console.error("Error booking room:", error);
//     res.status(500).json({ error: "Failed to book the room. Please try again later." });
//   }
// });

// // GET endpoint to retrieve all booked rooms
// app.get("/book-room", async (req, res) => {
//   try {
//     const bookings = await bookingCollection.find().toArray();
//     res.status(200).json(bookings);
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ error: "Failed to fetch bookings." });
//   }
// });




// // POST endpoint to book a room
// app.post("/book-room", async (req, res) => {
//   try {
//     const newBooking = req.body;

//     // Check if the room is already booked
//     const existingBooking = await bookingCollection.findOne({ roomId: newBooking.roomId });
//     if (existingBooking) {
//       return res.status(400).json({ message: "Room is already booked" });
//     }

//     // Insert the booking data
//     const result = await bookingCollection.insertOne(newBooking);

//     // Update room availability in the rooms collection
//     await roomsCollection.updateOne(
//       { id: newBooking.roomId },
//       { $set: { available: false } }
//     );

//     console.log("New booking received:", newBooking);
//     res.status(201).json({ roomId: newBooking.roomId, success: true });
//   } catch (error) {
//     console.error("Error booking room:", error);
//     res.status(500).json({ error: "Failed to book room" });
//   }
// });

// // GET endpoint to retrieve all booked rooms
// app.get("/book-room", async (req, res) => {
//   try {
//     const bookings = await bookingCollection.find().toArray();
//     res.status(200).json(bookings);
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ error: "Failed to fetch bookings" });
//   }
// });



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

    // PATCH route to mark a room as booked
    app.patch("/book-room/:id/book", async (req, res) => {
      try {
        const roomId = req.params.id;
        const { bookingDate } = req.body;

        const room = await bookingCollection.findOne({ _id: new ObjectId(roomId) });

        if (!room) {
          return res.status(404).json({ message: "Room not found" });
        }

        if (!room.isAvailable) {
          return res.status(400).json({ message: "Room is already booked" });
        }

        const result = await bookingCollection.updateOne(
          { _id: new ObjectId(roomId) },
          {
            $set: {
              isAvailable: false,
              bookingDate: bookingDate,
            },
          }
        );

        res.status(200).json({ message: "Room booked successfully", result });
      } catch (error) {
        console.error("Error booking room:", error);
        res.status(500).json({ message: "Error booking room" });
      }
    });



    
// DELETE route to delete a visa application by ID

app.delete("/book-room/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Received ID to delete:", id); // Log the received ID

  const query = { _id: new ObjectId(id) };

  try {
    // Delete the visa application
    const result = await bookingCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Visa application not found" });
    }

    res.status(200).json({ message: "Visa application deleted successfully" });
  } catch (error) {
    console.error("Error deleting visa application:", error);
    res.status(500).json({
      message: "An error occurred while deleting the visa application",
    });
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
