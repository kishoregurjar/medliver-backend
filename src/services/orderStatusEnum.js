const getOrderStatusLabel = (status) => {
    const statusMap = {
        pending: "Pending",
        accepted_by_pharmacy: "Getting Ready",
        assigned_to_delivery_partner: "Partner on the Way",
        assigned_to_pharmacy: "Awaiting Pharmacy Confirmation",
        accepted_by_delivery_partner: "On the Way",
        need_manual_assignment_to_pharmacy: "Assigning Pharmacy...",
        need_manual_assignment_to_delivery_partner: "Assigning Delivery Partner...",
        accepted_by_delivery_partner_and_reached_pharmacy: "On the Way",
        out_for_pickup: "On the Way",
        picked_up: "On the Way",
        out_for_delivery: "On the Way",
        delivered: "Delivered",
        cancelled: "Cancelled",
        reached_pharmacy: "On the Way",
        reached_destination: "At Destination",
        verified_by_customer: "Verified"
    };

    return statusMap[status] || "Unknown Status";
};

module.exports = { getOrderStatusLabel };
