import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grammitra';

async function inspect() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\nCollections list:');
    collections.forEach(c => console.log(' -', c.name));

    const labourColl = db.collection('labour');
    const labours = await labourColl.find({}).toArray();
    console.log(`\nFound ${labours.length} labours:`);
    labours.forEach(labour => {
      console.log({
        id: labour._id,
        userId: labour.userId,
        name: labour.name,
        skill: labour.skill,
        contactNumber: labour.contactNumber,
        village: labour.village
      });
    });

  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

inspect();
