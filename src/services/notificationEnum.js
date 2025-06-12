const notificationEnum = {
    superAdmin: {
        manual_pharmacy_assignment: {
            title: "Manual Pharmacy Assignment Needed",
            message: "No pharmacy available. Manual assignment required."
        },
        manual_assignment_to_delivery_partner: {
            title: "Manual Delivery Assignment Needed",
            message: "No delivery partner available. Manual assignment required."
        },
        manual_assignment_to_pathology: {
            title: "Manual Pathology Assignment Needed",
            message: "No pathology center available. Manual assignment required."
        },
    },
    pharmacy: {
        pharmacy_order_request: {
            title: "New Order",
            message: "You have a new order"
        }
    },

    getNotification(role, type) {
        const roleNotifications = this[role];
        if (roleNotifications && roleNotifications[type]) {
            return roleNotifications[type];
        }
        // Optional fallback
        return {
            title: "Notification",
            message: "You have a new notification."
        };
    }
};

module.exports = notificationEnum;
