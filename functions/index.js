const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true}); // Enable CORS for all origins

// Initialize the Firebase Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => { // Wrap the entire function with CORS
    const {to, subject, text, html} = req.body;

    // Validate the input
    if (!to || !subject || (!text && !html)) {
      return res.status(400).send({
        error: "Missing required parame",
      });
    }

    // Configure the email transporter. Use environment variables.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "garygabreil@gmail.com",
        pass: "veaf fgfb cbrm barr",
      },
    });

    const mailOptions = {
      from: "garygabreil@gmail.com", // Use the configured email
      to,
      subject,
      text,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      res.status(200).send({
        message: "Email sent successfully",
        info,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send({
        error: "Failed to send email",
        details: error.message,
      });
    }
  });
});



