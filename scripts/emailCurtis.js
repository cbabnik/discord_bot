const nodemailer = require('nodemailer');
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const { GMAIL_USERNAME, GMAIL_PASSWORD } = require('../auth.js')

console.log("Preparing to mail curtis")

var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: GMAIL_USERNAME,
        pass: GMAIL_PASSWORD
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.log("Transporter error");
        console.log(error);
        process.exit(1)
    } else {
        console.log("Server is ready to take our messages");
    }

    var mailOptions = {
        from: 'buck.bot.beta@gmail.com',
        to: 'curtisbabnik@gmail.com',
        subject: 'Buckbot Crash',
        html: 'Buckbot crashed.',
    };
    
    transporter.sendMail(mailOptions, function(err, info){
        transporter.close();
        if(err) {
            console.log("Mail failed")
            console.log(err)
            process.exit(1)
        }
        else {
            console.log("Mail succeeded")
            process.exit(0)
        }
    });
});