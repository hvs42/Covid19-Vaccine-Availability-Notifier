require('dotenv').config()
let nodemailer = require('nodemailer');
var ejs = require("ejs");

const EMAIL = process.env.EMAIL;
const PASS = process.env.APPLICATION_PASSWORD;
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL,
        pass: PASS
    }
  });



exports.sendEmail = function (emailid, slotDetails, pincode, callback) {

    console.log("Hello : -",slotDetails);
    
    ejs.renderFile(__dirname + "/index.ejs",{ slotarray: slotDetails, pincode: pincode }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            var mainOptions = {
                from: String('Vaccine Availablity Checker'),
                bcc: emailid,
                subject: 'Covid19 Vaccine Available in your given pincode',
                html: data
            };

            transporter.sendMail(mainOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        }
        
        })
    };
