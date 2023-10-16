const twilio = require('twilio');

// Your Twilio Account SID and Auth Token
const accountSid = 'ACdd4b03d5fe7ca4c9484ecf7866305058';
const authToken = 'bd2b7998f222d4ce9d1f1a21875dc0e1';

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
