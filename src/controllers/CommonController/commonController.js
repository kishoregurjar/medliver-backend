const axios = require('axios');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const CustomError = require('../../utils/customError');
const { successRes } = require('../../services/response');
const { getLatLngFromPlaceId } = require('../../services/helper');
const API_KEY = process.env.GOOGLE_API_KEY_FOR_MAP; // Replace with your real key
const Notification = require('../../modals/notification.model');
const User = require('../../modals/customer.model');
const Pharmacy = require('../../modals/pharmacy.model')
const Pathology = require("../../modals/pathology.model");
const { getLocationFromPincode } = require('../../utils/distance.helper');

module.exports.autoCompleteAddress = asyncErrorHandler(async (req, res, next) => {
  const { query } = req.body;

  if (!query) {
    return next(new CustomError("Address query is required", 400));
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
    params: {
      input: query,
      key: API_KEY,
      types: "establishment", // Limit to address-type suggestions
      language: 'en'
    }
  });

  const predictions = response.data.predictions;
  const suggestions = predictions.map(prediction => ({
    description: prediction.description,
    place_id: prediction.place_id
  }));

  let address = await getLatLngFromPlaceId(suggestions[0].place_id);

  // let randomImage = await getRandomMedicineImage();

  return successRes(res, 200, true, "Address suggestions fetched successfully", {
    suggestions,
    address
  });
});

module.exports.getDistanceBetweenCoords = asyncErrorHandler(async (req, res, next) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return next(new CustomError("Both origin and destination coordinates are required", 400));
  }

  const originStr = `${origin.lat},${origin.long}`;
  const destinationStr = `${destination.lat},${destination.long}`;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: originStr,
        destinations: destinationStr,
        key: API_KEY
      }
    });

    const data = response.data;

    if (
      data.rows &&
      data.rows[0] &&
      data.rows[0].elements &&
      data.rows[0].elements[0].status === 'OK'
    ) {
      const distanceInfo = data.rows[0].elements[0];

      return res.status(200).json({
        success: true,
        distance: distanceInfo.distance.text,
        duration: distanceInfo.duration.text,
        meters: distanceInfo.distance.value,
        seconds: distanceInfo.duration.value
      });
    } else {
      return next(new CustomError("Could not find distance between the locations", 404));
    }
  } catch (error) {
    console.error('Google Distance Matrix API error:', error.message);
    return next(new CustomError("Failed to calculate distance", 500));
  }
});

module.exports.getRouteBetweenCoords = asyncErrorHandler(async (req, res, next) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return next(new CustomError("Both origin and destination coordinates are required", 400));
  }

  const originStr = `${origin.lat},${origin.long}`;
  const destinationStr = `${destination.lat},${destination.long}`;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: originStr,
        destination: destinationStr,
        key: API_KEY,
        alternatives: true // Allow multiple route options
      }
    });

    const data = response.data;

    if (data.status !== 'OK' || !data.routes.length) {
      return next(new CustomError("Could not find route between the locations", 404));
    }
    let shortestRoute = data.routes[0];
    let shortestDistance = shortestRoute.legs[0].distance.value;

    data.routes.forEach(route => {
      const distance = route.legs[0].distance.value;
      if (distance < shortestDistance) {
        shortestDistance = distance;
        shortestRoute = route;
      }
    });

    const leg = shortestRoute.legs[0];

    return successRes(res, 200, true, "Route fetched successfully", {
      distance: leg.distance.text,
      duration: leg.duration.text,
      start_address: leg.start_address,
      end_address: leg.end_address,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text,
        start_location: step.start_location,
        end_location: step.end_location
      })),
      overview_polyline: shortestRoute.overview_polyline.points
    });
  } catch (error) {
    console.error('Google Directions API error:', error.message);
    return next(new CustomError("Failed to get route", 500));
  }
});

