const twilio = require('twilio');
const db = require('./mice_db');



// Your Twilio Account SID and Auth Token
const accountSid = 'AC000000000000000000000';
const authToken = 'bd0000000000000000000000';

// Create a Twilio client
const client =  twilio(accountSid, authToken);

// Function to send a WhatsApp message
function sendWhatsAppMessage(to, message) {
    // Use the Twilio client to send a WhatsApp message
    client.messages
        .create({
            to: `whatsapp:${to}`, // Use the WhatsApp number with the 'whatsapp:' prefix
            from: '+254721761692', // Your Twilio phone number
            body: message,
        })
        .then((message) => console.log(`Message sent with SID: ${message.sid}`))
        .catch((error) => console.error(`Error sending message: ${error.message}`));
}

module.exports = {
    sendWhatsAppMessage,
};
