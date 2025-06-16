const admin = require('firebase-admin');

let serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
}

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'medlivurr-web',
  });
}

const sendFirebaseNotification = async (deviceToken, title, body, data = {}, imageUrl = '') => {
  console.log(deviceToken, title, body, data, imageUrl);
  try {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
        image: 'https://media.istockphoto.com/id/1183183791/photo/talented-female-artist-works-on-abstract-oil-painting-using-paint-brush-she-creates-modern.jpg?s=2048x2048&w=is&k=20&c=dJJrGrY-BS5Flffk3JEBPKEhw5kR_fRoIbYsgiINKeQ=', // ✅ Include image URL here
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
          },
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: 'https://medliver-admin-panel.vercel.app/fulllogo.png',     // Optional icon
          image: 'https://media.istockphoto.com/id/1183183791/photo/talented-female-artist-works-on-abstract-oil-painting-using-paint-brush-she-creates-modern.jpg?s=2048x2048&w=is&k=20&c=dJJrGrY-BS5Flffk3JEBPKEhw5kR_fRoIbYsgiINKeQ=',    // ✅ Main image for web push
        },
      },
      // data, // optional data payload
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', {
      message: error.message,
      code: error.code,
      details: error.details || error.stack,
    });

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }
};
module.exports = sendFirebaseNotification;
