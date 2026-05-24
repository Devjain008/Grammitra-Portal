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

    const jobsColl = db.collection('jobs');
    const jobs = await jobsColl.find({}).toArray();
    console.log(`\nFound ${jobs.length} jobs:`);
    jobs.forEach(job => {
      console.log({
        id: job._id,
        title: job.title,
        company: job.company,
        village: job.village,
        location: job.location,
        postedBy: job.postedBy,
        businessId: job.businessId
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
