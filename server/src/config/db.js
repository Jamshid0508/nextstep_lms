import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  if (mongoose.connection.readyState >= 1) {
    return true;
  }
  await mongoose.connect(env.mongoUri);
  console.log(`[db] MongoDB ulandi: ${mongoose.connection.name}`);
  return true;
}
