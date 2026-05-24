import User from '../models/User.js';
import { Business } from '../models/Product.js';
import Job from '../models/Job.js';

// @desc    Get overall performance metrics by village
// @route   GET /api/admin/village-performance
// @access  Private/Admin
export const getVillagePerformance = async (req, res) => {
  try {
    // 1. Group users by village
    const userStats = await User.aggregate([
      { $match: { village: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { $trim: { input: "$village" } },
          usersCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Group businesses by village
    const businessStats = await Business.aggregate([
      { $match: { village: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { $trim: { input: "$village" } },
          businessesCount: { $sum: 1 }
        }
      }
    ]);

    // 3. Group jobs by village
    const jobStats = await Job.aggregate([
      { $match: { village: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { $trim: { input: "$village" } },
          jobsCount: { $sum: 1 },
          activeJobs: { $sum: { $cond: ["$isActive", 1, 0] } }
        }
      }
    ]);

    // Combine stats
    const performanceMap = {};

    userStats.forEach(item => {
      const village = item._id;
      if (!performanceMap[village]) {
        performanceMap[village] = { village, usersCount: 0, businessesCount: 0, jobsCount: 0, activeJobs: 0 };
      }
      performanceMap[village].usersCount = item.usersCount;
    });

    businessStats.forEach(item => {
      const village = item._id;
      if (!performanceMap[village]) {
        performanceMap[village] = { village, usersCount: 0, businessesCount: 0, jobsCount: 0, activeJobs: 0 };
      }
      performanceMap[village].businessesCount = item.businessesCount;
    });

    jobStats.forEach(item => {
      const village = item._id;
      if (!performanceMap[village]) {
        performanceMap[village] = { village, usersCount: 0, businessesCount: 0, jobsCount: 0, activeJobs: 0 };
      }
      performanceMap[village].jobsCount = item.jobsCount;
      performanceMap[village].activeJobs = item.activeJobs;
    });

    const performanceList = Object.values(performanceMap);
    
    res.status(200).json(performanceList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
