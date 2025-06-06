const orderSchema = require("../../modals/orders.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const cartSchema = require("../../modals/cart.model");
const { successRes } = require("../../services/response");
const medicineModel = require("../../modals/medicine.model");
const pescriptionSchema = require("../../modals/pescriptionSchema");
const customerAddressModel = require("../../modals/customerAddress.model");
const { sendExpoNotification } = require("../../utils/expoNotification");
const pharmacySchema = require("../../modals/pharmacy.model");
const notificationModel = require("../../modals/notification.model");
const { getDistance, generateOrderNumber } = require("../../utils/helper");
const adminSchema = require("../../modals/admin.Schema");
const getRouteBetweenCoords = require("../../utils/distance.helper");
const Razorpay = require('razorpay');

/**

module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { item_ids, deliveryAddressId, paymentMethod } = req.body;

  if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
    return next(new CustomError("Item IDs are required", 400));
  }

  const cart = await cartSchema.findOne({ user_id: userId });
  if (!cart || cart.items.length === 0) {
    return next(new CustomError("Cart is empty or not found", 404));
  }

  const itemsToOrder = cart.items.filter((item) =>
    item_ids.includes(item.item_id.toString())
  );
  if (itemsToOrder.length === 0) {
    return next(
      new CustomError(
        "No valid items found in the cart for the provided item IDs",
        404
      )
    );
  }

  let totalPrice = 0;
  let prescriptionRequired = false;
  let isTestHomeCollection = false;
  const orderItems = [];

  for (const item of itemsToOrder) {
    console.log(item, "item")
    totalPrice += item.price * item.quantity;

    if (item.item_type === "Medicine") {
      const medicine = await medicineModel.findById(item.item_id);
      if (medicine?.isPrescriptionRequired) prescriptionRequired = true;
      orderItems.push({
        medicineId: item.item_id,
        quantity: item.quantity,
        price: item.price,
        medicineName: item.name,
      });

    } else if (item.item_type === "test") {
      if (item.details?.available_at_home) isTestHomeCollection = true;
      orderItems.push({
        testName: item.name,
        quantity: item.quantity,
        price: item.price,
      });
    }
  }
  console.log(orderItems, "orderType");
  const hasMedicine = itemsToOrder.some((i) => i.item_type === "Medicine");
  const hasTest = itemsToOrder.some((i) => i.item_type === "test");
  const orderType =
    hasMedicine && hasTest
      ? "mixed"
      : hasMedicine
        ? "pharmacy"
        : hasTest
          ? "pathology"
          : null;

  if (!orderType) return next(new CustomError("Invalid items in cart", 400));

  const findAddress = await customerAddressModel.findOne({
    customer_id: userId,
    _id: deliveryAddressId,
  });

  if (!findAddress) {
    return next(new CustomError("Delivery address not found", 404));
  }

  const allPharmacies = await pharmacySchema.find({
    status: "active",
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    pharmacyCoordinates: { $ne: null },
  });

  const userCoords = findAddress.location;
  const sortedPharmacies = allPharmacies
    .map((pharmacy) => ({
      pharmacy,
      distance: getDistance(userCoords, pharmacy.pharmacyCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.pharmacy);

  const pharmacyQueue = sortedPharmacies.map((p) => p._id);
  const assignedPharmacy = sortedPharmacies[0] || null;

  const pharmacyAttempts = assignedPharmacy
    ? [
      {
        pharmacyId: assignedPharmacy._id,
        status: "pending",
        attemptAt: new Date(),
      },
    ]
    : [];

  const newOrder = new orderSchema({
    orderNumber: generateOrderNumber('medicine'),
    customerId: userId,
    orderType,
    items: orderItems,
    totalAmount: totalPrice,
    deliveryAddressId,
    paymentMethod,
    prescriptionRequired,
    isTestHomeCollection,
    assignedPharmacyId: assignedPharmacy?._id || null,
    pharmacyQueue,
    pharmacyAttempts,
    deliveryAddress: {
      street: findAddress?.street,
      city: findAddress?.city,
      state: findAddress?.state,
      pincode: findAddress?.pincode,
      coordinates: {
        lat: findAddress?.location?.lat,
        long: findAddress?.location?.long,
      },
    },
  });

  await newOrder.save();

  // Update cart
  const updatedItems = cart.items.filter(
    (item) => !item_ids.includes(item.item_id.toString())
  );
  cart.items = updatedItems;
  cart.total_price = updatedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  await cart.save();

  // Notify pharmacy or admin
  let notification;

  if (assignedPharmacy) {
    notification = new notificationModel({
      title: "New Order",
      message: "You have a new order",
      recipientId: assignedPharmacy._id,
      recipientType: "pharmacy",
      NotificationTypeId: newOrder._id,
      notificationType: "pharmacy_order_request",
    });
    await sendExpoNotification(
      [assignedPharmacy.deviceToken],
      "New Order",
      "You have a new order",
      notification
    );
  } else {
    // No pharmacy found — notify admin for manual assignment
    const admins = await adminSchema.find({ role: "superadmin" });
    for (const admin of admins) {
      notification = new notificationModel({
        title: "Manual Order Assignment",
        message:
          "No pharmacy available for new order. Manual assignment required.",
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: newOrder._id,
        notificationType: "manual_pharmacy_assignment",
      });
      newOrder.orderStatus = "need_manual_assignment_to_pharmacy";
      console.log(newOrder, "newOrder");
      await newOrder.save();
      await sendExpoNotification(
        [admin.deviceToken],
        "Manual Assignment Needed",
        "No pharmacy available for order",
        notification
      );
    }
  }

  if (notification) await notification.save();

  return successRes(res, 201, true, "Order placed successfully", {
    order: newOrder,
    notification,
    assignedTo: assignedPharmacy ? "pharmacy" : "admin",
  });
});

 */

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { item_ids, deliveryAddressId, paymentMethod, razorpay_payment_id } = req.body;

  if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
    return next(new CustomError("Item IDs are required", 400));
  }

  // If payment method is online, ensure payment ID is provided
  if (paymentMethod !== "COD" && !razorpay_payment_id) {
    return next(new CustomError("Payment info missing for online payment", 400));
  }

  const cart = await cartSchema.findOne({ user_id: userId });
  if (!cart || cart.items.length === 0) {
    return next(new CustomError("Cart is empty or not found", 404));
  }

  const itemsToOrder = cart.items.filter((item) =>
    item_ids.includes(item.item_id.toString())
  );

  if (itemsToOrder.length === 0) {
    return next(new CustomError("No valid items found in the cart", 404));
  }

  let totalPrice = 0;
  let prescriptionRequired = false;
  const orderItems = [];

  for (const item of itemsToOrder) {
    totalPrice += item.price * item.quantity;

    const medicine = await medicineModel.findById(item.item_id);
    if (medicine?.isPrescriptionRequired) prescriptionRequired = true;

    orderItems.push({
      medicineId: item.item_id,
      quantity: item.quantity,
      price: item.price,
      medicineName: item.name,
    });
  }

  const findAddress = await customerAddressModel.findOne({
    customer_id: userId,
    _id: deliveryAddressId,
  });

  if (!findAddress) {
    return next(new CustomError("Delivery address not found", 404));
  }

  const allPharmacies = await pharmacySchema.find({
    status: "active",
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    pharmacyCoordinates: { $ne: null },
  });

  const userCoords = findAddress.location;

  const sortedPharmacies = allPharmacies
    .map((pharmacy) => ({
      pharmacy,
      distance: getDistance(userCoords, pharmacy.pharmacyCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.pharmacy);

  const pharmacyQueue = sortedPharmacies.map((p) => p._id);
  const assignedPharmacy = sortedPharmacies[0] || null;

  const pharmacyAttempts = assignedPharmacy
    ? [{
      pharmacyId: assignedPharmacy._id,
      status: "pending",
      attemptAt: new Date(),
    }]
    : [];

  let paymentDetails = null;

  if (paymentMethod !== "COD" && razorpay_payment_id) {
    const payment = await instance.payments.fetch(razorpay_payment_id);
    if (!payment || payment.status !== "captured") {
      return next(new CustomError("Payment not successful", 400));
    }

    paymentDetails = {
      razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      vpa: payment.vpa || payment.upi?.vpa,
      bank: payment.bank,
      wallet: payment.wallet,
      description: payment.description,
      fee: payment.fee,
      tax: payment.tax,
      rrn: payment.acquirer_data?.rrn,
      upi_transaction_id: payment.acquirer_data?.upi_transaction_id,
    };

    // await userPaymentModel.create({
    //   ...paymentDetails,
    //   razorpay_order_id: payment.order_id,
    //   razorpay_signature: req.body.razorpay_signature || "",
    // });
  }

  const newOrder = new orderSchema({
    orderNumber: generateOrderNumber('medicine'),
    customerId: userId,
    orderType: "pharmacy",
    items: orderItems,
    totalAmount: totalPrice,
    deliveryAddressId,
    paymentMethod,
    prescriptionRequired,
    assignedPharmacyId: assignedPharmacy?._id || null,
    pharmacyQueue,
    pharmacyAttempts,
    deliveryAddress: {
      street: findAddress?.street,
      city: findAddress?.city,
      state: findAddress?.state,
      pincode: findAddress?.pincode,
      coordinates: {
        lat: findAddress?.location?.lat,
        long: findAddress?.location?.long,
      },
    },
    paymentDetails: paymentDetails || null,
  });

  await newOrder.save();

  // Update Cart
  const updatedItems = cart.items.filter(
    (item) => !item_ids.includes(item.item_id.toString())
  );
  cart.items = updatedItems;
  cart.total_price = updatedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  await cart.save();

  // Notify
  let notification;

  if (assignedPharmacy) {
    notification = new notificationModel({
      title: "New Order",
      message: "You have a new order",
      recipientId: assignedPharmacy._id,
      recipientType: "pharmacy",
      NotificationTypeId: newOrder._id,
      notificationType: "pharmacy_order_request",
    });

    await sendExpoNotification(
      [assignedPharmacy.deviceToken],
      "New Order",
      "You have a new order",
      notification
    );
  } else {
    const admins = await adminSchema.find({ role: "superadmin" });

    for (const admin of admins) {
      notification = new notificationModel({
        title: "Manual Order Assignment",
        message: "No pharmacy available. Manual assignment required.",
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: newOrder._id,
        notificationType: "manual_pharmacy_assignment",
      });

      newOrder.orderStatus = "need_manual_assignment_to_pharmacy";
      await newOrder.save();

      await sendExpoNotification(
        [admin.deviceToken],
        "Manual Assignment Needed",
        "No pharmacy available for order",
        notification
      );
    }
  }

  if (notification) await notification.save();

  return successRes(res, 201, true, "Order placed successfully", {
    order: newOrder,
    notification,
    assignedTo: assignedPharmacy ? "pharmacy" : "admin",
  });
});

module.exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  let { page = 1, status } = req.query;
  let limit = 10;
  let skip = (page - 1) * limit;


  let query = { customerId: userId };

  if (status === "delivered") {
    query.orderStatus = "delivered";
  } else if (status === "cancelled") {
    query.orderStatus = "cancelled";
  } else if (status === "pending") {
    query.orderStatus = { $nin: ["delivered", "cancelled"] };
  }

  let [orders, totalOrders] = await Promise.all([
    orderSchema
      .find(query)
      .populate("items.medicineId")
      .populate("deliveryAddressId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    orderSchema.countDocuments(query),
  ]);

  if (!orders || orders.length === 0) {
    return successRes(res, 200, false, "No orders found", []);
  }

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.medicineId && typeof item.medicineId === "object") {
        item.item_id = item.medicineId._id;
      }
    });
  });

  return successRes(res, 200, true, "Orders fetched successfully", {
    orders,
    totalOrders,
    currentPage: Number(page),
    totalPages: Math.ceil(totalOrders / limit),
  });
});


