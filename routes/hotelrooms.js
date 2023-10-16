var express = require('express');
var router = express.Router();
var dbConn = require('../lib/mice_db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



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


// display user page
router.get('/', async function (req, res, next) {
    const menuItems = await getMenuItems();
    dbConn.query('SELECT * FROM  mice_tbl_rooms ORDER BY roomId desc', function (err, rows) {
        if (err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('hotels/hotel_rooms', { data: '', title: 'Rooms', menuItems });
        } else {
            // render to views/users/index.ejs
            res.render('hotels/hotel_rooms', { data: rows, formatDate, title: 'Rooms', menuItems });
        }
    });
});



// display add user page
router.get('/add', async function (req, res, next) {
    const menuItems = await getMenuItems();
    // render to add.ejs
    // res.render('hotels/add_hotel_room', {
    //     hotelId: '',
    //     roomNumber: '',
    //     roomType: '',
    //     pricePerNight: '',
    //     availability: '',
    //     title: 'Add room', menuItems
    // })

    dbConn.query('SELECT * FROM mice_tbl_hotel', function (err, rows) {
        if (err) {
            req.flash('error', err);
            renderAddPage(res, '', '', '', '', '');
        } else {
            renderAddPage(res, '', '', '', '', rows);
        }
    })
});

// Function to render add.ejs page with flash message and data
async function renderAddPage(res, roomNumber, roomType, pricePerNight, availability, data) {
    const menuItems = await getMenuItems();
    res.render('hotels/add_hotel_room', {
        roomNumber: roomNumber,
        roomType: roomType,
        pricePerNight: pricePerNight,
        availability: availability,
        data: data,
        title: 'Add room', menuItems
    });
}


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


// add a new user
router.post('/add', upload.array('images', maxCount), async function (req, res, next) {
    const menuItems = await getMenuItems();
    let hotelId = req.body.hotelId;
    let roomNumber = req.body.roomNumber;
    let roomType = req.body.roomType;
    let pricePerNight = req.body.pricePerNight;
    let availability = req.body.availability;


    const currentDateTime = getCurrentDateTime();

    let errors = false;

    if (hotelId.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter hotel Name");
        // render to add.ejs with flash message
        res.render('hotels/add_hotel_room', {
            hotelId: hotelId,
            roomNumber: roomNumber,
            roomType: roomType,
            pricePerNight: pricePerNight,
            availability: availability,
            title: 'Add room', menuItems
        })
    }

    // if no error
    if (!errors) {

        dbConn.beginTransaction(function (err) {
            if (err) {
                req.flash('error', err);
                res.redirect('/hotels');
                return;
            } else {

                var form_data = {
                    hotelId: hotelId,
                    roomNumber: roomNumber,
                    roomType: roomType,
                    pricePerNight: pricePerNight,
                    availability: availability
                }
                // insert query
                dbConn.query('INSERT INTO mice_tbl_rooms SET ?', form_data, function (err, result) {
                    //if(err) throw err
                    if (err) {
                        dbConn.rollback(function () {
                            req.flash('error', err)
                            // render to add.ejs
                            res.render('hotels/add_hotel_room', {
                                hotelId: form_data.hotelId,
                                roomNumber: form_data.roomNumber,
                                roomType: form_data.roomType,
                                pricePerNight: form_data.pricePerNight,
                                availability: form_data.availability,
                                title: 'Add room', menuItems
                            })
                        });

                    } else {
                        // Query the inserted hotel data
                        dbConn.query('SELECT * FROM mice_tbl_rooms WHERE hotelId = ?', [hotelId], function (err, rows, fields) {
                            if (err) {
                                // Rollback the transaction if an error occurs
                                dbConn.rollback(function () {
                                    req.flash('error', err);
                                    res.redirect('/hotelrooms');
                                });
                            } else {
                                if (req.files && req.files.length > 0) {
                                    const imageRecords = req.files.map((file) => {
                                        return {
                                            imageOwner: roomNumber,
                                            roomId: rows[0].roomId,
                                            path: file.path,
                                            description: 'Room type: ' + roomType + ', roomNumber: ' + roomNumber + ', pricePerNight: ' + pricePerNight,
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

                                    const sql = `INSERT INTO mice_tbl_images (imageOwner, roomId, path, description, fieldname, originalname, encoding, mimetype, destination, filename, size) VALUES ${placeholders}`;

                                    // Insert the image records
                                    dbConn.query(sql, values, function (err, result) {
                                        if (err) {
                                            // Rollback the transaction if an error occurs
                                            dbConn.rollback(function () {
                                                console.error('Database error:', err);
                                                req.flash('error', err);
                                                res.redirect('/hotelrooms');
                                            });
                                        } else {
                                            // Commit the transaction if all operations succeed
                                            dbConn.commit(function (err) {
                                                if (err) {
                                                    // Rollback the transaction if commit fails
                                                    dbConn.rollback(function () {
                                                        req.flash('error', err);
                                                        res.redirect('/hotelrooms');
                                                    });
                                                } else {
                                                    req.flash('success', 'Images and hotel data successfully added');
                                                    res.redirect('/hotelrooms');
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
                                                res.redirect('/hotelrooms');
                                            });
                                        } else {
                                            req.flash('success', 'Hotel data successfully added');
                                            res.redirect('/hotelrooms');
                                        }
                                    });
                                }
                            }
                        });

                    }
                });
            }
        });




    }
})

// display edit user page
router.get('/edit/(:id)', async function (req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems();

    dbConn.query('SELECT * FROM mice_tbl_rooms WHERE roomId = ' + id, function (err, rows, fields) {
        if (err) throw err

        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'hotel rooms not found with id = ' + id)
            res.redirect('/hotelrooms')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('hotels/edit_hotel_room', {
                title: 'Edit hotel room',
                id: rows[0].roomId,
                hotelId: rows[0].hotelId,
                roomNumber: rows[0].roomNumber,
                roomType: rows[0].roomType,
                pricePerNight: rows[0].pricePerNight,
                availability: rows[0].availability,
                title: 'Edit room', menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id', async function (req, res, next) {

    let id = req.params.id;
    let hotelId = req.body.hotelId;
    let roomNumber = req.body.roomNumber;
    let roomType = req.body.roomType;
    let pricePerNight = req.body.pricePerNight;
    let availability = req.body.availability;
    const menuItems = await getMenuItems();

    const currentDateTime = getCurrentDateTime();
    let errors = false;

    if (hotelId.length === 0 || roomNumber.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('hotels/edit_hotel_room', {
            roomId: req.params.id,
            hotelId: hotelId,
            roomNumber: roomNumber,
            roomType: roomType,
            pricePerNight: pricePerNight,
            availability: availability,
            title: 'Edit room', menuItems
        })
    }

    // if no error
    if (!errors) {

        var form_data = {
            hotelId: hotelId,
            roomNumber: roomNumber,
            roomType: roomType,
            pricePerNight: pricePerNight,
            availability: availability
        }
        // update query
        dbConn.query('UPDATE mice_tbl_rooms SET ? WHERE roomId = ' + id, form_data, function (err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('hotels/edit_hotel_room', {
                    roomId: req.params.id,
                    hotelId: form_data.hotelId,
                    roomNumber: form_data.roomNumber,
                    roomType: form_data.roomType,
                    pricePerNight: form_data.pricePerNight,
                    availability: form_data.availability,
                    title: 'Edit room', menuItems
                })
            } else {
                req.flash('success', 'hotel room successfully updated');
                res.redirect('/hotelrooms');
            }
        })
    }
})

// delete hotel room 
router.get('/delete/(:id)', function (req, res, next) {
    let id = req.params.id;

    dbConn.beginTransaction(function (err) {
        if (err) {
            // Handle transaction error
            req.flash('error', err);
            res.redirect('/hotelrooms');
            return;
        }

        // First, delete from mice_tbl_rooms
        dbConn.query('DELETE FROM mice_tbl_rooms WHERE roomId = ?', [id], function (err, result) {
            if (err) {
                dbConn.rollback(function () {
                    // Rollback the transaction and handle the error
                    req.flash('error', err);
                    res.redirect('/hotelrooms');
                });
            } else {
                // Next, delete associated images from mice_tbl_images
                dbConn.query('DELETE FROM mice_tbl_images WHERE roomId = ?', [id], function (err, result) {
                    if (err) {
                        dbConn.rollback(function () {
                            // Rollback the transaction and handle the error
                            req.flash('error', err);
                            res.redirect('/hotelrooms');
                        });
                    } else {
                        // Commit the transaction after successful deletion
                        dbConn.commit(function (err) {
                            if (err) {
                                // Handle commit error
                                dbConn.rollback(function () {
                                    req.flash('error', err);
                                    res.redirect('/hotelrooms');
                                });
                            } else {
                                // Set flash message and redirect
                                req.flash('success', 'Hotel and associated images successfully deleted! ID = ' + id);
                                res.redirect('/hotelrooms');
                            }
                        });
                    }
                });
            }
        });
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

module.exports = router;