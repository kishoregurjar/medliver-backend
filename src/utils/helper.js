const { v4: uuidv4 } = require('uuid');
module.exports.getDistance = async (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.long - coord1.long);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
    Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // returns distance in km
};


module.exports.generateOrderNumber = (type) => {
  if (type === "medicine") {
    return `MED${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  } else if (type === "test") {
    return `TEST${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  } else {
    return `PRES${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }
}


module.exports.deliveryOrderStatus = [
  "pending",
  "accepted_by_pharmacy",
  "assigned_to_delivery_partner",
  "assigned_to_pharmacy",
  "accepted_by_delivery_partner",
  "need_manual_assignment_to_pharmacy",
  "need_manual_assignment_to_delivery_partner",
  "accepted_by_delivery_partner_and_reached_pharmacy",
  "out_for_pickup",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "reached_pharmacy"
];
