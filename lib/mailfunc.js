const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service (e.g., 'Gmail', 'Outlook', etc.)
    auth: {
        user: 'amahakennedy@gmail.com',
        pass: 'ipts pblf bteg dwlo'
    }
});

// Define email data
const mailOptions = {
    from: 'amahakennedy@gmail.com',
    to: 'kenmaha@gmail.com',
    subject: 'Test',
    text: 'This is the email content.'
};

// const sendEmail = {
//     from: 'amahakennedy@gmail.com',
//     to: email,
//     subject: 'Booking Event for ' + firstname + ' ' + lastname + ' Titled: ' + eventtitle,
//     text: 'You have successfully booked for this event, please find attached receipt.',
//     attachments: [{
//         filename: filename,
//         path: './public/attachments/' + filename

//     }]
// };

async function send_mail( sendEmail) {
    transporter.sendMail(sendEmail, (error, info) => {
        if (error) {
            console.error('Email could not be sent:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

module.exports = {
    send_mail
};
