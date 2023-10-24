var express = require('express');
var router = express.Router();
var dbConn = require('../lib/mice_db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// display user page
router.get('/', async function (req, res, next) {
    const menuItems = await getMenuItems();
    dbConn.query('SELECT * FROM mice_tbl_hotel ORDER BY hotelId desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('hotels/hotels', { data: '', title: 'Hotels', menuItems });
        } else {
            // render to views/users/index.ejs
            res.render('hotels/hotels', { data: rows, formatDate, title: 'Hotels', menuItems });
        }
    });
});




// display add user page
router.get('/add', async function (req, res, next) {
    const menuItems = await getMenuItems();
    // render to add.ejs
    res.render('hotels/add_hotel', {
        hotelName: '',
        country: '',
        state: '',
        city: '',
        location: '',
        address: '',
        contactInfo: '',
        description: '',
        ratings: '',
        pic: null,
        title: 'Add hotel', menuItems
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
// add a new hotel
router.post('/add', upload.array('images', maxCount), async function (req, res, next) {
    const menuItems = await getMenuItems();

    let hotelName = req.body.hotelName;
    let country = req.body.country;
    let state = req.body.state;
    let city = req.body.city;
    let location = req.body.location;
    let address = req.body.address;
    let contactInfo = req.body.contactInfo;
    let description = req.body.description;
    let ratings = req.body.ratings;
    const currentDateTime = getCurrentDateTime();
    console.log(req.files);
    let errors = false;

    if (hotelName.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter hotel Name");
        // render to add.ejs with flash message
        res.render('hotels/add_hotel', {
            hotelName: hotelName,
            country: country,
            state: state,
            city: city,
            location: location,
            address: address,
            contactInfo: contactInfo,
            description: description,
            ratings: ratings,
            title: 'Add hotel', menuItems
        })
    }

    // if no error
    if (!errors) {
        // Begin a database transaction
        dbConn.beginTransaction(function (err) {
            if (err) {
                req.flash('error', err);
                res.redirect('/hotels');
                return;
            }

            var form_data = {
                hotelName: hotelName,
                country: country,
                state: state,
                city: city,
                location: location,
                address: address,
                contactInfo: contactInfo,
                description: description,
                ratings: ratings
            }

            // Insert the hotel data
            dbConn.query('INSERT INTO mice_tbl_hotel SET ?', form_data, function (err, result) {
                if (err) {
                    // Rollback the transaction if an error occurs
                    dbConn.rollback(function () {
                        req.flash('error', err);
                        res.redirect('/hotels');
                    });
                } else {
                    // Query the inserted hotel data
                    dbConn.query('SELECT * FROM mice_tbl_hotel WHERE hotelName = ?', [hotelName], function (err, rows, fields) {
                        if (err) {
                            // Rollback the transaction if an error occurs
                            dbConn.rollback(function () {
                                req.flash('error', err);
                                res.redirect('/hotels');
                            });
                        } else {
                            if (req.files && req.files.length > 0) {
                                const imageRecords = req.files.map((file) => {
                                    return {
                                        imageOwner: hotelName,
                                        hotelId: rows[0].hotelId,
                                        path: file.path,
                                        description: 'Hotel Name: ' + hotelName + ', Country: ' + country + ', State: ' + state + ', City' + city + ', Address: ' + address,
                                        fieldname: file.fieldname,
                                        originalname: file.originalname,
                                        encoding: file.encoding,
                                        mimetype: file.mimetype,
                                        destination: file.destination,
                                        filename: file.filename,
                                        size: file.size
                                    };
                                });

                                // Create placeholders for the multiple records
                                const placeholders = imageRecords.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
                                const values = imageRecords.reduce((acc, record) => acc.concat(Object.values(record)), []);

                                const sql = `INSERT INTO mice_tbl_images (imageOwner, hotelId, path, description, fieldname, originalname, encoding, mimetype, destination, filename, size) VALUES ${placeholders}`;

                                // Insert the image records
                                dbConn.query(sql, values, function (err, result) {
                                    if (err) {
                                        // Rollback the transaction if an error occurs
                                        dbConn.rollback(function () {
                                            console.error('Database error:', err);
                                            req.flash('error', err);
                                            res.redirect('/hotels');
                                        });
                                    } else {
                                        // Commit the transaction if all operations succeed
                                        dbConn.commit(function (err) {
                                            if (err) {
                                                // Rollback the transaction if commit fails
                                                dbConn.rollback(function () {
                                                    req.flash('error', err);
                                                    res.redirect('/hotels');
                                                });
                                            } else {
                                                req.flash('success', 'Images and hotel data successfully added');
                                                res.redirect('/hotels');
                                            }
                                        });
                                    }
                                });
                            } else {
                                // Commit the transaction if there are no image uploads
                                dbConn.commit(function (err) {
                                    if (err) {
                                        // Rollback the transaction if commit fails
                                        dbConn.rollback(function () {
                                            req.flash('error', err);
                                            res.redirect('/hotels');
                                        });
                                    } else {
                                        req.flash('success', 'Hotel data successfully added');
                                        res.redirect('/hotels');
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    }
});


// display edit user page
router.get('/edit/(:id)', async function (req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems();

    dbConn.query('SELECT * FROM mice_tbl_hotel WHERE hotelId = ' + id, function (err, rows, fields) {
        if (err) throw err

        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'hotel not found with id = ' + id)
            res.redirect('/hotels')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('hotels/edit_hotel', {
                title: 'Edit hotel',
                id: rows[0].hotelId,
                hotelName: rows[0].hotelName,
                country: rows[0].country,
                state: rows[0].state,
                city: rows[0].city,
                location: rows[0].location,
                address: rows[0].address,
                contactInfo: rows[0].contactInfo,
                description: rows[0].description,
                ratings: rows[0].ratings,
                title: 'Edit hotel', menuItems
            })
        }
    })
})

// update hotel data
router.post('/update/:id', async function (req, res, next) {
    const menuItems = await getMenuItems();

    let id = req.params.id;
    let hotelName = req.body.hotelName;
    let country = req.body.country;
    let state = req.body.state;
    let city = req.body.city;
    let location = req.body.location;
    let address = req.body.address;
    let contactInfo = req.body.contactInfo;
    let description = req.body.description;
    let ratings = req.body.ratings;
    const currentDateTime = getCurrentDateTime();
    let errors = false;

    if (hotelName.length === 0 || contactInfo.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please provide respective data");
        // render to add.ejs with flash message
        res.render('hotels/edit_hotels', {
            hotelId: req.params.id,
            hotelName: hotelName,
            country: country,
            state: state,
            city: city,
            location: location,
            address: address,
            contactInfo: contactInfo,
            description: description,
            ratings: ratings,
            title: 'Edit hotel', menuItems
        });
    }

    // if no error
    if (!errors) {
        // Start a transaction
        dbConn.beginTransaction(function (err) {
            if (err) {
                // Handle transaction error
                req.flash('error', err);
                res.redirect('/hotels');
            } else {
                var form_data = {
                    hotelName: hotelName,
                    country: country,
                    state: state,
                    city: city,
                    location: location,
                    address: address,
                    contactInfo: contactInfo,
                    description: description,
                    ratings: ratings
                };

                // Update query within the transaction
                dbConn.query('UPDATE mice_tbl_hotel SET ? WHERE hotelId = ?', [form_data, id], function (err, result) {
                    if (err) {
                        // Rollback transaction and handle the error
                        dbConn.rollback(function () {
                            req.flash('error', err);
                            res.redirect('/hotels');
                        });
                    } else {
                        // Commit the transaction
                        dbConn.commit(function (err) {
                            if (err) {
                                // Rollback transaction and handle the error
                                dbConn.rollback(function () {
                                    req.flash('error', err);
                                    res.redirect('/hotels');
                                });
                            } else {
                                req.flash('success', 'Hotel successfully updated');
                                res.redirect('/hotels');
                            }
                        });
                    }
                });
            }
        });
    }
});


// delete user
router.get('/delete/(:id)', function (req, res, next) {

    let id = req.params.id;
    dbConn.beginTransaction(function (err) {
        if (err) {
            // Handle transaction error
            req.flash('error', err);
            res.redirect('/hotels');
        } else {
            dbConn.query('DELETE FROM mice_tbl_hotel WHERE hotelId = ' + id, function (err, result) {
                if (err) {
                    dbConn.rollback(function () {
                        // Rollback the transaction and handle the error
                        req.flash('error', err);
                        res.redirect('/hotels');
                    });
                } else {
                    dbConn.query('DELETE FROM mice_tbl_images WHERE hotelId = ' + id, function (err, result) {
                        if (err) {
                            dbConn.rollback(function () {
                                // Rollback the transaction and handle the error
                                req.flash('error', err);
                                res.redirect('/hotels');
                            });
                        } else {
                            // Commit the transaction after successful deletion of both hotel and images
                            dbConn.commit(function (err) {
                                if (err) {
                                    // Handle commit error
                                    dbConn.rollback(function () {
                                        req.flash('error', err);
                                        res.redirect('/hotels');
                                    });
                                } else {
                                    // Set flash message and redirect
                                    req.flash('success', 'Hotel and associated images successfully deleted! ID = ' + id);
                                    res.redirect('/hotels');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

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

//hotelmgmt
router.get('/hotelManagement', (req, res) => {

    var sqlstr = 'SELECT * FROM mice_tbl_hotel h JOIN mice_tbl_images i on i.hotelId = h.hotelId ';
    dbConn.query(sqlstr, function (err, rows, fields) {
        if (err) {

        } else {
            res.render('hotels/hotelmgmt', { title: 'Hotel Management', hotels: rows });
        }
    });

}
);


router.get('/checkout/(:id)', (req, res) => {
    let id = req.params.id;
    console.log('Hotel Id : ' + id);
    res.render('hotels/book_hotel', { title: 'Hotel Booking', id: id });
}
);

// Create a transporter using your email service's SMTP settings
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service (e.g., 'Gmail', 'Outlook', etc.)
    auth: {
        user: 'amahakennedy@gmail.com',
        pass: 'ipts pblf bteg dwlo'
    }
});


router.get('/actions/(:id)', async function (req, res,next) {

    const menuItems = await getMenuItems();
    let id = req.params.id;
    console.log(id);
    const sqlQuery = ' SELECT * FROM mice_tbl_customer c JOIN mice_tbl_bookings b ON b.customerId = c.customerId JOIN mice_tbl_hotel h ON h.hotelId = b.hotelId WHERE b.bookingId = '+id;
    dbConn.query(sqlQuery, function (err, rows) {
        if (err) {
            console.log(err);
            req.flash('Error', err);
            res.redirect('/hotels');
        } else {
            res.render('hotels/hotel_action',
                {
                    title: 'Hotel Actions',id: rows[0].bookingId,hotelName:rows[0].hotelName ,firstName: rows[0].firstName, middleName: rows[0].middleName, lastName: rows[0].lastName, organization: rows[0].organization,
                    email: rows[0].email, phoneNumber: rows[0].phoneNumber, address: rows[0].address, location: rows[0].location, city: rows[0].city, country: rows[0].country,
                     bookingDate: rows[0].bookingDate, checkinDate: rows[0].checkinDate, checkoutDate: rows[0].checkoutDate,
                    status: rows[0].status, totalPrice: rows[0].totalPrice, menuItems,formatDate
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
        dbConn.query('UPDATE mice_tbl_bookings SET ? WHERE bookingId  = ' + id, form_data, function (err, result) {
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

router.post('/booking/:id', function (req, res, next) {

    //Submitter Information
    let id = req.params.id;
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let address = req.body.address;
    let phone = req.body.phone;
    let organization = req.body.organization;
    let city = req.body.city;
    let country = req.body.country;
    let location = req.body.location;
    let gender = req.body.gender;
    let checkinDate = req.body.checkin;
    let checkoutDate = req.body.checkout;
    const dateTime = getCurrentDateTime();

    console.log(firstname, middlename, lastname, email, address, phone, organization, city, country, location, id, gender, checkinDate, checkoutDate);
    dbConn.beginTransaction(function (err) {
        if (err) {
            req.flash('Error', err);
            res.redirect('/hotels/hotelManagement');
            return;
        } else {
            var sqlStr = 'SELECT * FROM mice_tbl_customer c  JOIN mice_tbl_bookings b ON b.customerId = c.customerId' +
                ' JOIN mice_tbl_hotel h ON h.hotelId = b.hotelId WHERE c.email = ?  AND b.status IN (\'Pending\',\'Progress\',\'Delayed\',\'Canceled\')';
            dbConn.query(sqlStr, [email], function (err, rows, fields) {
                if (err) {
                    dbConn.rollback(function () {
                        req.flash('Error', err);
                        console.log(err);
                        res.redirect('/hotels/hotelManagement');
                    });
                } else {
                    if (rows.length > 0) {
                        req.flash('You have a pending booking in progress, Kindly contact customer service')
                        res.redirect('/hotels/hotelManagement');
                    } else {

                        console.log("No record found!!!");
                        var recordData = {
                            firstName: firstname,
                            middleName: middlename,
                            lastName: lastname,
                            organization: organization,
                            email: email,
                            phoneNumber: phone,
                            address: address,
                            location: location,
                            city: city,
                            country: country,
                            dateCreated: dateTime,
                            gender: gender
                        };

                        dbConn.query('INSERT INTO mice_tbl_customer SET ?', recordData, function (err, result) {
                            if (err) {
                                dbConn.rollback(function () {
                                    console.log(err);
                                    req.flash('Error', err);
                                    res.redirect('/hotels/hotelManagement');
                                });
                            } else {
                                sqlStr = 'SELECT * FROM mice_tbl_customer WHERE email = ? AND phoneNumber = ?';
                                dbConn.query(sqlStr, [email, phone], function (err, rows, fields) {
                                    if (err) {
                                        req.flash('Error', err);
                                        res.redirect('/hotels/hotelManagement');
                                    } else {
                                        console.log('Record found ' + rows[0].email);

                                        recordData = {
                                            customerId: rows[0].customerId,
                                            hotelId: id,
                                            bookingDate: dateTime,
                                            checkinDate: checkinDate,
                                            checkoutDate: checkoutDate,
                                            status: 'Pending',
                                            totalPrice: 0.00
                                        };
                                        sqlStr = 'INSERT INTO mice_tbl_bookings SET ?';
                                        dbConn.query(sqlStr, recordData, function (err, result) {
                                            if (err) {
                                                dbConn.rollback(function () {
                                                    console.log(err);
                                                    req.flash('Err', err);
                                                    res.redirect('/hotels/hotelManagement');
                                                });
                                            } else {
                                                dbConn.commit(function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                        req.flash('Error', err);
                                                        res.redirect('/hotels/hotelManagement');
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
                                                        doc.text('We have acknowledged your receipt for Booking accomodation ');
                                                        doc.text('Please note your receipt processing is in progress, and we will notify you once the review is completed.');
                                                        doc.text('The following are the details of your booking request:');
                                                        doc.text('Booking Date:   ' + dateTime);
                                                        doc.text('Check in Date: ' + checkinDate);
                                                        doc.text('Check out date:     ' + checkoutDate);
                                                        doc.text('Thank you!!! ');
                                                        doc.end();

                                                        const sendEmail = {
                                                            from: 'amahakennedy@gmail.com',
                                                            to: email,
                                                            subject: 'Booking Event for ' + firstname + ' ' + lastname + ' Titled: Accomodation',
                                                            text: 'You have successfully booked accomodation,\n please find attached receipt.',
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
                                });
                            }
                        });
                    }

                }
            });
        }
    });



});



module.exports = router;