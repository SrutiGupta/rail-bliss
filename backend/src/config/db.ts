import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri);
  if (mongoose.connection.db) {
    await mongoose.connection.db.admin().ping();
  }
  console.log(`[db] connected to MongoDB at ${uri}`);
}
