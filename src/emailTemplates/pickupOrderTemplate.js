module.exports.DeliveryPartnerOtpTemplate = (name, otp, orderId) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Pickup OTP Verification</title>
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
            <p>Please use the OTP below to verify the pickup of Order <strong>#${orderId}</strong>.</p>
            <div class="otp-code">${otp}</div>
            <p>This OTP is required to proceed with the medicine pickup. It is valid for 10 minutes only.</p>
            <div class="footer">
                <p>If you were not assigned this delivery, please contact support immediately.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
