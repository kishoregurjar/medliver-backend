const nodemailer = require("nodemailer");
const { OtpVerificationTemplate } = require("../emailTemplates/otpVerificationTemplate");
const { ForgetPasswordTemplateDeliveryPartner } = require("../emailTemplates/forgetPasswordDeliveryPartner");
const { DeliveryPartnerOtpTemplate } = require("../emailTemplates/pickupOrderTemplate");


module.exports.forgetPasswordMail = async (email, name, link) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;
  var toAddresses = email;

  let template;
  let subject;
  let body_text;
  template = ForgetPasswordTemplateDeliveryPartner(name, link);
  subject = "Forget Password";
  body_text = `Please reset your password on below given link`;


  let transporter = nodemailer.createTransport({
    host: smtpEndpoint,
    port: port,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    }
  });

  let mailOptions = {
    from: senderAddress,
    to: toAddresses,
    subject: subject,
    text: body_text,
    html: template,
    headers: {},
  };

  try {

    let info = await transporter.sendMail(mailOptions);
  }
  catch (error) {
    console.log(error, "error");
  }
}

module.exports.forgetPasswordMailDeliverypartner = async (email, name, otp) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;
  var toAddresses = email;

  let template;
  let subject;
  let body_text;
  template = ForgetPasswordTemplateDeliveryPartner(name, otp);
  subject = "Forget Password";
  body_text = `Please reset your password on below given link`;


  let transporter = nodemailer.createTransport({
    host: smtpEndpoint,
    port: port,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    }
  });

  let mailOptions = {
    from: senderAddress,
    to: toAddresses,
    subject: subject,
    text: body_text,
    html: template,
    headers: {},
  };

  try {

    let info = await transporter.sendMail(mailOptions);
  }
  catch (error) {
    console.log(error, "error");
  }
}

module.exports.verifyOTPMail = async (email, name, otp) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;
  const toAddresses = email;

  const template = OtpVerificationTemplate(name, otp);
  const subject = "OTP Verification";
  const body_text = `Please verify your OTP`;

  let transporter = nodemailer.createTransport({
    host: smtpEndpoint,
    port: port,
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    }
  });

  const mailOptions = {
    from: senderAddress,
    to: toAddresses,
    subject: subject,
    text: body_text,
    html: template,
    headers: {},
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("OTP mail sent:", info.messageId);
    return true;
  } catch (error) {
    console.log("Error sending OTP mail:", error);
    return false;
  }
};

module.exports.pickupOrderMail = async (email, name, otp, orderId) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;
  const toAddresses = email;

  const template = DeliveryPartnerOtpTemplate(name, otp, orderId);
  const subject = "One Time Password For Pickup Order";
  const body_text = `Please Provide Your One Time Password to Pharmacy For Pickup Order`;

  let transporter = nodemailer.createTransport({
    host: smtpEndpoint,
    port: port,
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    }
  });

  const mailOptions = {
    from: senderAddress,
    to: toAddresses,
    subject: subject,
    text: body_text,
    html: template,
    headers: {},
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("OTP mail sent:", info.messageId);
    return true;
  } catch (error) {
    console.log("Error sending OTP mail:", error);
    return false;
  }
};
