const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('./customError');
const adminModal = require('../modals/admin.Schema');
const SECRET_KEY = process.env.SECRET_KEY;

const jwt = {
    assignJwt: (admin) => {
        const payload = {
            _id: admin._id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };
        const options = {
            expiresIn: "1d",
        };
        return jsonwebtoken.sign(payload, SECRET_KEY, options);
    },

    verifyAdminToken: () => {
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
                    // console.log(decoded, "decoded token");
                } catch (err) {
                    if (err.name === "TokenExpiredError") {
                        return next(new CustomError("Session timeout: Please login again", 401));
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

                req.admin = admin;
                next();
            } catch (error) {
                console.log(error, "error");
                return next(error);
            }
        };
    },
};

module.exports = jwt;
