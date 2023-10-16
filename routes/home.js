var express = require('express');
const bodyParser = require('body-parser');
const twilio = require('../lib/chat');
var router = express.Router();
var dbConn = require('../lib/mice_db');



const hotels = [
    {
        name: 'Hotel A',
        description: 'Lorem ipsum...',
        price: 100,
    },
    {
        name: 'Hotel B',
        description: 'Lorem ipsum...',
        price: 150,
    },
    {
        name: 'Hotel C',
        description: 'Lorem ipsum...',
        price: 120,
    },
    // Add more hotel data here
];

router.get('/', (req, res) => {
    res.render('index', { hotels, title: 'Home' });
}
);


router.use(bodyParser.urlencoded({ extended: false }));

router.get('/blog', (req, res) => {
    res.render('blogs', { title: 'Blog' });
}
);

router.get('/book/:hotelIndex', (req, res) => {
    const { hotelIndex } = req.params;
    res.render('booking/booking', { hotelIndex });
});

router.post('/book/:hotelIndex/confirm', (req, res) => {
    const { hotelIndex } = req.params;
    const { guestName, checkInDate, checkOutDate } = req.body;

    // Handle booking logic here (store booking data, etc.)

    res.send(`Booking confirmed at ${hotels[hotelIndex].name} for ${guestName}`);
});

router.post('/webhooks/messages', (req, res) => {
    const { Body, From } = req.body;

    // Implement your chatbot logic here
    const response = `You sent: ${Body}`;

    // Send a WhatsApp response
    twilio.sendWhatsAppMessage(From, response);

    res.sendStatus(200);
});


module.exports = router;