module.exports.getOrderById = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  let { orderId } = req.query;
  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }
  const order = await orderSchema.findOne({ _id: orderId, customerId: userId });
  if (!order) {
    return next(new CustomError("Order not found", 404));
  }
  return successRes(res, 200, true, "Order fetched successfully", { order });
});

module.exports.cancleOrder = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  let { orderId } = req.query;
  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }
  const order = await orderSchema.findOne({ _id: orderId, customerId: userId });
  if (!order) {
    return next(new CustomError("Order not found", 404));
  }
  order.orderStatus = "cancelled";
  await order.save();
  return successRes(res, 200, true, "Order cancelled successfully", { order });
});

/**
 * 

module.exports.uploadPrescription = asyncErrorHandler(
  async (req, res, next) => {
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return next(new CustomError("No files uploaded.", 400));
    }

    const filePaths = req.files.map((file) => ({
      path: `${process.env.PRESCRIPTION_IMAGE_PATH}${file.filename}`,
      uploaded_at: new Date(),
    }));

    const allPharmacies = await pharmacySchema.find({
      status: "active",
      availabilityStatus: "available",
      deviceToken: { $ne: null },
      pharmacyCoordinates: { $ne: null },
    });

    const prescription = new pescriptionSchema({
      prescriptionNumber: generateOrderNumber('prescription'),
      user_id: userId,
      prescriptions: filePaths,
    });

    await prescription.save();

    return successRes(
      res,
      200,
      true,
      "Prescriptions uploaded successfully our medical team will review it and contact you shortly",
      prescription
    );
  }
);
*/

