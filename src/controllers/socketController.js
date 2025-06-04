const { Server } = require("socket.io");

let io;

const liveLocations = {}; 

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


    socket.on("join_order_room", (orderId) => {
      socket.join(orderId);
      console.log(`User joined room: ${orderId}`);
    });
  
    // Delivery partner sends location update with orderId and partnerId
    socket.on("update_location", (data) => {
      const { orderId, partnerId, newLocation } = data;
  
      if (!liveLocations[orderId]) liveLocations[orderId] = {};
      liveLocations[orderId][partnerId] = newLocation;
  
      // Broadcast updated locations for this order to all users tracking it
      io.to(orderId).emit("location_update", liveLocations[orderId]);
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
