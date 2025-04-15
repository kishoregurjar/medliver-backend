const Joi = require("joi");


const createPharmacy = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Pharmacy name is required",
  }),
  ownerName: Joi.string().required().messages({
    "string.empty": "Owner name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid format",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
  role: Joi.string().valid("pharmacy").required().messages({
    "string.empty": "Role is required",
    "any.only": "Role must be 'pharmacy'",
  }),
  pharmacyName: Joi.string().required().messages({
    "string.empty": "Pharmacy name is required",
  }),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    }).required()
  }).required(),
  documents: Joi.object({
    licenseNumber: Joi.string().required(),
    gstNumber: Joi.string().required(),
    licenseDocument: Joi.string().required(),
    verificationStatus: Joi.string().valid("pending", "approved", "rejected").required().optional()
  }).required()
});


  const getAndDeletePharmacyById = Joi.object({
    pharmacyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pharmacy ID is required",
        "string.pattern.base": "Invalid Pharmacy ID format",
      }),
  });

  const getAllPharmacy = Joi.object({
    page: Joi.number().integer().optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page number must be greater than 0",
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be greater than 0",
    })
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
    getAndDeletePharmacyById,
    getAllPharmacy

}