var express = require('express');
var router = express.Router();
var dbConn = require('../lib/mice_db');

router.get('/', async function (req, res, next) {
    try {
        //  const menuItems = await getMenuItems();
        // console.log(menuItems)   
        //res.setHeader('Content-Type', 'text/html');
        // res.send(htmlContent); // Send the HTML content as a response
        res.render('register');
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).send('Internal Server Error');
    }
});

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



router.post('/reg', function (req, res, next) {
    console.log('Start 1:');
    let username = req.body.username;
    let password = req.body.password;
    let firstName = req.body.firstName;
    let middleName = req.body.middleName;
    let lastName = req.body.lastName;
    let organization = req.body.lastName;
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;
    let address = req.body.address;
    let location = req.body.location;
    let city = req.body.city;
    let country = req.body.country;
    const currentDateTime = getCurrentDateTime();
    let errors = false;

    if (username && password) {
        console.log('Start 2:');
        var form_data_login = {
            username: username,
            password: password,
            email: email,
            role: "Client",
            lastLoginTime: currentDateTime
        }

        dbConn.beginTransaction(function (err){

            if (err) {
                req.flash('Error', err);
                res.redirect('/');
                return;
            }
        });
        dbConn.query('SELECT * FROM mice_tbl_users WHERE username = ? and email = ?', [username, email], function (err, rows, fields) {
            if (err) throw err

            // if user not found
            if (rows.length == 1) {
                req.flash('error', 'Customer Already Exist ')
                res.redirect('/register')
            } else {

                // Execute SQL query that'll select the account from the database based on the specified username and password
                dbConn.query('INSERT INTO mice_tbl_users SET ?', form_data_login, function (err, result) {
                    if (err) {
                        req.flash('error', err)

                        // render to add.ejs
                        res.render('register', {
                            username: form_data.username,
                            password: form_data.password,
                            firstName: form_data.firstName,
                            middleName: form_data.middleName,
                            lastName: form_data.lastName,
                            organization: form_data.organization,
                            email: form_data.email,
                            phoneNumber: form_data.phoneNumber,
                            address: form_data.address,
                            location: form_data.location,
                            city: form_data.city,
                            country: form_data.country,

                        })
                    } else {
                        if (!email) {
                            req.flash('error', 'Invalid email');
                            res.redirect('/login');
                        }

                        dbConn.query('SELECT * FROM mice_tbl_users WHERE email = ? AND username = ? ', [email, username], function (err, rows, fields) {
                            if (err) throw err

                            // if user not found
                            if (rows.length <= 0) {
                                req.flash('error', 'Client not found with emain = ' + email)
                                res.redirect('/login')
                            } else if (rows.length > 1) {
                                req.flash('error', 'This email ' + email + ' is alredy in use')
                                res.redirect('/login')
                            }
                            // if user found
                            else {
                                var form_data_client = {
                                    firstName: firstName,
                                    middleName: middleName,
                                    lastName: lastName,
                                    organization: organization,
                                    email: email,
                                    phoneNumber: phoneNumber,
                                    address: address,
                                    location: location,
                                    city: city,
                                    country: country,
                                    dateCreated: currentDateTime,
                                    userId: rows[0].user_id
                                }
                                // insert query
                                dbConn.query('INSERT INTO mice_tbl_customer SET ?', form_data_client, function (err, result) {
                                    //if(err) throw err
                                    if (err) {
                                        req.flash('error', err)

                                        // render to add.ejs
                                        res.render('login')
                                    } else {
                                        req.flash('success', 'Role successfully added');
                                        res.render('login')
                                    }
                                })

                            }
                        })

                    }
                });
            }
        });

    }

});


module.exports = router;