import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { ChatRoom } from '../models/Message.js';

// ─── ANNOUNCEMENTS ─────────────────────────────────────────────────────────

// @desc    Post a new announcement
// @route   POST /api/education/announcements
// @access  Private (Teacher only)
export const createAnnouncement = async (req, res) => {
  try {
    const { content, batchId } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required.' });
    if (!req.user.categories.includes('teacher'))
      return res.status(403).json({ message: 'Only teachers can post announcements.' });

    let batchName = '';
    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (!batch) return res.status(404).json({ message: 'Batch not found.' });
      if (batch.teacherId.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Only the teacher of this batch can post announcements.' });
      batchName = batch.batchName;
    }

    const announcement = new Announcement({
      teacherId: req.user._id,
      teacherName: req.user.fullName || 'Teacher',
      content,
      village: req.user.village,
      batchId: batchId || null,
      batchName: batchName || '',
    });
    const saved = await announcement.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const userVillage = req.user.village;
    if (!userVillage) return res.status(200).json([]);

    // Find student's enrolled batches
    const studentBatches = await Batch.find({ 'students.userId': req.user._id }).select('_id');
    const batchIds = studentBatches.map(b => b._id);

    const announcements = await Announcement.find({
      village: userVillage,
      $or: [
        { batchId: null },
        { batchId: { $exists: false } },
        { batchId: { $in: batchIds } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── TEACHER REGISTRATION ──────────────────────────────────────────────────

// @desc    Register/update teacher profile
// @route   POST /api/education/register-teacher
// @access  Private
export const registerAsTeacher = async (req, res) => {
  try {
    const { subject, qualification, contact, experience } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.categories.includes('teacher')) user.categories.push('teacher');
    user.teacherSubject = subject || '';
    user.teacherQualifications = qualification || '';
    user.teacherContact = contact || user.mobile || '';
    user.teacherExperience = experience || '';

    const updated = await user.save();
    res.status(200).json({
      _id: updated._id,
      fullName: updated.fullName,
      mobile: updated.mobile,
      email: updated.email,
      village: updated.village,
      district: updated.district,
      state: updated.state,
      gender: updated.gender,
      categories: updated.categories,
      role: updated.role,
      teacherSubject: updated.teacherSubject || '',
      teacherQualifications: updated.teacherQualifications || '',
      teacherExperience: updated.teacherExperience || '',
      teacherContact: updated.teacherContact || '',
      notifications: updated.notifications,
      orderNotifications: updated.orderNotifications,
      serviceNotifications: updated.serviceNotifications,
      chatNotifications: updated.chatNotifications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all teachers in the user's village
// @route   GET /api/education/teachers
// @access  Private
export const getVillageTeachers = async (req, res) => {
  try {
    const villageName = req.user.village;
    if (!villageName) return res.status(200).json([]);
    
    // Find all teachers in the village
    const teachers = await User.find({ village: villageName, categories: 'teacher' })
      .select('fullName email mobile profileImage teacherSubject teacherQualifications teacherContact teacherExperience bio gender rating totalRatings teacherReviews');
    
    // Fetch batches for these teachers
    const teacherIds = teachers.map(t => t._id);
    const batches = await Batch.find({ teacherId: { $in: teacherIds }, isActive: true });
    
    // Group and map batches to teachers
    const teachersWithBatches = teachers.map(t => {
      const teacherBatches = batches.filter(b => b.teacherId.toString() === t._id.toString());
      return {
        ...t.toObject(),
        batches: teacherBatches.map(b => ({
          _id: b._id,
          batchName: b.batchName,
          className: b.className,
          subject: b.subject
        }))
      };
    });

    res.status(200).json(teachersWithBatches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── BATCH MANAGEMENT ──────────────────────────────────────────────────────

// @desc    Create a new batch
// @route   POST /api/education/batches
// @access  Private (Teacher)
export const createBatch = async (req, res) => {
  try {
    if (!req.user.categories.includes('teacher'))
      return res.status(403).json({ message: 'Only teachers can create batches.' });

    const { batchName, className, subject } = req.body;
    if (!batchName || !className)
      return res.status(400).json({ message: 'Batch name and class are required.' });

    // Create a linked group chat room for this batch
    const chatRoom = await ChatRoom.create({
      roomType: 'group',
      roomName: `${batchName} — ${className}`,
      participants: [req.user._id],
      adminIds: [req.user._id],
    });

    const batch = await Batch.create({
      teacherId: req.user._id,
      teacherName: req.user.fullName,
      batchName,
      className,
      subject: subject || '',
      village: req.user.village || '',
      chatRoomId: chatRoom._id,
    });

    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get teacher's own batches
// @route   GET /api/education/batches
// @access  Private (Teacher)
export const getMyBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get student's enrolled batches
// @route   GET /api/education/my-batches
// @access  Private (Student)
export const getStudentBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ 'students.userId': req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single batch details (with student profiles)
// @route   GET /api/education/batches/:batchId
// @access  Private (Teacher of that batch)
export const getBatchDetails = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    // Fetch full user profiles for students
    const userIds = batch.students.map(s => s.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName email mobile profileImage village district gender');

    const usersMap = {};
    users.forEach(u => { usersMap[u._id.toString()] = u; });

    const enrichedStudents = batch.students.map(s => ({
      ...s.toObject(),
      profile: usersMap[s.userId.toString()] || null
    }));

    res.status(200).json({ ...batch.toObject(), students: enrichedStudents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add student to batch by Gmail/email or Mobile number (supports comma-separated batches/bulk)
// @route   POST /api/education/batches/:batchId/add-student
// @access  Private (Teacher)
export const addStudentToBatch = async (req, res) => {
  try {
    const { email } = req.body; // Can be a single item or comma-separated batch list
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Please provide Gmail addresses or mobile numbers.' });
    }

    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    // 1. Parse comma-separated, semicolon-separated, or space-separated batch items
    const items = email.split(/[\s,;\n\r]+/).map(item => item.trim()).filter(Boolean);
    if (items.length === 0) {
      return res.status(400).json({ message: 'No valid Gmail addresses or mobile numbers found in inputs.' });
    }

    // 2. Separate into emails and mobiles
    const emails = [];
    const mobiles = [];
    items.forEach(item => {
      if (item.includes('@')) {
        emails.push(item.toLowerCase());
      } else {
        // Strip any country prefix or non-numeric characters for simple mobile matches
        const cleanMobile = item.replace(/\D/g, '');
        if (cleanMobile.length >= 10) {
          mobiles.push(cleanMobile.slice(-10)); // Take last 10 digits
        } else if (item.length > 0) {
          mobiles.push(item);
        }
      }
    });

    // 3. Query all users matching either emails or mobiles
    const foundStudents = await User.find({
      $or: [
        { email: { $in: emails } },
        { mobile: { $in: mobiles } }
      ]
    });

    if (foundStudents.length === 0) {
      return res.status(404).json({ 
        message: 'No registered students found matching the provided Gmail addresses or mobile numbers.' 
      });
    }

    // 4. Filter and add new students
    const addedNames = [];
    const existingNames = [];
    const addedUserIds = [];

    foundStudents.forEach(student => {
      const alreadyIn = batch.students.some(s => s.userId.toString() === student._id.toString());
      if (alreadyIn) {
        existingNames.push(student.fullName || student.email || student.mobile);
      } else {
        batch.students.push({
          userId: student._id,
          email: student.email,
          fullName: student.fullName,
        });
        addedUserIds.push(student._id);
        addedNames.push(student.fullName || student.email || student.mobile);
      }
    });

    // 5. Update linked Chat Room participants
    if (batch.chatRoomId && addedUserIds.length > 0) {
      await ChatRoom.findByIdAndUpdate(batch.chatRoomId, {
        $addToSet: { participants: { $each: addedUserIds } }
      });
    }

    await batch.save();

    // 6. Identify items that were not found in the database
    const foundEmails = foundStudents.map(s => s.email?.toLowerCase());
    const foundMobiles = foundStudents.map(s => s.mobile);
    const notFound = items.filter(item => {
      const clean = item.toLowerCase();
      // Match by exact email or trailing 10-digit mobile phone matches
      const cleanMobile = clean.replace(/\D/g, '');
      const hasMobileMatch = foundMobiles.some(m => m === clean || (cleanMobile.length >= 10 && m.slice(-10) === cleanMobile.slice(-10)));
      return !foundEmails.includes(clean) && !hasMobileMatch;
    });

    // 7. Build custom user response
    let statusMessage = '';
    if (addedNames.length > 0) {
      statusMessage += `${addedNames.length} student(s) added successfully. `;
    }
    if (existingNames.length > 0) {
      statusMessage += `${existingNames.length} student(s) were already enrolled. `;
    }
    if (notFound.length > 0) {
      statusMessage += `${notFound.length} input(s) were not found.`;
    }

    res.status(200).json({
      message: statusMessage.trim(),
      addedCount: addedNames.length,
      addedNames,
      existingNames,
      notFound,
      batch
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Student requests to join a batch
// @route   POST /api/education/batches/:batchId/request-join
// @access  Private (Student)
export const requestJoinBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });

    const alreadyIn = batch.students.some(s => s.userId.toString() === req.user._id.toString());
    if (alreadyIn) return res.status(400).json({ message: 'You are already in this batch.' });

    const alreadyRequested = batch.joinRequests.some(
      r => r.userId.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (alreadyRequested) return res.status(400).json({ message: 'Join request already sent.' });

    batch.joinRequests.push({
      userId: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
    });
    await batch.save();
    res.status(200).json({ message: 'Join request sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Teacher approves/rejects a join request
// @route   PUT /api/education/batches/:batchId/join-requests/:requestId
// @access  Private (Teacher)
export const handleJoinRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    const request = batch.joinRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'approve') {
      request.status = 'approved';
      batch.students.push({
        userId: request.userId,
        email: request.email,
        fullName: request.fullName,
      });

      // Add to chat room
      if (batch.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(batch.chatRoomId, {
          $addToSet: { participants: request.userId }
        });
      }
    } else {
      request.status = 'rejected';
    }

    await batch.save();
    res.status(200).json({ message: `Request ${action}d.`, batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Remove a student from a batch
// @route   DELETE /api/education/batches/:batchId/students/:userId
// @access  Private (Teacher)
export const removeStudentFromBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    batch.students = batch.students.filter(s => s.userId.toString() !== req.params.userId);

    // Remove from chat room too
    if (batch.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(batch.chatRoomId, {
        $pull: { participants: req.params.userId }
      });
    }

    await batch.save();
    res.status(200).json({ message: 'Student removed.', batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update fees for a batch
// @route   PUT /api/education/batches/:batchId/fees
// @access  Private (Teacher)
export const updateFees = async (req, res) => {
  try {
    const { fees } = req.body; // array of { label, amount, dueDate }
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    batch.fees = fees || [];
    await batch.save();
    res.status(200).json({ message: 'Fees updated.', fees: batch.fees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark attendance for a date
// @route   POST /api/education/batches/:batchId/attendance
// @access  Private (Teacher)
export const markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // date: 'YYYY-MM-DD', records: [{ userId, present }]
    if (!date || !records) return res.status(400).json({ message: 'Date and records are required.' });

    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    // Replace or add attendance for this date
    const existingIndex = batch.attendance.findIndex(a => a.date === date);
    if (existingIndex >= 0) {
      batch.attendance[existingIndex].records = records;
    } else {
      batch.attendance.push({ date, records });
    }

    await batch.save();
    res.status(200).json({ message: 'Attendance marked.', attendance: batch.attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark student fee as paid/unpaid
// @route   PUT /api/education/batches/:batchId/students/:userId/fees/:feeId
// @access  Private (Teacher)
export const markFeePaid = async (req, res) => {
  try {
    const { paid } = req.body;
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found.' });
    if (batch.teacherId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied.' });

    const student = batch.students.find(s => s.userId.toString() === req.params.userId);
    if (!student) return res.status(404).json({ message: 'Student not in batch.' });

    student.feesPaid = student.feesPaid || new Map();
    student.feesPaid.set(req.params.feeId, paid === true || paid === 'true');
    batch.markModified('students');
    await batch.save();
    res.status(200).json({ message: 'Fee status updated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add review for a teacher profile
// @route   POST /api/education/teachers/:id/review
// @access  Private
export const addTeacherReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
    }

    const teacher = await User.findOne({ _id: req.params.id, categories: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const alreadyReviewed = teacher.teacherReviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this teacher.' });
    }

    const review = {
      userId: req.user._id,
      name: req.user.fullName || 'User',
      rating: Number(rating),
      comment: comment || '',
    };

    teacher.teacherReviews.push(review);
    teacher.totalRatings = teacher.teacherReviews.length;
    const totalRatingSum = teacher.teacherReviews.reduce((acc, item) => item.rating + acc, 0);
    teacher.rating = Math.round((totalRatingSum / teacher.teacherReviews.length) * 10) / 10;

    await teacher.save();

    // Map batches to teacher for return payload
    const batches = await Batch.find({ teacherId: teacher._id, isActive: true });
    const formattedTeacher = {
      ...teacher.toObject(),
      batches: batches.map(b => ({
        _id: b._id,
        batchName: b.batchName,
        className: b.className,
        subject: b.subject
      }))
    };

    res.status(201).json({ message: 'Review added successfully', profile: formattedTeacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
