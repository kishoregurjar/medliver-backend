const Joi = require("joi");


const createPharmacy = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Admin name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Must be a valid email address",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
  role: Joi.string().valid("pharmacy").required().messages({
    "any.only": "Role must be 'pharmacy'",
    "string.empty": "Role is required",
  }),
  ownerName: Joi.string().required().messages({
    "string.empty": "Owner name is required",
  }),
  pharmacyName: Joi.string().required().messages({
    "string.empty": "Pharmacy name is required",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).optional(),
  }).optional(),
  documents: Joi.object({
    licenseNumber: Joi.string().optional(),
    gstNumber: Joi.string().optional(),
    licenseDocument: Joi.string().optional(),
    verificationStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional(),
  }).optional(),
});


const validate = (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({ success: false, message: errorMessage });
      }
      next();
    };
  };

  const getAndDeletePharmacyById = Joi.object({
    pharmacyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pharmacy ID is required",
        "string.pattern.base": "Invalid Pharmacy ID format",
      }),
  });

const validateQuery = (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.query);
      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({ success: false, message: errorMessage });
      }
      next();
    };
  };

module.exports={
    validate,
    validateQuery,
    createPharmacy,
    getAndDeletePharmacyById
}