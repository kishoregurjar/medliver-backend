// // const admin = require('firebase-admin');

// // // 👇 path to the JSON file you downloaded
// // const serviceAccount = require('../config/firebaseServiceAccount.config.json');

// // // 👇 initialize admin SDK
// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount)
// // });

// // const registrationToken = 'ExponentPushToken[xxxxxxx]'; // Expo token

// // const message = {
// //   notification: {
// //     title: 'Hello from Medliver',
// //     body: 'New task assigned to you',
// //   },
// //   token: registrationToken,
// // };

// // admin.messaging().send(message)
// //   .then(response => {
// //     console.log('Successfully sent message:', response);
// //   })
// //   .catch(error => {
// //     console.log('Error sending message:', error);
// //   });




// // utils/sendFirebaseNotification.js

const admin = require('firebase-admin');
const serviceAccount = require('../config/firebaseServiceAccount.config.json');

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'medliversetup',
  });
}

/**
 * Send FCM Notification to a single device (HTTP v1)
 * @param {string} deviceToken - FCM token of the device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<{ success: boolean, response?: any, error?: any }>}
 */
const sendFirebaseNotification = async (deviceToken, title, body) => {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
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
