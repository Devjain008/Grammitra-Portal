import Job from '../models/Job.js';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res) => {
  try {
    const job = new Job({ 
      ...req.body, 
      postedBy: req.user._id,
      businessId: req.body.businessId || undefined,
      village: req.body.village || req.user.village,
      district: req.body.district || req.user.district,
      state: req.body.state || req.user.state,
      location: req.body.location || req.user.location
    });
    const createdJob = await job.save();
    const populatedJob = await createdJob.populate('businessId', 'name location village district state contactNumber ownerId');
    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all active jobs (with filters)
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const { category, village, isRemote } = req.query;
    let query = { isActive: true };

    if (category && category !== 'all') query.category = category;
    if (village) query.village = village;
    if (isRemote) query.isRemote = isRemote === 'true';

    // Fetch jobs, populate business details, and sort by newest first
    const jobs = await Job.find(query)
      .populate('businessId', 'name location village district state contactNumber ownerId')
      .sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private
export const applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.filledCount >= job.totalRequired) {
      return res.status(400).json({ message: 'This position has already been filled' });
    }

    // Check if user has already applied
    const alreadyApplied = job.applicants.some(
      (app) => app.userId.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Register applicant
    job.applicants.push({
      userId: req.user._id,
      name: req.user.fullName || req.user.name || 'Villager',
      mobile: req.user.mobile,
      appliedAt: new Date(),
      status: 'applied'
    });

    const updatedJob = await job.save();
    const populatedJob = await updatedJob.populate('businessId', 'name location village district state contactNumber ownerId');

    // Broadcast the job update via Socket.io for real-time frontend syncing
    const io = req.app.get('socketio');
    if (io) {
      io.emit('job_updated', populatedJob);
    }

    res.status(200).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all jobs posted by the logged-in user
// @route   GET /api/jobs/posted
// @access  Private
export const getPostedJobs = async (req, res) => {
  try {
    const query = { postedBy: req.user._id };
    if (req.query.businessId) {
      query.businessId = req.query.businessId;
    }
    const jobs = await Job.find(query)
      .populate('businessId', 'name location village district state contactNumber ownerId')
      .populate('applicants.userId', 'fullName mobile village location')
      .sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update applicant status (applied, shortlisted, hired, rejected)
// @route   PUT /api/jobs/:id/applicants/:userId/status
// @access  Private
export const updateApplicantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['applied', 'shortlisted', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    const applicant = job.applicants.find(
      app => app.userId.toString() === req.params.userId.toString()
    );

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const oldStatus = applicant.status;
    if (oldStatus === status) {
      return res.status(200).json(job);
    }

    const { default: Employee } = await import('../models/Employee.js');

    if (status === 'hired') {
      if (job.filledCount >= job.totalRequired) {
        return res.status(400).json({ message: 'All positions for this job are already filled' });
      }
      job.filledCount += 1;

      // Auto-create Employee profile
      const employee = new Employee({
        businessOwnerId: req.user._id,
        businessId: job.businessId || undefined,
        userId: applicant.userId,
        name: applicant.name,
        mobile: applicant.mobile,
        role: job.title,
        salary: job.salaryMin || 0,
        salaryType: job.salaryType || 'monthly'
      });
      await employee.save();
    } else if (oldStatus === 'hired' && status !== 'hired') {
      // Decrement filled slots and remove Employee record
      job.filledCount = Math.max(0, job.filledCount - 1);
      await Employee.deleteOne({
        businessOwnerId: req.user._id,
        userId: applicant.userId
      });
    }

    applicant.status = status;
    const updatedJob = await job.save();
    const populatedJob = await updatedJob.populate([
      { path: 'businessId', select: 'name location village district state contactNumber ownerId' },
      { path: 'applicants.userId', select: 'fullName mobile village location' }
    ]);

    // Broadcast the job update via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('job_updated', populatedJob);
    }

    res.status(200).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review for a job/employer
// @route   POST /api/jobs/:id/review
// @access  Private
export const addJobReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const alreadyReviewed = job.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this job.' });
    }

    const review = {
      userId: req.user._id,
      name: req.user.fullName || 'User',
      rating: Number(rating),
      comment: comment || '',
    };

    job.reviews.push(review);
    job.totalRatings = job.reviews.length;
    const totalRatingSum = job.reviews.reduce((acc, item) => item.rating + acc, 0);
    job.rating = Math.round((totalRatingSum / job.reviews.length) * 10) / 10;

    await job.save();

    const populatedJob = await job.populate('businessId', 'name location village district state contactNumber ownerId');

    // Broadcast the job update via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('job_updated', populatedJob);
    }

    res.status(201).json({ message: 'Review added successfully', job: populatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel job application
// @route   POST /api/jobs/:id/cancel-apply
// @access  Private
export const cancelApplyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is an applicant
    const isApplicant = job.applicants.some(
      (app) => app.userId.toString() === req.user._id.toString()
    );

    if (!isApplicant) {
      return res.status(400).json({ message: 'You have not applied for this job' });
    }

    const applicant = job.applicants.find(
      (app) => app.userId.toString() === req.user._id.toString()
    );

    // If already hired, decrement filled count
    if (applicant.status === 'hired') {
      job.filledCount = Math.max(0, job.filledCount - 1);
      const { default: Employee } = await import('../models/Employee.js');
      await Employee.deleteOne({
        businessOwnerId: job.postedBy,
        userId: req.user._id
      });
    }

    // Remove user from applicants list
    job.applicants = job.applicants.filter(
      (app) => app.userId.toString() !== req.user._id.toString()
    );

    const updatedJob = await job.save();
    const populatedJob = await updatedJob.populate('businessId', 'name location village district state contactNumber ownerId');

    const io = req.app.get('socketio');
    if (io) {
      io.emit('job_updated', populatedJob);
    }

    res.status(200).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};