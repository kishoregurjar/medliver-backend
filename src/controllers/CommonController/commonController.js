const axios = require('axios');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const CustomError = require('../../utils/customError');
const { successRes } = require('../../services/response');
const API_KEY = 'AIzaSyAwrmb9xgfWFEoj15Rwek4lDU_boPz9EO8'; // Replace with your real key


module.exports.autoCompleteAddress = asyncErrorHandler(async (req, res, next) => {
    const { query } = req.body;

    if (!query) {
        return next(new CustomError("Address query is required", 400));
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params: {
                input: query,
                key: API_KEY,
                // types: 'geocode', // Limit to address-type suggestions
                language: 'en'
            }
        });

        const predictions = response.data.predictions;
        const suggestions = predictions.map(prediction => ({
            description: prediction.description,
            place_id: prediction.place_id
        }));

        // let address = await getLatLngFromPlaceId(suggestions[0].place_id);

        return successRes(res, 200, true, "Address suggestions fetched successfully", {
            success: true,
            suggestions,
            // address
        });
    } catch (error) {
        console.error("Google Places API error:", error.message);
        return next(new CustomError("Failed to fetch address suggestions", 500));
    }
});
async function getLatLngFromPlaceId(placeId) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                placeId,
                key: API_KEY,
                fields: 'formatted_address,geometry'
            }
        });

        const { result } = response.data;

        if (!result || !result.geometry) {
            throw new Error('Location details not found');
        }

        const { location, formattedAddress } = result.geometry;

        return {
            lat: location.lat,
            lng: location.lng,
            address: formattedAddress
        };
    } catch (error) {
        throw error;
    }
}

