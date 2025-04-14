const nodemailer = require("nodemailer");
const { ForgetPasswordTemplate } = require("../emailTemplates/forgetPasswordTemplate");


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


