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
                lng: locationData.lng
            }
        },
        { new: true }
    );

    if (!updatedPharmacy) {
        return errorRes(res, 404, false, "Pharmacy not found");
    }

    return successRes(res, 200, true, "Address updated successfully", updatedPharmacy);
});