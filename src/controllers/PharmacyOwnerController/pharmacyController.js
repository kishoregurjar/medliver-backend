const pharmacyModel = require("../../modals/pharmacy.model");
const { getLatLngFromPlaceId } = require("../../services/helper");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

module.exports.updatePharmacyAddress = asyncErrorHandler(async (req, res, next) => {
    const pharmacyId = req.admin._id;
    const { placeId } = req.body;

    const locationData = await getLatLngFromPlaceId(placeId);

    const updatedPharmacy = await pharmacyModel.findOneAndUpdate(
        { adminId: pharmacyId },
        {
            address: locationData.address,
            completeAddress: locationData.formatted_address,
            pharmacyCoordinates: {
                lat: locationData.lat,
                long: locationData.long
            }
        },
        { new: true }
    );

    if (!updatedPharmacy) {
        return errorRes(res, 404, false, "Pharmacy not found");
    }

    return successRes(res, 200, true, "Address updated successfully", updatedPharmacy);
});

module.exports.changePharmacyAvailabilityStatus = asyncErrorHandler(async (req, res, next) => {
  const { availabilityStatus } = req.body;
  const admin = req.admin;

  if (!availabilityStatus) {
    return next(new CustomError("availabilityStatus is required", 400));
  }
  if (!["available", "unavailable"].includes(availabilityStatus)) {
    return next(new CustomError("Status is invalid", 400));
  }

  const pharmacy = await pharmacyModel.findOne({ adminId: admin._id });
  if (!pharmacy) {
    return next(new CustomError("Pharmacy not found", 404));
  }

  pharmacy.availabilityStatus = availabilityStatus;
  await pharmacy.save();

  return successRes(res, 200, true, "Status changed successfully", pharmacy);
});