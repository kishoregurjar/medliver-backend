const axios = require('axios');
const { GOOGLE_API_KEY_FOR_MAP } = process.env;
let API_KEY = GOOGLE_API_KEY_FOR_MAP;

const generateOTPNumber = (length) => {
  if (length <= 0) return 0;

  const min = Math.pow(10, length - 1);   // e.g., 1000 for 4 digits
  const max = Math.pow(10, length) - 1;   // e.g., 9999 for 4 digits

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getLatLngFromPlaceId = async (placeId) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: API_KEY,
        fields: 'formatted_address,address_component,geometry'
      }
    });

    const result = response.data.result;

    if (!result || !result.geometry || !result.address_components) {
      throw new Error('Location details not found');
    }

    const location = result.geometry.location;
    const components = result.address_components;
    console.log(components, "componenta")
    const getComponent = (types) =>
      components.find(c => types.every(t => c.types.includes(t)))?.long_name || '';

    const address = {
      street: getComponent(['route']) || getComponent(['sublocality']) || getComponent(['neighborhood']),
      city: getComponent(['locality']) || getComponent(['administrative_area_level_2']),
      state: getComponent(['administrative_area_level_1']),
      pincode: getComponent(['postal_code']),
    };

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      address
    };
  } catch (error) {
    console.error('Error fetching location details:', error.message);
    throw error;
  }
};


module.exports = { generateOTPNumber, getLatLngFromPlaceId };