module.exports.getNotifications = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const partnerId = req.partner?._id;
  const admin = req.admin;
  console.log(userId, "userId")
  let recipientId;
  let recipientType;

  if (userId) {
    recipientId = userId;
  } else if (partnerId) {
    recipientId = partnerId;
  } else if (admin) {
    const pharmacy = await Pharmacy.findOne({ adminId: admin._id });
    const pathology = await Pathology.findOne({ adminId: admin._id });

    if (pharmacy) {
      recipientId = pharmacy._id;
      recipientType = "pharmacy";
    } else if (pathology) {
      recipientId = pathology._id;
      recipientType = "pathology";
    } else {
      recipientId = admin._id;
      recipientType = "admin";
    }
  } else {
    return successRes(res, 200, false, "User Type not found", []);
  }

  const notifications = await Notification.find({
    recipientId
  }).sort({ sentAt: -1 });

  if (!notifications || notifications.length === 0) {
    return successRes(res, 200, false, "Notification not found", []);
  }

  return successRes(res, 200, true, "Notifications fetched successfully", notifications);
});

module.exports.updateNotificationStatus = asyncErrorHandler(async (req, res, next) => {
  const { notificationId } = req.body;

  const userId = req.user?._id;
  const partnerId = req.partner?._id;
  const admin = req.admin;

  if (!notificationId) {
    return next(new CustomError("Notification ID is required", 400));
  }

  //   console.log(admin,"admin---------------");
  let recipientId;
  let recipientType;

  if (userId) {
    recipientId = userId;
    recipientType = "customer";
  } else if (partnerId) {
    recipientId = partnerId;
    recipientType = "delivery_partner"
  } else if (admin) {
    const pharmacy = await Pharmacy.findOne({ adminId: admin._id });
    console.log("pharmacy", pharmacy);
    const pathology = await Pathology.findOne({ adminId: admin._id });
    console.log("pthology", pathology);
    if (pharmacy) {
      recipientId = pharmacy._id;
      recipientType = "pharmacy";
    } else if (pathology) {
      recipientId = pathology._id;
      recipientType = "pathology";
    } else {
      recipientId = admin._id;
      recipientType = "admin";
    }
  } else {
    return successRes(res, 200, false, "User Type not found", []);
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    recipientId: recipientId,
    recipientType: recipientType,
  });

  if (!notification) {
    return successRes(res, 200, false, "Notification not found", []);
  }

  if (notification.status === "read") {
    return successRes(res, 200, false, "Notification is already marked as read", notification);
  }

  await Notification.updateOne(
    { _id: notificationId },
    { $set: { status: "read" } }
  );

  return successRes(res, 200, true, "Notification status updated to 'read'", notification);
});

module.exports.getAddressByPincode = asyncErrorHandler(async (req, res, next) => {
  const { pincode } = req.body;
  if (!pincode) {
    return next(new CustomError("Pincode is required", 400));
  }
  const address = await getLocationFromPincode(pincode);
  return successRes(res, 200, true, "Address fetched successfully", address);
})

async function getRandomMedicineImage() {
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: 'y3vflvRUtVdFNLgcNAaqgDdOzP39F3LAje1nigTAszmupSfVvqwSbnHk',
      },
      params: {
        query: 'medicine',
        per_page: 4,
      },
    });

    const photos = response.data.photos;
    if (photos.length === 0) {
      throw new Error('No images found for this query.');
    }

    const random = photos[Math.floor(Math.random() * photos.length)];
    return {
      imageUrl: random.src.medium,
      fullImage: random.src.original,
      photographer: random.photographer,
      photoLink: random.url,
    };
  } catch (error) {
    console.error('Error fetching image:', error.message);
    return null;
  }
}



module.exports.updateNotificationStatusUser = asyncErrorHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Support "Bearer <token>" format
  const { notificationId } = req.body;

  if (!token) {
    return next(new CustomError("Authorization token is required", 401));
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    userId = decoded._id;
  } catch (err) {
    return next(new CustomError("Invalid or expired token", 401));
  }

  if (!notificationId) {
    return next(new CustomError("Notification ID is required", 400));
  }

  const updatedNotification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipientType: "customer",
      $or: [
        { recipientId: userId },
        { recipientId: null }
      ]
    },
    { $set: { status: "read" } },
    { new: true } // return updated document
  );

  if (!updatedNotification) {
    return successRes(res, 200, false, "Notification not found or already marked as read", []);
  }

  return successRes(res, 200, true, "Notification status updated to 'read'", updatedNotification);
});
