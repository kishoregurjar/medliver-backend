const policySchema = require('../../modals/policy.model');

const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");

module.exports.getPrivacyPolicy = asyncErrorHandler(async (req, res, next) => {
  
  let {userType} = req.query;

  if (!userType) {
    return next(new CustomError("User type is required", 400));
  }

  const policy = await policySchema.findOne({ type: "privacy", userType });
  if (!policy) {
    return next(
      new CustomError(
        "Privacy policy not found for the specified user type",
        404
      )
    );
  }

  return successRes(res, 200, "Privacy policy fetched successfully", {
    policy,
  });
});

module.exports.getTermsAndConditions = asyncErrorHandler(
  async (req, res, next) => {
  
    let {userType} = req.query;


    if (!userType) {
      return next(new CustomError("User type is required", 400));
    }

    const policy = await policySchema.findOne({ type: "terms", userType });
    if (!policy) {
      return next(
        new CustomError(
          "Terms and conditions not found for the specified user type",
          404
        )
      );
    }

    return successRes(res, 200, true, "Terms and conditions fetched successfully", {
      policy,
    });
  }
);

module.exports.createOrUpdatePolicy = asyncErrorHandler(
  async (req, res, next) => {
    const { type, content, userType , policyId} = req.body;


    if (!policyId || !content ) {
      return next(
        new CustomError("Type, content and userType are required", 400)
      );
    }

    const policy = await policySchema.findOneAndUpdate(
      {  _id: policyId },
      { content, updatedAt: new Date() },
      { new: true }
    );

    return successRes(res, 200, true, "Policy updated successfully", {
      policy,
    });
  }
);

module.exports.createPolicy = asyncErrorHandler(async (req, res, next) => {
  const { type, content, userType } = req.body;
  if (!type || !content || !userType) {
    return next(
      new CustomError("Type, content and userType are required", 400)
    );
  }
  const existingPolicy = await policySchema.findOne({ type, userType });
  if (existingPolicy) {
    return next(
      new CustomError("Policy already exists for this type and user type", 400)
    );
  }
  const newPolicy = new policySchema({
    type,
    content,
    userType,
  });
  await newPolicy.save();
  return successRes(res, 201, true, "Policy created successfully", {
    policy: newPolicy,
  });
});



module.exports.getAllPolicies = asyncErrorHandler(async (req, res, next) => {
  const policies = await policySchema.find();

  if (!policies || policies.length === 0) {
    return next(new CustomError("No policies found", 404));
  }

  // Define all possible userTypes
  const userTypes = ['customer', 'pharmacy', 'delivery', 'pathology'];

  // Initialize the response object
  const structuredPolicies = {};

  // Initialize each userType with privacy and terms set to null
  userTypes.forEach((userType) => {
    structuredPolicies[userType] = {
      privacy: null,
      terms: null
    };
  });

  // Populate the response object with policies
  policies.forEach((policy) => {
    const { userType, type } = policy;
    if (userTypes.includes(userType)) {
      structuredPolicies[userType][type] = policy;
    }
  });

  return successRes(res, 200, true, "Policies fetched successfully", structuredPolicies);
});


module.exports.getPolicyById = asyncErrorHandler(async (req,res , next) =>{
  const {policyId} = req.query;
  if (!policyId) {
    return next(new CustomError("Policy ID is required", 400));
  }
  const policy = await policySchema.findById(policyId);
  if (!policy) {
    return next(new CustomError("Policy not found", 404));
  }
  return successRes(res, 200, true, "Policy fetched successfully", policy);
})



