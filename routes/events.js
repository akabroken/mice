var express = require('express');
var router = express.Router();
var dbConn = require('../lib/mice_db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Create a transporter using your email service's SMTP settings
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

// display user page
router.get('/', async function (req, res, next) {
    const menuItems = await getMenuItems();
    dbConn.query('SELECT * FROM mice_tbl_events ORDER BY eventId desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('events/events', { data: '', title: 'Events', menuItems });
        } else {
            // render to views/users/index.ejs
            res.render('events/events', { data: rows, formatDate, title: 'Events', menuItems });
        }
    });
});



// display add user page
router.get('/add', async function (req, res, next) {
    const menuItems = await getMenuItems();
    // render to add.ejs
    res.render('events/add_event', {
        organizerId: '',
        eventName: '',
        location: '',
        description: '',
        price: '',
        title: 'Add event', menuItems
    })
})

// Function to format the date
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function dateFormat(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} `;
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
}
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}`;
    return formattedDateTime;
}
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDateTime = `${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
}



const maxSize = 1 * 1000 * 1000;
const maxCount = 10;
// Set up Multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDestination = path.join(__dirname, 'public', 'uploads', 'images');
        if (!fs.existsSync(uploadDestination)) {
            fs.mkdirSync(uploadDestination, { recursive: true });
        }
        cb(null, uploadDestination);

        // cb(null, path.join(__dirname, 'public', 'uploads', 'images'));
        // Specify the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename the uploaded file
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
});

// add a new user
router.post('/add', async function (req, res, next) {

    const menuItems = await getMenuItems();
    let organizerId = req.body.organizerId;
    let eventName = req.body.eventName;
    let location = req.body.location;
    let description = req.body.description;
    let price = req.body.price;

    const currentTime = getCurrentTime();
    const currentDate = getCurrentDate();

    let errors = false;

    if (organizerId.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter hotel Name");
        // render to add.ejs with flash message
        res.render('events/add_event', {
            organizerId: organizerId,
            eventName: eventName,
            location: location,
            description: description,
            price: price,
            title: 'Add event', menuItems
        })
    }

    // if no error
    if (!errors) {

        var form_data = {
            organizerId: organizerId,
            eventName: eventName,
            location: location,
            description: description,
            price: price,
            eventdate: currentDate,
            eventTime: currentTime
        }

        // insert query
        dbConn.query('INSERT INTO mice_tbl_events SET ?', form_data, function (err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)

                // render to add.ejs
                res.render('events/add_event', {
                    organizerId: form_data.organizerId,
                    eventName: form_data.eventName,
                    location: form_data.location,
                    description: form_data.description,
                    price: form_data.price,
                    title: 'Add event', menuItems
                })
            } else {
                req.flash('success', 'Event successfully added');
                res.redirect('/events');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)', async function (req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems();
    dbConn.query('SELECT * FROM mice_tbl_events WHERE eventId = ' + id, function (err, rows, fields) {
        if (err) throw err

        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'Event not found with id = ' + id)
            res.redirect('/events')
        }
        // if user found
        else {

            // render to edit.ejs
            res.render('events/edit_event', {
                title: 'Edit Event',
                id: rows[0].eventId,
                organizerId: rows[0].organizerId,
                eventName: rows[0].eventName,
                location: rows[0].location,
                description: rows[0].description,
                price: rows[0].price,
                title: 'Edit event', menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id', async function (req, res, next) {

    const menuItems = await getMenuItems();
    let id = req.params.id;
    let organizerId = req.body.organizerId;
    let eventName = req.body.eventName;
    let location = req.body.location;
    let description = req.body.description;
    let price = req.body.price;
    const currentDateTime = getCurrentDateTime();
    let errors = false;

    if (eventName.length === 0 || location.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('events/edit_event', {
            eventId: req.params.id,
            organizerId: organizerId,
            eventName: eventName,
            location: location,
            description: description,
            price: price,
            title: 'Edit event', menuItems
        })
    }

    // if no error
    if (!errors) {
        var form_data = {
            organizerId: organizerId,
            eventName: eventName,
            location: location,
            description: description,
            price: price
        }
        // update query
        dbConn.query('UPDATE mice_tbl_events SET ? WHERE eventId  = ' + id, form_data, function (err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('events/edit_event', {
                    eventId: req.params.id,
                    organizerId: form_data.organizerId,
                    eventName: form_data.eventName,
                    location: form_data.location,
                    description: form_data.description,
                    price: form_data.price,
                    title: 'Edit event', menuItems
                })
            } else {
                req.flash('success', 'Event successfully updated');
                res.redirect('/events');
            }
        })
    }
})

// delete user
router.get('/delete/(:id)', function (req, res, next) {

    let id = req.params.id;

    dbConn.query('DELETE FROM mice_tbl_events WHERE eventId = ' + id, function (err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/events')
        } else {
            // set flash message
            req.flash('success', 'Event successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/events')
        }
    })
})

const getMenuItems = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM mice_tbl_menu_items ORDER BY id ASC';
        dbConn.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

//Events booking process



router.get('/eventManagement', (req, res) => {
    res.render('events/eventmgmt', { title: 'Event Management' });
}
);

router.get('/book', (req, res) => {

    res.render('events/book_event', { title: 'Event Booking' });
}
);

router.post('/booking', upload.array('imageupload', maxCount), function (req, res, next) {

    //Submitter Information
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let address = req.body.address;
    let phone = req.body.phone;
    let organization = req.body.organization;
    let city = req.body.city;
    let county = req.body.county;
    let org_location = req.body.org_location;

    //Event Information 
    let eventtitle = req.body.eventtitle;
    let outreach = req.body.outreach;
    let support = req.body.support;
    let networking = req.body.networking;
    let education = req.body.education;
    let fundraising = req.body.fundraising;
    let others = req.body.eventothers;
    let eventlocation = req.body.eventlocation;
    let eventDate = req.body.eventDate;
    let allDay = req.body.allDay;
    let eventdays = req.body.eventdays;
    let start_time = req.body.start;
    let end_time = req.body.end;
    let repeating = req.body.repeating;
    let eventdescription = req.body.eventdescription;

    //Advertising Information
    let marketingsupport = req.body.marketingsupport;
    let social = req.body.social;
    let newspaper = req.body.newspaper;
    let radio = req.body.radioadd;
    let billboard = req.body.billboard;
    let email_campaign = req.body.emailcamp;
    let marketing_others = req.body.advtothers;
    let ticketsold = req.body.ticketsold;
    let ticketsale = req.body.ticketsale;
    let sponsor = req.body.sponsor;
    let sponsorlist = req.body.sponsorlist;

    const currentDateTime = getCurrentDateTime();

    if (repeating === 'No') {
        eventdays = 1;
    }


    // console.log(firstname, middlename, lastname, email, address, phone, organization, city, county, org_location);
    // console.log(eventtitle, outreach, support, networking, education, fundraising, others, eventlocation, eventDate, allDay, start_time, end_time, repeating, eventdescription)
    // console.log(marketingsupport, social, newspaper, radio, billboard, email_campaign, marketing_others, ticketsold, ticketsale, sponsor, sponsorlist);


    dbConn.beginTransaction(function (err) {
        if (err) {
            req.flash('Error', err);
            res.redirect('/');
            return;
        }

        dbConn.query('SELECT * FROM mice_tbl_customer WHERE email = ? AND phoneNumber = ?', [email, phone], function (err, rows, fields) {
            if (err) {
                dbConn.rollback(function () {
                    req.flash('Error', err);
                    console.log('Error', err);
                    res.redirect('/events/book');
                })
            } else {

                if (rows.length > 0) {
                    console.log('Error Customer already regestered!!');
                    req.flash('Customer already regestered!!');
                    res.redirect('/events/book');
                } else {
                    //Sponsor array
                    var sponsor_data = {
                        firstName: firstname,
                        middleName: middlename,
                        lastName: lastname,
                        organization: organization,
                        email: email,
                        phoneNumber: phone,
                        address: address,
                        location: org_location,
                        city: city,
                        country: 'Kenya'
                    };

                    dbConn.query('INSERT INTO mice_tbl_customer SET ?', sponsor_data, function (err, result) {
                        if (err) {
                            dbConn.rollback(function () {
                                console.log('Error', err);
                                req.flash('DB Error', err);
                                res.redirect('/events/book');
                            });
                        } else {
                            dbConn.query('SELECT * FROM mice_tbl_customer WHERE email = ? AND phoneNumber = ?', [email, phone], function (err, rows, fields) {
                                if (err) {
                                    dbConn.rollback(function () {
                                        console.log('Error', err);
                                        req.flash('Error', err);
                                        res.redirect('/events/book');
                                    });
                                } else {
                                    if (rows.length < 0) {
                                        dbConn.rollback(function () {
                                            console.log('Error Customer not found', err);
                                            req.flash('Customer not found!!');
                                            res.redirect('/events/book');
                                        });
                                    } else {
                                        const values = [outreach, support, networking, education, fundraising, others];
                                        const eventType = values.join(', ');
                                        var event_data = {
                                            customerId: rows[0].customerId,
                                            eventName: eventtitle,
                                            eventdate: eventDate,
                                            eventStartTime: start_time,
                                            eventEndTime: end_time,
                                            location: eventlocation,
                                            description: eventdescription,
                                            price: 0.00,
                                            eventType: eventType,
                                            allDay: allDay,
                                            repeating: repeating
                                        };

                                        dbConn.query('INSERT INTO mice_tbl_events SET ? ', event_data, function (err, result) {
                                            if (err) {
                                                dbConn.rollback(function () {
                                                    console.log('Error Insert Ivents', err);
                                                    req.flash('Error', err);
                                                    res.redirect('/events/book');
                                                });
                                            } else {
                                                dbConn.query('SELECT eventId,eventdate, eventStartTime, eventEndTime FROM mice_tbl_events e INNER JOIN mice_tbl_customer c ON c.customerId = e.customerId WHERE c.email = ? and c.phoneNumber = ?', [email, phone], function (err, rows, fields) {
                                                    if (err) {
                                                        dbConn.rollback(function () {
                                                            console.log('Error', err);
                                                            req.flash('Error', err);
                                                            res.redirect('/events/book');
                                                        });
                                                    }
                                                    else {
                                                        if (rows.length < 0) {
                                                            dbConn.rollback(function () {
                                                                console.log('Error fetch Event data from Event Table', err);
                                                                req.flash('Problem adding records');
                                                                res.redirect('/events/book');
                                                            });
                                                        } else {
                                                            var s_date = new Date(rows[0].eventdate);
                                                            s_date.setDate(s_date.getDate() + eventdays);
                                                            var checkoutDate = s_date.toISOString().split('T')[0];
                                                            var booking_data = {
                                                                eventId: rows[0].eventId,
                                                                bookingDate: currentDateTime,
                                                                checkinDate: rows[0].eventdate,
                                                                checkoutDate: checkoutDate,
                                                                status: 'Pending',
                                                                totalPrice: 0.00
                                                            };

                                                            dbConn.query('INSERT INTO mice_tbl_bookings SET ?', booking_data, function (err, result) {
                                                                if (err) {
                                                                    dbConn.rollback(function () {
                                                                        console.log('Insert error tbl booking Error', err);
                                                                        req.flash('Error', err);
                                                                        res.redirect('/events/book');
                                                                    });

                                                                }
                                                                else {
                                                                    dbConn.commit(function (err) {
                                                                        if (err) {
                                                                            dbConn.rollback(function () {
                                                                                console.log('Commit Error', err);
                                                                                req.flash('Error', err);
                                                                                res.redirect('/events/book');
                                                                            });
                                                                        } else {
                                                                            const doc = new PDFDocument();
                                                                            var filename = firstname + '_' + lastname + '_BookingSlip.pdf';
                                                                            // const attachmentPath = path.join(__dirname, 'public', 'attachments', firstname + '_' + lastname + '_BookingSlip.pdf');
                                                                            doc.pipe(fs.createWriteStream('./public/attachments/' + filename));
                                                                            //doc.image
                                                                            doc.fontSize(14);
                                                                            doc.text('MICE BOOKING RECEIPT', 100, 100);
                                                                            doc.fontSize(12);
                                                                            doc.text('Dear ' + firstname + ' ' + lastname + ',');
                                                                            doc.text('');
                                                                            doc.text('We have acknowledged your receipt for Event booking titled: ' + eventtitle);
                                                                            doc.text('Please note your receipt processing is in progress, and we will notify you once the review is completed.');
                                                                            doc.text('The following are the details of your booking request:');
                                                                            doc.text('Booking Date:   ' + currentDateTime);
                                                                            doc.text('Scheduled Date: ' + eventDate);
                                                                            doc.text('Start date:     ' + eventDate);
                                                                            doc.text('Scheduled Time From: ' + start_time + ' to ' + end_time);
                                                                            doc.end();

                                                                            const sendEmail = {
                                                                                from: 'amahakennedy@gmail.com',
                                                                                to: email,
                                                                                subject: 'Booking Event for ' + firstname + ' ' + lastname + ' Titled: ' + eventtitle,
                                                                                text: 'You have successfully booked for this event, please find attached receipt.',
                                                                                attachments: [{
                                                                                    filename: filename,
                                                                                    path: './public/attachments/' + filename

                                                                                }]
                                                                            };

                                                                            transporter.sendMail(sendEmail, (error, info) => {
                                                                                if (error) {
                                                                                    console.error('Email could not be sent:', error);
                                                                                } else {
                                                                                    console.log('Email sent:', info.response);
                                                                                }
                                                                            });

                                                                            req.flash('success', 'Booking completed successfully');
                                                                            res.redirect('/events/book')
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }

                                }
                            });
                        }

                    });
                }
            }
        });
    });
});

router.get('/actions/(:id)', async function (req, res,next) {

    const menuItems = await getMenuItems();
    let id = req.params.id;
    console.log(id);
    const sqlQuery = 'SELECT * FROM mice_tbl_events e INNER JOIN mice_tbl_customer c ON c.customerId=e.customerId INNER JOIN mice_tbl_bookings b ON b.eventId= e.eventId WHERE e.eventId = '+id;
    dbConn.query(sqlQuery, function (err, rows) {
        if (err) {
            console.log(err);
            req.flash('Error', err);
            res.redirect('/events');
        } else {
            res.render('events/event_action',
                {
                    title: 'Event Actions',id: rows[0].eventId ,firstName: rows[0].firstName, middleName: rows[0].middleName, lastName: rows[0].lastName, organization: rows[0].organization,
                    email: rows[0].email, phoneNumber: rows[0].phoneNumber, address: rows[0].address, location: rows[0].location, city: rows[0].city, country: rows[0].country,
                    eventName: rows[0].eventName, eventDate: rows[0].eventDate, eventStartTime: rows[0].eventStartTime, eventEndTime: rows.eventEndTime,
                    location: rows[0].location, eventType: rows[0].eventType, bookingDate: rows[0].bookingDate, checkinDate: rows[0].checkinDate, checkoutDate: rows[0].checkoutDate,
                    status: rows[0].status, totalPrice: rows[0].totalPrice, menuItems,dateFormat
                });
        }
    });

});

// update user data
router.post('/process/:id', async function (req, res, next) {

    const menuItems = await getMenuItems();
    let id = req.params.id;
    let status = req.body.status;
    let totalPrice = req.body.totalPrice;
    const currentDateTime = getCurrentDateTime();
    let errors = false;

    if (status.length === 0 || totalPrice.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('events/edit_event', {
            title: 'Edit event', menuItems
        })
    }

    // if no error
    if (!errors) {
        var form_data = {
            status: status,
            totalPrice: totalPrice,    
        }
        // update query
        dbConn.query('UPDATE mice_tbl_bookings SET ? WHERE eventId  = ' + id, form_data, function (err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('events', {
                  
                })
            } else {
                req.flash('success', 'Successfully updated');
                res.redirect('/events');
            }
        })
    }
});


module.exports = router;