import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grammitra';

async function inspect() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const labourColl = db.collection('labours'); // Mongoose defaults to plural 'labours' or maybe 'labours' or 'labour'. The output above said 'labour'. Let's check 'labour'.
    const labour = await db.collection('labours').findOne({ name: 'Baldev' }) || await db.collection('labour').findOne({ name: 'Baldev' });
    if (!labour) {
      console.log('Labour not found!');
      return;
    }
    console.log('Labour found:', labour.name);
    console.log('Service requests:', JSON.stringify(labour.serviceRequests, null, 2));

  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

inspect();
