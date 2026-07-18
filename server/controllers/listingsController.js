const ClothingItem = require('../models/ClothingItem');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');

// Haversine Distance Helper
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Swap Value Calculator Formula
function calculateSwapValue(category, brand, condition) {
  const categoryPoints = {
    'Outerwear': 50,
    'Tops': 25,
    'Bottoms': 35,
    'Shoes': 45,
    'Accessories': 15,
    'Other': 20
  };

  const luxuryBrands = ['gucci', 'prada', 'chanel', 'louis vuitton', 'balenciaga', 'hermes', 'dior', 'versace', 'rolex', 'burberry', 'saint laurent'];
  const premiumBrands = ['nike', 'adidas', 'zara', 'levis', 'levi\'s', 'under armour', 'puma', 'tommy hilfiger', 'ralph lauren', 'calvin klein', 'patagonia', 'north face', 'the north face', 'gap'];

  const brandLower = (brand || '').toLowerCase().trim();
  let brandPoints = 10; // Default Fast-Fashion / Generic points
  
  if (luxuryBrands.some(b => brandLower.includes(b))) {
    brandPoints = 50;
  } else if (premiumBrands.some(b => brandLower.includes(b))) {
    brandPoints = 25;
  }

  const catScore = categoryPoints[category] || 20;

  const conditionMultipliers = {
    'New': 1.0,
    'Like New': 0.9,
    'Good': 0.75,
    'Fair': 0.5
  };
  const multiplier = conditionMultipliers[condition] || 0.75;

  return Math.round((catScore + brandPoints) * multiplier);
}

// Suggest Listing Value Endpoint
exports.suggestValue = (req, res) => {
  const { category, brand, condition } = req.query;
  if (!category || !brand || !condition) {
    return res.status(400).json({ message: 'Category, brand, and condition are required for suggestion.' });
  }
  const suggestedValue = calculateSwapValue(category, brand, condition);
  res.json({ suggestedValue });
};

