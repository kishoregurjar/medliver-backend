const nodemailer = require("nodemailer");
const { ForgetPasswordTemplate } = require("../emailTemplates/forgetPasswordTemplate");
const {generateOrderForm} = require('../emailTemplates/generateOrderTemplate')

module.exports.forgetPasswordMail = async (email, name, link) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;
  var toAddresses = email;

  let template;
  let subject;
  let body_text;
  template = ForgetPasswordTemplate(name, link);
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


module.exports.sendOrderFormMail = async (
  toEmail,
  toName,
  address,
  phone,
  websiteEmail,
  orderNo,
  date,
  products
) => {
  const smtpEndpoint = "smtp.gmail.com";
  const port = 587;
  const senderAddress = process.env.SMTP_USERNAME;

  const subject = `Purchase Order #${orderNo}`;
  const body_text = `Please find attached your purchase order #${orderNo}.`;

  const htmlTemplate = generateOrderForm(
    toName,
    address,
    phone,
    websiteEmail,
    orderNo,
    date,
    products
  );

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
    },
  });

  const mailOptions = {
    from: senderAddress,
    to: toEmail,
    subject: subject,
    text: body_text,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(" Error sending purchase order email:", error);
    return false;
  }
};
