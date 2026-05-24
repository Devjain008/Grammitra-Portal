import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grammitra';

async function createRequest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const labourColl = db.collection('labour');

    const baldev = await labourColl.findOne({ name: 'Baldev' });
    if (!baldev) {
      console.log('Baldev not found!');
      return;
    }

    const testRequest = {
      requesterId: new mongoose.Types.ObjectId('6a10b07da2336f6f010350aa'), // Mohit
      requesterName: 'Mohit',
      requesterMobile: '9656565656',
      village: 'Rajnagar',
      coordinates: [77.5946, 12.9716],
      note: 'Need electrical repair for my shop.',
      dateTime: new Date('2026-05-25T10:00:00Z'),
      offerAmount: 750,
      status: 'pending',
      createdAt: new Date()
    };

    const result = await labourColl.updateOne(
      { _id: baldev._id },
      { $push: { serviceRequests: { $each: [testRequest], $position: 0 } } }
    );

    console.log('Updated labour requests:', result);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

createRequest();
