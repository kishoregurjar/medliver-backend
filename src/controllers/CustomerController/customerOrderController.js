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
const sendFirebaseNotification = require("../../services/sendNotification");
const notificationEnum = require("../../services/notificationEnum");
const { getOrderStatusLabel } = require("../../services/orderStatusEnum");

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
    const notificationType = "pharmacy_order_request";
    const role = "pharmacy";

    const notificationRes = notificationEnum.getNotification(role, notificationType);

    notification = new notificationModel({
      title: notificationRes.title,
      message: notificationRes.message,
      recipientId: assignedPharmacy._id,
      recipientType: "pharmacy",
      NotificationTypeId: newOrder._id,
      notificationType: notificationType,
    });

    await sendFirebaseNotification(
      assignedPharmacy.deviceToken,
      notificationRes.title,
      notificationRes.message,
      notification
    );

  } else {
    const admins = await adminSchema.find({ role: "superadmin" });

    for (const admin of admins) {

      const notificationType = "manual_pharmacy_assignment";
      const role = "superAdmin";

      const notificationRes = notificationEnum.getNotification(role, notificationType);

      notification = new notificationModel({
        title: notificationRes.title,
        message: notificationRes.message,
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: newOrder._id,
        notificationType: notificationType,
      });

      newOrder.orderStatus = "need_manual_assignment_to_pharmacy";
      await newOrder.save();

      //send notification
      await sendFirebaseNotification(
        admin.deviceToken,
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

    // Add readable label
    order._doc.readableStatus = getOrderStatusLabel(order.orderStatus);
    console.log(order._doc.readableStatus);
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

  // 👇 Add readableStatus
  order._doc.readableStatus = getOrderStatusLabel(order.orderStatus);

  return successRes(res, 200, true, "Order fetched successfully", order);
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
    let notificationType = "pharmacy_order_request";
    let role = "pharmacy";
    let notificationRes = notificationEnum.getNotification(role, notificationType);

    notification = new notificationModel({
      title: notificationRes.title,
      message: notificationRes.message,
      recipientType: "pharmacyOwner",
      notificationType: notificationType,
      NotificationTypeId: prescription._id,
      recipientId: assignedPharmacy._id,
    });

    await sendFirebaseNotification(
      assignedPharmacy.deviceToken,
      notificationRes.title,
      notificationRes.message,
      notification
    )
  } else {
    // Notify admins for manual assignment
    const admin = await adminSchema.findOne({ role: "superadmin" });

    prescription.status = "need_manual_assignment_to_pharmacy";
    await prescription.save();

    let notificationType = "manual_pharmacy_assignment";
    let role = "superAdmin";
    let notificationRes = notificationEnum.getNotification(role, notificationType);

    notification = new notificationModel({
      title: notificationRes.title,
      message: notificationRes.message,
      recipientType: "admin",
      notificationType: notificationType,
      NotificationTypeId: prescription._id,
      recipientId: admin._id,
    });

    await notification.save();

    if (admin.deviceToken) {
      await sendFirebaseNotification(
        admin.deviceToken,
        notificationRes.title,
        notificationRes.message,
        notification
      )
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


module.exports.getAllPrescriptions = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  let { page = 1 } = req.query;
  const limit = 10;
  page = parseInt(page) || 1;
  const skip = (page - 1) * limit;

  const [prescriptions, totalPrescriptions] = await Promise.all([
    pescriptionSchema.find({ user_id: userId }).skip(skip).limit(limit).lean(),
    pescriptionSchema.countDocuments({ user_id: userId }),
  ]);

  // Inject readableStatus using utility function
  const updatedPrescriptions = prescriptions.map((prescription) => ({
    ...prescription,
    readableStatus: getOrderStatusLabel(prescription.status),
  }));

  return successRes(res, 200, true, "Prescriptions fetched successfully", {
    prescriptions: updatedPrescriptions,
    totalPrescriptions,
    currentPage: page,
    totalPages: Math.ceil(totalPrescriptions / limit),
  });
});

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
    }).lean();

    if (!prescription) {
      return next(new CustomError("Prescription not found", 404));
    }

    // Inject readableStatus
    prescription.readableStatus = getOrderStatusLabel(prescription.status);

    return successRes(res, 200, true, "Prescription fetched successfully", {
      prescription,
    });
  }
);
