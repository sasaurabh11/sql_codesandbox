import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("❌ MONGO_URI not set in environment");

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/sqlsandbox`
    );
    console.log(
      `\n MONGODB CONNECTION SUCCESSFULL!! DB HOST ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    throw err;
  }
}

export { mongoose };
