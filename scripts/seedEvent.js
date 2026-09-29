/**
 * Seed script — upserts The Wet Sky Party event into the ticketEvents collection.
 * Run once: node scripts/seedEvent.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { MongoClient } = require("mongodb");

const WET_SKY_PARTY = {
  title: "THE WET SKY PARTY x +234WKND",
  date: "DEC 11, 2026",
  location: "Undisclosed Location, Lagos",
  price: 15000,
  description:
    "The Wet Sky Party is the most anticipated night experience of the year — music, culture, and an energy that goes from sunset to after dark.",
  image: "/images/img-02.jpg",
  capacity: "Limited Spots",
  tag: "Hot Event",
};

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("❌  MONGODB_URI not set in .env");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    // Use the DB name from the connection string (WKND) via default db
    const db = client.db();
    const col = db.collection("ticketEvents");

    const result = await col.updateOne(
      { title: WET_SKY_PARTY.title },
      {
        $set: { ...WET_SKY_PARTY, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      console.log("✅  Created The Wet Sky Party event:", result.upsertedId);
    } else {
      console.log("✅  Updated existing The Wet Sky Party event.");
    }
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
