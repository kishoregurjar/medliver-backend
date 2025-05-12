const jsonwebtoken = require("jsonwebtoken");
const CustomError = require("./customError");
const adminModal = require("../modals/admin.Schema");
const SECRET_KEY = process.env.SECRET_KEY;
const customerModal = require("../modals/customer.model");
const deliveryModel = require("../modals/delivery.model");
const doctorSchema = require("../modals/doctorSchema");

const jwt = {
  assignJwt: (admin) => {
    const payload = {
      _id: admin?._id,
      email: admin?.email,
      role: admin?.role,
      permissions: admin?.permissions,
    };
    const options = {
      expiresIn: "365d",
    };
    return jsonwebtoken.sign(payload, SECRET_KEY, options);
  },

  verifyAdminToken: (role = null) => {
    return async (req, res, next) => {
      console.log("verifying token", req.headers.authorization);
      try {
        let token = req.headers.authorization;
        if (!token) {
          return next(new CustomError("Please provide token", 401));
        }

        let decoded;
        try {
          decoded = jsonwebtoken.verify(token, SECRET_KEY);

        } catch (err) {
          if (err.name === "TokenExpiredError") {
            return next(
              new CustomError("Session timeout: Please login again", 401)
            );
          }
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        if (!decoded) {
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        // Fetch admin from database
        const admin = await adminModal.findById(decoded._id);
        if (!admin) {
          return next(new CustomError("Admin not found", 401));
        }

        if (admin.isActive !== true) {
          return next(new CustomError("Admin deactivated", 403));
        }

        if (role && role !== admin.role) {
          return next(
            new CustomError(
              "Access Denied: You do not have permission to access this resource",
              403
            )
          );
        }
        req.admin = admin;
        next();
      } catch (error) {
        console.log(error, "error");
        return next(error);
      }
    };
  },
  verifyUserToken: () => {
    return async (req, res, next) => {
      try {
        let token = req.headers.authorization;
        if (!token) {
          return next(new CustomError("Please provide token", 401));
        }

        let decoded;
        try {
          decoded = jsonwebtoken.verify(token, SECRET_KEY);
        } catch (err) {
          if (err.name === "TokenExpiredError") {
            return next(
              new CustomError("Session timeout: Please login again", 401)
            );
          }
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        if (!decoded) {
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        // Fetch admin from database
        const user = await customerModal.findById(decoded._id);
        if (!user) {
          return next(new CustomError("User not found", 401));
        }

        if (user.isVerified !== true) {
          return next(new CustomError("User not verified", 403));
        }

        req.user = user;
        next();
      } catch (error) {
        console.log(error, "error");
        return next(error);
      }
    };
  },
  verifyDeliveryPartnerToken: () => {
    return async (req, res, next) => {
      try {
        let token = req.headers.authorization;
        if (!token) {
          return next(new CustomError("Please provide token", 401));
        }

        let decoded;
        try {
          decoded = jsonwebtoken.verify(token, SECRET_KEY);
        } catch (err) {
          if (err.name === "TokenExpiredError") {
            return next(
              new CustomError("Session timeout: Please login again", 401)
            );
          }
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        if (!decoded) {
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        // Fetch admin from database
        const partner = await deliveryModel.findById(decoded._id);
        if (!partner) {
          return next(new CustomError("Delivery Partner not found", 401));
        }

        if (partner.isBlocked) {
          return next(new CustomError("You are blocked. Please contact support.", 403));
        }


        if (partner.isVerified !== true) {
          return next(new CustomError("Delivery Partner not verified", 403));
        }

        req.partner = partner;
        next();
      } catch (error) {
        console.log(error, "error");
        return next(error);
      }
    };
  },
  verifyDoctorToken: () => {
    return async (req, res, next) => {
      try {
        let token = req.headers.authorization;
        if (!token) {
          return next(new CustomError("Please provide token", 401));
        }

        let decoded;
        try {
          decoded = jsonwebtoken.verify(token, SECRET_KEY);
        } catch (err) {
          if (err.name === "TokenExpiredError") {
            return next(
              new CustomError("Session timeout: Please login again", 401)
            );
          }
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        if (!decoded) {
          return next(new CustomError("Access Denied: Invalid Token", 401));
        }

        // Fetch admin from database
        const doctor = await doctorSchema.findById(decoded._id);
        if (!doctor) {
          return next(new CustomError("Doctor not found", 401));
        }

        if (!doctor.is_active) {
          return next(new CustomError("You are blocked. Please contact support.", 403));
        }

        req.doctor = doctor;
        next();
      } catch (error) {
        console.log(error, "error");
        return next(error);
      }
    };
  },
};

module.exports = jwt;
