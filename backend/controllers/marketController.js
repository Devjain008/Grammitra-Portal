import { Business, Product } from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Register a new village business
// @route   POST /api/market/business
// @access  Private
export const createBusiness = async (req, res) => {
  try {
    // Inject ownerId from authenticated user
    const business = new Business({ 
      ...req.body, 
      ownerId: req.user._id,
      village: req.body.village || req.user.village,
      district: req.body.district || req.user.district,
      state: req.body.state || req.user.state,
      contactNumber: req.body.contactNumber || req.user.mobile,
    });
    
    const createdBusiness = await business.save();
    res.status(201).json(createdBusiness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add a product to a business
// @route   POST /api/market/product
// @access  Private
export const addProduct = async (req, res) => {
  try {
    // Find the user's business if businessId is not provided
    let businessId = req.body.businessId;
    if (!businessId) {
      const business = await Business.findOne({ ownerId: req.user._id });
      if (!business) {
        return res.status(404).json({ message: 'Please register your business/shop first.' });
      }
      businessId = business._id;
    }

    const product = new Product({ 
      ...req.body, 
      businessId,
      sellerId: req.user._id 
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all available products (with filters for category and village)
// @route   GET /api/market/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, inStock } = req.query;
    let query = { isActive: true };

    if (category && category !== 'all') query.category = category;
    if (inStock === 'true') query.stock = { $gt: 0 };

    // Fetch products, populate the business details, and sort
    const products = await Product.find(query)
      .populate('businessId', 'name village type contactNumber ownerId location')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my registered business
// @route   GET /api/market/my-business
// @access  Private
export const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user._id });
    if (!business) {
      return res.status(404).json({ message: 'No business found for this user.' });
    }
    res.status(200).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product from a business
// @route   DELETE /api/market/product/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    // Verify ownership
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product.' });
    }
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new marketplace order
// @route   POST /api/market/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, contactNumber, location } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in the order.' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }
    if (!contactNumber) {
      return res.status(400).json({ message: 'Contact number is required.' });
    }

    // Group items by businessId
    const itemsByBusiness = {};
    for (const item of items) {
      const product = await Product.findById(item.productId).populate('businessId');
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
      }

      const bizId = product.businessId._id.toString();
      if (!itemsByBusiness[bizId]) {
        itemsByBusiness[bizId] = {
          businessId: product.businessId._id,
          shopkeeperId: product.businessId.ownerId,
          items: [],
          totalAmount: 0
        };
      }

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();

      const discountedPrice = product.discount > 0 
        ? Math.round(product.price * (1 - product.discount / 100))
        : product.price;

      itemsByBusiness[bizId].items.push({
        productId: product._id,
        name: product.name,
        price: discountedPrice,
        quantity: item.quantity,
        unit: product.unit || 'Kg'
      });
      itemsByBusiness[bizId].totalAmount += discountedPrice * item.quantity;
    }

    // Create orders and emit socket notifications
    const ordersCreated = [];
    const io = req.app.get('socketio');

    for (const bizId in itemsByBusiness) {
      const group = itemsByBusiness[bizId];
      const order = new Order({
        buyerId: req.user._id,
        shopkeeperId: group.shopkeeperId,
        businessId: group.businessId,
        items: group.items,
        totalAmount: group.totalAmount,
        shippingAddress,
        contactNumber,
        location: location || undefined,
        paymentMethod: 'COD'
      });

      const savedOrder = await order.save();
      const populatedOrder = await savedOrder.populate([
        { path: 'buyerId', select: 'fullName mobile' },
        { path: 'businessId', select: 'name address village contactNumber ownerId' }
      ]);

      ordersCreated.push(populatedOrder);

      // Emit socket notification to shopkeeper
      if (io) {
        io.to(group.shopkeeperId.toString()).emit('notification', {
          type: 'NEW_ORDER',
          message: `New order of ₹${populatedOrder.totalAmount} received for ${populatedOrder.businessId.name}!`,
          order: populatedOrder
        });
      }
    }

    res.status(201).json(ordersCreated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get buyer's order history
// @route   GET /api/market/orders/buyer
// @access  Private
export const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate('businessId', 'name address village contactNumber')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shopkeeper's received orders
// @route   GET /api/market/orders/shopkeeper
// @access  Private
export const getShopkeeperOrders = async (req, res) => {
  try {
    const query = { shopkeeperId: req.user._id };
    if (req.query.businessId) {
      query.businessId = req.query.businessId;
    }
    const orders = await Order.find(query)
      .populate('buyerId', 'fullName mobile')
      .populate('businessId', 'name address village')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/market/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'completed', 'cancelled'

    if (!['accepted', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Verify authorization
    const isShopkeeper = order.shopkeeperId.toString() === req.user._id.toString();
    const isBuyer = order.buyerId.toString() === req.user._id.toString();

    if (!isShopkeeper && !isBuyer) {
      return res.status(403).json({ message: 'Not authorized to update this order.' });
    }

    if (status === 'accepted' && !isShopkeeper) {
      return res.status(403).json({ message: 'Only vendors can accept orders.' });
    }
    if (status === 'completed' && !isShopkeeper) {
      return res.status(403).json({ message: 'Only vendors can mark orders as completed.' });
    }

    // If cancelled, increment stock back
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
      const { cancelReason } = req.body;
      order.cancelReason = cancelReason || (isShopkeeper ? 'Cancelled by Seller' : 'Cancelled by Buyer');
      order.cancelledBy = isShopkeeper ? 'seller' : 'buyer';
    }

    order.status = status;
    const updatedOrder = await order.save();
    const populatedOrder = await updatedOrder.populate([
      { path: 'buyerId', select: 'fullName mobile' },
      { path: 'businessId', select: 'name address village contactNumber' }
    ]);

    // Notify other party about status change
    const io = req.app.get('socketio');
    if (io) {
      const targetId = isShopkeeper ? order.buyerId.toString() : order.shopkeeperId.toString();
      io.to(targetId).emit('notification', {
        type: 'ORDER_UPDATE',
        message: `Your order for ${populatedOrder.businessId.name} has been ${status}.`,
        order: populatedOrder
      });
    }

    res.status(200).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registered businesses of current user
// @route   GET /api/market/my-businesses
// @access  Private
export const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user._id });
    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBusinesses = async (req, res) => {
  try {
    const { village } = req.query;
    let query = { isActive: true };
    if (village) {
      query.village = new RegExp('^' + village.trim() + '$', 'i');
    }
    const businesses = await Business.find(query).sort({ createdAt: -1 });

    const businessesWithProducts = [];
    for (const biz of businesses) {
      const products = await Product.find({ businessId: biz._id, isActive: true });
      businessesWithProducts.push({
        ...biz.toObject(),
        products
      });
    }

    res.status(200).json(businessesWithProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review for a product
// @route   POST /api/market/products/:id/review
// @access  Private
export const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating between 1 and 5.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product.' });
    }

    const review = {
      userId: req.user._id,
      name: req.user.fullName || 'User',
      rating: Number(rating),
      comment: comment || '',
    };

    product.reviews.push(review);
    product.totalRatings = product.reviews.length;
    const totalRatingSum = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    product.rating = Math.round((totalRatingSum / product.reviews.length) * 10) / 10;

    await product.save();

    const populatedProduct = await product.populate('businessId', 'name village type contactNumber ownerId location');

    res.status(201).json({ message: 'Review added successfully', product: populatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};