module.exports.OtpVerificationTemplate = (name, otp) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Email Verification</title>
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
              .otp-code {
                  display: inline-block;
                  padding: 15px 30px;
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                  background-color: #f1f1f1;
                  border-radius: 6px;
                  letter-spacing: 4px;
                  margin: 20px 0;
              }
              .footer {
                  font-size: 14px;
                  color: #888;
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Hello, ${name}</h2>
              <p>Use the OTP below to verify your email address.</p>
              <div class="otp-code">${otp}</div>
              <p>Please do not share this OTP with anyone. It will expire in 10 minutes.</p>
              <div class="footer">
                  <p>If you did not request this, please ignore this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  };
  