const { MongoClient } = require("mongodb");

let client;
let db;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("234wknd");

    console.log("Connected to MongoDB successfully");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
};

// Collections
const Collections = {
  EVENTS: "events",
  BOOKINGS: "bookings",
  TICKETS: "tickets",
  PAYMENTS: "payments",
};

// Database operations
const savePayment = async (paymentData) => {
  const db = getDB();
  const collection = db.collection(Collections.PAYMENTS);

  const payment = {
    ...paymentData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await collection.insertOne(payment);
};

const saveTicket = async (ticketData) => {
  const db = getDB();
  const collection = db.collection(Collections.TICKETS);

  const ticket = {
    ...ticketData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await collection.insertOne(ticket);
};

const saveBooking = async (bookingData) => {
  const db = getDB();
  const collection = db.collection(Collections.BOOKINGS);

  const booking = {
    ...bookingData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await collection.insertOne(booking);
};

const getTicketByReference = async (reference) => {
  const db = getDB();
  const collection = db.collection(Collections.TICKETS);

  return await collection.findOne({ paymentReference: reference });
};

const getBookingByReference = async (reference) => {
  const db = getDB();
  const collection = db.collection(Collections.BOOKINGS);

  return await collection.findOne({ reference });
};

const updateBookingStatus = async (reference, status, paymentData = {}) => {
  const db = getDB();
  const collection = db.collection(Collections.BOOKINGS);

  return await collection.updateOne(
    { reference },
    {
      $set: {
        status,
        paymentStatus: status,
        paymentData,
        updatedAt: new Date(),
      },
    },
  );
};

module.exports = {
  connectDB,
  getDB,
  closeDB,
  Collections,
  savePayment,
  saveTicket,
  saveBooking,
  getTicketByReference,
  getBookingByReference,
  updateBookingStatus,
};