module.exports.uploadPrescription = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { deliveryAddressId } = req.body;

  if (!req.files || req.files.length === 0) {
    return next(new CustomError("No files uploaded.", 400));
  }

  // Validate delivery address
  const findAddress = await customerAddressModel.findOne({
    customer_id: userId,
    _id: deliveryAddressId,
  });
  if (!findAddress) {
    return next(new CustomError("Delivery address not found", 404));
  }
  let userCoords = findAddress.location

  // Prepare prescription file data
  const filePaths = req.files.map((file) => ({
    path: `${process.env.PRESCRIPTION_IMAGE_PATH}${file.filename}`,
    uploaded_at: new Date(),
  }));

  // Find nearby pharmacies
  const allPharmacies = await pharmacySchema.find({
    status: "active",
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    pharmacyCoordinates: { $ne: null },
  });

  const sortedPharmacies = allPharmacies
    .map((pharmacy) => ({
      pharmacy,
      distance: getDistance(userCoords, pharmacy.pharmacyCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.pharmacy);

  const assignedPharmacy = sortedPharmacies[0] || null;

  const prescription = new pescriptionSchema({
    prescriptionNumber: generateOrderNumber("prescription"),
    addressId: deliveryAddressId,
    user_id: userId,
    prescriptions: filePaths,
    assigned_pharmacy: assignedPharmacy?._id || null,
    status: assignedPharmacy ? "assigned_to_pharmacy" : "pending",
    deliveryAddress: {
      street: findAddress?.street,
      city: findAddress?.city,
      state: findAddress?.state,
      pincode: findAddress?.pincode,
      coordinates: {
        lat: findAddress?.location?.lat,
        long: findAddress?.location?.long,
      },
    },
    pharmacyAttempts: assignedPharmacy
      ? [
        {
          pharmacyId: assignedPharmacy._id,
          status: "pending",
          attemptAt: new Date(),
        },
      ]
      : [],
  });

  await prescription.save();

  let notification = null;

  // Notify pharmacy if available
  if (assignedPharmacy) {
    notification = new notificationModel({
      title: "New Order",
      message: "You have a new order",
      recipientId: assignedPharmacy._id,
      recipientType: "pharmacy",
      NotificationTypeId: prescription._id,
      notificationType: "pharmacy_order_request",
    });

    await sendExpoNotification(
      [assignedPharmacy.deviceToken],
      "New Order",
      "You have a new order",
      notification
    );
  } else {
    // Notify admins for manual assignment
    const admins = await adminSchema.find({ role: "superadmin" });

    prescription.status = "need_manual_assignment_to_pharmacy";
    await prescription.save();

    for (const admin of admins) {
      notification = new notificationModel({
        title: "Manual Order Assignment",
        message: "No pharmacy available. Manual assignment required.",
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: prescription._id,
        notificationType: "manual_pharmacy_assignment",
      });

      await sendExpoNotification(
        [admin.deviceToken],
        "Manual Assignment Needed",
        "No pharmacy available for order",
        notification
      );

      await notification.save();
    }
  }

  if (notification && assignedPharmacy) {
    await notification.save();
  }

  return successRes(
    res,
    200,
    true,
    "Prescriptions uploaded successfully. Our medical team will review it and contact you shortly.",
    prescription
  );
});


module.exports.searchOrder = asyncErrorHandler(async (req, res, next) => {
  let { value, page, limit } = req.query;

  if (!value) {
    return next(new CustomError("Search value is required", 400));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(value.trim(), "i");

  const searchQuery = {
    $or: [
      { orderStatus: regex },
      { paymentStatus: regex },
      { orderType: regex },
      { paymentMethod: regex },
    ],
  };

  const [totalOrders, allOrders] = await Promise.all([
    orderSchema.countDocuments(searchQuery),
    orderSchema
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  if (allOrders.length === 0) {
    return successRes(res, 200, false, "No Orders Found", []);
  }

  return successRes(res, 200, true, "Orders fetched successfully", {
    orders: allOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
  });
});

module.exports.getAllPrescriptions = asyncErrorHandler(
  async (req, res, next) => {
    const userId = req.user._id;
    let { page = 1 } = req.query;
    let limit = 10;
    page = parseInt(page) || 1;
    let skip = (page - 1) * limit;
    const [prescriptions, totalPrescriptions] = await Promise.all([
      pescriptionSchema.find({ user_id: userId }).skip(skip).limit(limit),
      pescriptionSchema.countDocuments({ user_id: userId }),
    ]);
    return successRes(res, 200, true, "Prescriptions fetched successfully", {
      prescriptions,
      totalPrescriptions,
      currentPage: page,
      totalPages: Math.ceil(totalPrescriptions / limit),
    });
  }
);

module.exports.getPrescriptionDetailsById = asyncErrorHandler(
  async (req, res, next) => {
    const userId = req.user._id;
    const prescriptionId = req.query.prescriptionId;
    if (!prescriptionId) {
      return next(new CustomError("Prescription ID is required", 400));
    }
    const prescription = await pescriptionSchema.findOne({
      _id: prescriptionId,
      user_id: userId,
    });
    if (!prescription) {
      return next(new CustomError("Prescription not found", 404));
    }
    return successRes(res, 200, true, "Prescription fetched successfully", {
      prescription,
    });
  }
);
