import Labour from '../models/Labour.js';

// @desc    Register a new labour profile
// @route   POST /api/labour
// @access  Private
export const createLabourProfile = async (req, res) => {
  try {
    // Check if a profile already exists for this user
    const existingProfile = await Labour.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'You have already registered a labour profile.' });
    }

    const { coordinates, ...restOfBody } = req.body;

    const labour = new Labour({ 
      ...restOfBody,
      userId: req.user._id,
      name: req.user.fullName || req.body.name || req.user.name || 'Worker',
      contactNumber: req.body.contactNumber || req.user.mobile || '9999999999',
      village: req.user.village || req.body.village || 'Rampur',
      district: req.user.district || req.body.district || 'Patna',
      state: req.user.state || req.body.state || 'Bihar'
    });

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      labour.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])]
      };
    }
    
    const createdProfile = await labour.save();
    res.status(201).json(createdProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get available labourers (with filters for skill and location)
// @route   GET /api/labour
// @access  Public
export const getLabours = async (req, res) => {
  try {
    const { skill, village, isAvailable } = req.query;
    let query = { isActive: true };

    if (skill && skill !== 'all') query.skill = skill;
    if (village) query.village = village;
    if (isAvailable) query.isAvailable = isAvailable === 'true';

    // Fetch matching labourers and sort by highest rating first
    const labours = await Labour.find(query)
      .populate('userId', 'gender')
      .sort({ rating: -1 });
    res.status(200).json(labours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get authenticated user's labour profile
// @route   GET /api/labour/my-profile
// @access  Private
export const getMyLabourProfile = async (req, res) => {
  try {
    const profile = await Labour.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Labour profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update authenticated user's labour profile
// @route   PUT /api/labour/my-profile
// @access  Private
export const updateMyLabourProfile = async (req, res) => {
  try {
    let profile = await Labour.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Labour profile not found.' });
    }

    const allowedUpdates = [
      'skill', 'experience', 'serviceCharge', 'chargeType', 
      'contactNumber', 'whatsapp', 'village', 'district', 
      'state', 'workingRadius', 'isAvailable', 'bio', 'profileImage'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (req.body.coordinates && Array.isArray(req.body.coordinates) && req.body.coordinates.length === 2) {
      profile.location = {
        type: 'Point',
        coordinates: [Number(req.body.coordinates[0]), Number(req.body.coordinates[1])]
      };
    }

    profile.name = req.user.fullName || profile.name || 'Worker';

    const updatedProfile = await profile.save();
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete authenticated user's labour profile
// @route   DELETE /api/labour/my-profile
// @access  Private
export const deleteMyLabourProfile = async (req, res) => {
  try {
    const deletedProfile = await Labour.findOneAndDelete({ userId: req.user._id });
    if (!deletedProfile) {
      return res.status(404).json({ message: 'Labour profile not found' });
    }
    res.status(200).json({ message: 'Labour profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request service from a worker (submits request & emits socket notification)
// @route   POST /api/labour/:id/request
// @access  Private
export const requestLabourService = async (req, res) => {
  try {
    const targetLabour = await Labour.findById(req.params.id);
    if (!targetLabour) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }

    const requesterName = req.user.fullName || req.user.name || 'Villager';
    const requesterMobile = req.user.mobile || '';
    const { clientLocation, note, dateTime, offerAmount } = req.body;

    const newRequest = {
      requesterId: req.user._id,
      requesterName,
      requesterMobile,
      village: clientLocation?.village || req.user.village || 'Nearby',
      coordinates: clientLocation?.coordinates || req.user.location?.coordinates || [],
      note: note || '',
      dateTime: dateTime ? new Date(dateTime) : undefined,
      offerAmount: offerAmount ? Number(offerAmount) : undefined,
      status: 'pending',
      createdAt: new Date()
    };

    targetLabour.serviceRequests.unshift(newRequest);
    await targetLabour.save();

    // Trigger Real-Time notification via socket to the worker's user ID room
    const io = req.app.get('socketio');
    if (io) {
      const formattedDate = newRequest.dateTime ? new Date(newRequest.dateTime).toLocaleString() : 'N/A';
      const formattedAmount = newRequest.offerAmount ? `₹${newRequest.offerAmount}` : 'N/A';

      const notificationPayload = {
        id: Date.now().toString(),
        type: 'SERVICE_REQUEST',
        title: 'New Service Request',
        titleHindi: 'नया सेवा अनुरोध',
        message: `${requesterName} requested your service on ${formattedDate} for ${formattedAmount}. Location: ${newRequest.village}. Contact: ${requesterMobile}`,
        messageHindi: `${requesterName} ने ${formattedDate} को ${formattedAmount} में आपकी सेवा का अनुरोध किया। स्थान: ${newRequest.village}। संपर्क: ${requesterMobile}`,
        requester: {
          id: req.user._id,
          fullName: requesterName,
          mobile: requesterMobile,
          village: newRequest.village
        },
        clientLocation: {
          village: newRequest.village,
          coordinates: newRequest.coordinates
        },
        note: newRequest.note,
        dateTime: newRequest.dateTime,
        offerAmount: newRequest.offerAmount,
        createdAt: newRequest.createdAt.toISOString()
      };

      io.to(targetLabour.userId.toString()).emit('notification', notificationPayload);
    }

    res.status(200).json({ message: 'Service request sent successfully', request: newRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a service request status (accept or decline)
// @route   PUT /api/labour/requests/:requestId
// @access  Private
export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const labour = await Labour.findOne({ userId: req.user._id });
    if (!labour) {
      return res.status(404).json({ message: 'Labour profile not found.' });
    }

    const request = labour.serviceRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found.' });
    }

    request.status = status;
    await labour.save();

    res.status(200).json({ message: `Service request ${status} successfully.`, profile: labour });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review for a worker
// @route   POST /api/labour/:id/review
// @access  Private
export const addLabourReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
    }

    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Labour profile not found.' });
    }

    const alreadyReviewed = labour.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this worker.' });
    }

    const review = {
      userId: req.user._id,
      name: req.user.fullName || 'User',
      rating: Number(rating),
      comment: comment || '',
    };

    labour.reviews.push(review);
    labour.totalRatings = labour.reviews.length;
    const totalRatingSum = labour.reviews.reduce((acc, item) => item.rating + acc, 0);
    labour.rating = Math.round((totalRatingSum / labour.reviews.length) * 10) / 10;

    await labour.save();
    res.status(201).json({ message: 'Review added successfully', profile: labour });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel service request by requester
// @route   DELETE /api/labour/requests/:id/:requestId/cancel
// @access  Private
export const cancelServiceRequest = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    const request = labour.serviceRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Service request not found.' });
    }

    // Verify requester matches logged-in user
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this request.' });
    }

    // Remove request from serviceRequests list
    labour.serviceRequests = labour.serviceRequests.filter(r => r._id.toString() !== req.params.requestId);
    await labour.save();

    res.status(200).json({ message: 'Service request cancelled successfully.', profile: labour });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};