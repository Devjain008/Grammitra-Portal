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
    
    const usersColl = db.collection('users');
    const users = await usersColl.find({}).toArray();
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        categories: user.categories,
        role: user.role
      });
    });

    const laboursColl = db.collection('labours');
    const labours = await laboursColl.find({}).toArray();
    console.log(`\nFound ${labours.length} labour profiles:`);
    labours.forEach(l => {
      console.log({
        id: l._id,
        userId: l.userId,
        name: l.name,
        skill: l.skill,
        village: l.village,
        district: l.district,
        state: l.state
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
