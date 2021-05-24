var nodemailer = require("nodemailer");
var ejs = require("ejs");


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'covid19trackermail@gmail.com',
      pass: 'xd5duo5vZHG9BpnX'
    }
  });

ejs.renderFile(__dirname + "/index.ejs", function (err, data) {
if (err) {
    console.log(err);
} else {
    var mainOptions = {
        from: '"Tester" covid19trackermail@gmail.com',
        to: "harshmanojs12@gmail.com",
        subject: 'Hello, world',
        html: data
    };
    // console.log("html data ======================>", mainOptions.html);
    transporter.sendMail(mainOptions, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
}

});
