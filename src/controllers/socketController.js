// socketServer.js
const { Server } = require("socket.io");

let io;
const liveLocations = {}; // { orderId: { partnerId: { location, userCoordinates } } }

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  console.log("Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins an order room
    socket.on("join_order_room", (orderId) => {
      socket.join(orderId);
      console.log(`User joined room: ${orderId}`);
    });

    // Delivery partner sends location update
    socket.on("update_location", (data) => {
      const { orderId, partnerId, newLocation } = data;

      if (!orderId || !partnerId || !newLocation) return;

      if (!liveLocations[orderId]) liveLocations[orderId] = {};
      liveLocations[orderId][partnerId] = {
        location: newLocation
      };

      // Broadcast location to all users tracking this order
      io.to(orderId).emit("location_update", {
        orderId,
        partnerId,
        location: newLocation,
        timestamp: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

const getIoInstance = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIoInstance };
