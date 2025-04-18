module.exports.ForgetPasswordTemplateDeliveryPartner = (name, otp) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  text-align: center;
                  padding: 40px;
              }
              .container {
                  background: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                  max-width: 500px;
                  margin: auto;
              }
              .otp {
                  font-size: 24px;
                  font-weight: bold;
                  background-color: #e9ecef;
                  padding: 10px 20px;
                  border-radius: 5px;
                  display: inline-block;
                  margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Hello, ${name}</h2>
              <p>You requested to reset your password. Use the OTP below to proceed:</p>
              <div class="otp">${otp}</div>
              <p>This OTP is valid for a limited time. Do not share it with anyone.</p>
              <p>If you didn’t request this, please ignore this email.</p>
          </div>
      </body>
      </html>
    `;
};
