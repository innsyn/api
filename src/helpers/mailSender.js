/* Copyright 2019 Schibsted */

const config = require('../../config.js');
const nodemailer = require('nodemailer');

module.exports = { sendMailAsText };

function sendMailAsText(to, subject, text) {
  return new Promise(function(resolve, reject) {
    let transporter = nodemailer.createTransport({
      host: config.get('smtp.host'),
      port: config.get('smtp.port'),
      secure: config.get('smtp.secure'),
      auth: {
        user: config.get('smtp.auth.user'),
        pass: config.get('smtp.auth.password'),
      },
    });

    let mailOptions = {
      from: config.get('smtp.from_address'),
      to: to,
      subject: subject,
      text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}
