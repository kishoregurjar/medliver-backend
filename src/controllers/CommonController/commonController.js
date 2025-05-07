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

        let address = await getLatLngFromPlaceId(suggestions[0].place_id);

        return successRes(res, 200, true, "Address suggestions fetched successfully", {
            suggestions,
            address
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
                place_id: placeId,
                key: API_KEY,
                fields: 'formatted_address,geometry'
            }
        });

        const result = response.data.result;

        if (!result || !result.geometry) {
            throw new Error('Location details not found');
        }

        const location = result.geometry.location;
        const address = result.formatted_address;

        return {
            lat: location.lat,
            lng: location.lng,
            address
        };
    } catch (error) {
        console.error('Error fetching location details:', error.message);
        throw error;
    }
}

module.exports.getDistanceBetweenCoords = asyncErrorHandler(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return next(new CustomError("Both origin and destination coordinates are required", 400));
    }

    // Expected format: origin = { lat: 22.7, lng: 75.8 }, destination = { lat: 22.8, lng: 75.9 }
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: originStr,
                destinations: destinationStr,
                key: API_KEY
            }
        });

        const data = response.data;

        if (
            data.rows &&
            data.rows[0] &&
            data.rows[0].elements &&
            data.rows[0].elements[0].status === 'OK'
        ) {
            const distanceInfo = data.rows[0].elements[0];

            return res.status(200).json({
                success: true,
                distance: distanceInfo.distance.text,
                duration: distanceInfo.duration.text,
                meters: distanceInfo.distance.value,
                seconds: distanceInfo.duration.value
            });
        } else {
            return next(new CustomError("Could not find distance between the locations", 404));
        }
    } catch (error) {
        console.error('Google Distance Matrix API error:', error.message);
        return next(new CustomError("Failed to calculate distance", 500));
    }
});

module.exports.getRouteBetweenCoords = asyncErrorHandler(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return next(new CustomError("Both origin and destination coordinates are required", 400));
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                origin: originStr,
                destination: destinationStr,
                key: API_KEY,
                alternatives: true // Allow multiple route options
            }
        });

        const data = response.data;

        if (data.status !== 'OK' || !data.routes.length) {
            return next(new CustomError("Could not find route between the locations", 404));
        }
        let shortestRoute = data.routes[0];
        let shortestDistance = shortestRoute.legs[0].distance.value;

        data.routes.forEach(route => {
            const distance = route.legs[0].distance.value;
            if (distance < shortestDistance) {
                shortestDistance = distance;
                shortestRoute = route;
            }
        });

        const leg = shortestRoute.legs[0];

        return successRes(res, 200, true, "Route fetched successfully", {
            distance: leg.distance.text,
            duration: leg.duration.text,
            start_address: leg.start_address,
            end_address: leg.end_address,
            steps: leg.steps.map(step => ({
                instruction: step.html_instructions,
                distance: step.distance.text,
                duration: step.duration.text,
                start_location: step.start_location,
                end_location: step.end_location
            })),
            overview_polyline: shortestRoute.overview_polyline.points
        });
    } catch (error) {
        console.error('Google Directions API error:', error.message);
        return next(new CustomError("Failed to get route", 500));
    }
});

