import Scheme from '../models/Scheme.js';

// @desc    Create a new government scheme
// @route   POST /api/schemes
export const createScheme = async (req, res) => {
  try {
    const scheme = new Scheme(req.body);
    const createdScheme = await scheme.save();
    res.status(201).json(createdScheme);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all active schemes (with category and state filters)
// @route   GET /api/schemes
export const getSchemes = async (req, res) => {
  try {
    const { category, state } = req.query;
    
    // Base query: Only show active schemes
    let query = { isActive: true };

    // Filter by specific categories (e.g., show only 'farmer' schemes)
    if (category) {
      // Split comma-separated categories if user has multiple (e.g., 'farmer,student')
      const categories = category.split(','); 
      query.category = { $in: categories };
    }

    // Filter by State (Match user's state OR Central government schemes)
    if (state) {
      query.$or = [{ state: state }, { state: 'Central' }];
    }

    // Sort by deadline so closing schemes appear first, then by newest created
    const schemes = await Scheme.find(query)
      .sort({ deadline: 1, createdAt: -1 });

    res.status(200).json(schemes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a view/click on a scheme
// @route   PUT /api/schemes/:id/view
export const incrementSchemeViews = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.status(200).json(scheme);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};