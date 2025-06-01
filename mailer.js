const transporter = require("./config/emailConfig");
const generateRegistrationEmail = require("./templates/registrationEmail");

const sendRegistrationEmail = async (to, id) => {
  const { subject, html } = generateRegistrationEmail(id);

  const mailOptions = {
    from: `PPDB Admin <${process.env.EMAIL_USER}`,
    to,
    subject,
    html,
  };


  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return info;
  } catch (error) {
    console.error("Email failed to send: ", error);
    throw error;
  }
};

module.exports = sendRegistrationEmail;