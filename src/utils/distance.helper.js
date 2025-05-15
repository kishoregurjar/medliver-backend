const axios = require('axios');
const API_KEY = process.env.GOOGLE_API_KEY_FOR_MAP;

const getRouteBetweenCoords = async (origin, destination) => {
    console.log(origin, destination)
    if (!origin || !destination) {
        throw new Error("Both origin and destination coordinates are required");
    }

    const originStr = `${origin.lat},${origin.long}`;
    const destinationStr = `${destination.lat},${destination.long}`;

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                origin: originStr,
                destination: destinationStr,
                key: API_KEY,
                alternatives: true
            }
        });

        const data = response.data;
        if (data.status !== 'OK' || !data.routes.length) {
            throw new Error("Could not find route between the locations");
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

        return {
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
        };
    } catch (error) {
        console.error('Google Directions API error:', error.message);
        throw new Error("Failed to get route");
    }
};

module.exports = getRouteBetweenCoords;
