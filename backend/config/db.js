import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (uri && uri !== 'mongodb://127.0.0.1:27017/grammitra') {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`🌿 MongoDB Connected (configured URI): ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️ Configuration MONGO_URI failed (${error.message}). Falling back to local MongoDB...`);
    }
  }

  try {
    const localUri = 'mongodb://127.0.0.1:27017/grammitra';
    const conn = await mongoose.connect(localUri);
    console.log(`🌿 MongoDB Connected (Local Fallback): ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;