// Create Listing
exports.createListing = async (req, res, next) => {
  try {
    const { title, description, category, brand, size, condition, estimatedSwapValue, city, lat, lng } = req.body;

    if (!title || !description || !category || !brand || !size || !condition) {
      return res.status(400).json({ message: 'Missing required listing fields.' });
    }

    // Get owner location info if not passed
    let finalCity = city;
    let finalLat = parseFloat(lat);
    let finalLng = parseFloat(lng);

    if (!finalCity || isNaN(finalLat) || isNaN(finalLng)) {
      const ownerUser = await User.findById(req.user.id);
      if (ownerUser) {
        finalCity = finalCity || ownerUser.location.city;
        finalLat = isNaN(finalLat) ? ownerUser.location.coordinates.lat : finalLat;
        finalLng = isNaN(finalLng) ? ownerUser.location.coordinates.lng : finalLng;
      }
    }

    // Process images
    if (req.files && req.files.length > 5) {
      return res.status(400).json({ message: 'You can only upload up to 5 images.' });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/${file.filename}`);
      });
    }

    const value = estimatedSwapValue ? parseInt(estimatedSwapValue) : calculateSwapValue(category, brand, condition);

    const newItem = new ClothingItem({
      title,
      description,
      category,
      brand,
      size,
      condition,
      images,
      estimatedSwapValue: value,
      owner: req.user.id,
      location: {
        city: finalCity || 'Unknown',
        coordinates: {
          lat: finalLat || 0,
          lng: finalLng || 0
        }
      }
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

// Get All/Filtered Listings
exports.getListings = async (req, res, next) => {
  try {
    const { 
      search, 
      category, 
      size, 
      condition, 
      city, 
      brand,
      minPoints,
      maxPoints,
      sortBy,
      page,
      limit,
      lat, 
      lng, 
      maxDistance, 
      excludeUser 
    } = req.query;

    const query = { status: 'Available' };

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (size) query.size = size;
    if (condition) query.condition = condition;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    
    // Points Value Range Filter
    if (minPoints || maxPoints) {
      query.estimatedSwapValue = {};
      if (minPoints) query.estimatedSwapValue.$gte = parseInt(minPoints);
      if (maxPoints) query.estimatedSwapValue.$lte = parseInt(maxPoints);
    }

    // Exclude currently logged-in user listings if requested
    if (excludeUser) {
      query.owner = { $ne: excludeUser };
    }

    let items = await ClothingItem.find(query)
      .populate('owner', 'name email phone location profilePicture')
      .sort({ createdAt: -1 });

    // Distance/Proximity calculation
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasCoordinates = !isNaN(userLat) && !isNaN(userLng);
    
    if (hasCoordinates) {
      items = items.map(item => {
        const itemLat = item.location.coordinates.lat;
        const itemLng = item.location.coordinates.lng;
        
        let distance = null;
        if (itemLat !== 0 && itemLng !== 0) {
          distance = getDistance(userLat, userLng, itemLat, itemLng);
        }
        
        // Convert Mongoose doc to plain JS object to append property
        const itemObj = item.toObject();
        itemObj.distance = distance !== null ? parseFloat(distance.toFixed(1)) : null;
        return itemObj;
      });

      // Filter by maxDistance if supplied
      if (maxDistance) {
        const maxDistNum = parseFloat(maxDistance);
        items = items.filter(item => item.distance !== null && item.distance <= maxDistNum);
      }

      // Default sorting by distance if coordinates are present and sortBy is not specified
      if (!sortBy) {
        items.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    }

    // Explicit Sorting
    if (sortBy) {
      if (sortBy === 'value_asc') {
        items.sort((a, b) => a.estimatedSwapValue - b.estimatedSwapValue);
      } else if (sortBy === 'value_desc') {
        items.sort((a, b) => b.estimatedSwapValue - a.estimatedSwapValue);
      } else if (sortBy === 'date_desc') {
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'distance_asc' && hasCoordinates) {
        items.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    }

    // Pagination calculations
    const totalItems = items.length;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const totalPages = Math.ceil(totalItems / limitNum);
    const paginatedItems = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Send metadata headers
    res.setHeader('x-total-count', totalItems);
    res.setHeader('x-total-pages', totalPages);
    res.setHeader('x-current-page', pageNum);
    res.setHeader('Access-Control-Expose-Headers', 'x-total-count, x-total-pages, x-current-page');

    res.json(paginatedItems);
  } catch (err) {
    next(err);
  }
};

// Get Single Listing
exports.getListingById = async (req, res, next) => {
  try {
    const item = await ClothingItem.findById(req.params.id)
      .populate('owner', 'name email phone location profilePicture');

    if (!item) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Update Own Listing
exports.updateListing = async (req, res, next) => {
  try {
    const { title, description, category, brand, size, condition, estimatedSwapValue, city, lat, lng } = req.body;
    let item = await ClothingItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Verify owner
    if (item.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    // Update fields
    if (title) item.title = title;
    if (description) item.description = description;
    if (category) item.category = category;
    if (brand) item.brand = brand;
    if (size) item.size = size;
    if (condition) item.condition = condition;
    
    if (estimatedSwapValue) {
      item.estimatedSwapValue = parseInt(estimatedSwapValue);
    } else if (category || brand || condition) {
      item.estimatedSwapValue = calculateSwapValue(
        category || item.category,
        brand || item.brand,
        condition || item.condition
      );
    }

    if (city) item.location.city = city;
    if (lat !== undefined && lng !== undefined) {
      item.location.coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }

    // Handle new images if uploaded
    const { clearExistingImages } = req.body;
    let tempImages = [...item.images];
    if (clearExistingImages === 'true' || clearExistingImages === true) {
      tempImages = [];
    }

    const newUploadsCount = req.files ? req.files.length : 0;
    if (tempImages.length + newUploadsCount > 5) {
      return res.status(400).json({ message: 'A listing can have at most 5 images.' });
    }

    item.images = tempImages;
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        item.images.push(`/uploads/${file.filename}`);
      });
    }

    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Delete Own Listing
exports.deleteListing = async (req, res, next) => {
  try {
    const item = await ClothingItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Verify owner or admin
    if (item.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    // Check if there are active swap requests associated with this item
    const activeSwapsCount = await SwapRequest.countDocuments({
      $or: [
        { offeredItem: req.params.id },
        { requestedItem: req.params.id }
      ],
      status: { $in: ['Pending', 'Accepted', 'Disputed'] }
    });

    if (activeSwapsCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete item because it is associated with an active/pending swap request.'
      });
    }

    await ClothingItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get Own Listings
exports.getMyListings = async (req, res, next) => {
  try {
    const items = await ClothingItem.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};
