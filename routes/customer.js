var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/mice_db');
 
// display user page
router.get('/', async function(req, res, next) {      
    const menuItems = await getMenuItems();
    dbConn.query('SELECT * FROM mice_tbl_customer ORDER BY customerId  desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('customers/customers',{data:'', title: 'Customers',menuItems});   
        } else {
            // render to views/users/index.ejs
            res.render('customers/customers',{data:rows,formatDate,title: 'Customers',menuItems});
        }
    });
});



// display add user page
router.get('/add', async function(req, res, next) {    
    const menuItems = await getMenuItems();
    res.render('customers/add_customer', {
        userId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        organization: '',
        email: '',
        phoneNumber:'',
        address:'',
        location:'',
        city: '',
        country:'',
        title: 'Customers',menuItems
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


// add a new user
router.post('/add', async function(req, res, next) {    

    let userId = req.body.userId;
    let firstName = req.body.firstName;
    let middleName = req.body.middleName;
    let lastName = req.body.lastName;
    let organization = req.body.organization;
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;
    let address = req.body.address;
    let location = req.body.location;
    let city = req.body.city;
    let country = req.body.country;
    const menuItems = await getMenuItems();
    const currentDateTime = getCurrentDateTime();
    
    let errors = false;

    if(firstName.length === 0 || middleName.length === 0|| lastName.length === 0 || address.length === 0 || phoneNumber.length === 0 || country.length === 0 ) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter name and email and address");
        // render to add.ejs with flash message
        res.render('customers/add_customer', {
            userId: userId,
            firstName: firstName,
            middleName:middleName,
            lastName: lastName,
            organization: organization,
            email:email,
            phoneNumber:phoneNumber,
            address:address,
            location:location,
            city:city,
            country:country,
            title: 'Add customer',menuItems
        })
    }

    // if no error
    if(!errors) {

        var form_data = {
            userId: userId,
            firstName: firstName,
            middleName:middleName,
            lastName: lastName,
            organization: organization,
            email:email,
            phoneNumber:phoneNumber,
            address:address,
            location:location,
            city:city,
            country:country,
            dateCreated:currentDateTime
        }
        
        // insert query
        dbConn.query('INSERT INTO mice_tbl_customer SET ?', form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('customers/add_customer', {
                    userId: form_data.userId,
                    firstName: form_data.firstName,
                    middleName: form_data.middleName,
                    lastName:form_data.lastName,
                    organization: form_data.organization,
                    email: form_data.email,
                    phoneNumber:form_data.phoneNumber,
                    address:form_data.address,
                    location:form_data.location,
                    city:form_data.city,
                    country:form_data.country,
                    title: 'Add customer',menuItems
                })
            } else {                
                req.flash('success', 'Customer successfully added');
                res.redirect('/customer');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)', async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems();
   
    dbConn.query('SELECT * FROM mice_tbl_customer WHERE customerId = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'Customer not found with id = ' + id)
            res.redirect('/customer')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('customers/edit_customer', {
                title: 'Edit Customer', 
                id: rows[0].customerId,
                userId: rows[0].userId,
                firstName: rows[0].firstName,
                middleName: rows[0].middleName,
                lastName: rows[0].lastName,
                organization: rows[0].organization,
                email: rows[0].email,
                phoneNumber: rows[0].phoneNumber,
                address: rows[0].address,
                location: rows[0].location,
                city: rows[0].city,
                country: rows[0].country,
                title: 'Add customer',menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id', async function(req, res, next) {

    let id = req.params.id;
    let userId = req.params.userId;
    let firstName = req.body.firstName;
    let middleName = req.body.middleName;
    let lastName = req.body.lastName;
    let organization = req.body.organization;
    let email = req.body.email;
    let staffNo = req.body.staffNo;
    let phoneNumber = req.body.phoneNumber;
    let address = req.body.address;
    let location = req.body.location;
    let city = req.body.city;
    let country = req.body.country;
    const currentDateTime = getCurrentDateTime();
    let errors = false;
    const menuItems = await getMenuItems();

    if(firstName.length === 0 || middleName.length === 0 || email.length === 0) {
        errors = true;
        
        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('customers/edit_customer', {
            staffId: req.params.id,
            userId: req.params.userId,
            firstName: req.params.firstName,
            middleName: req.params.middleName,
            lastName:req.params.lastName,
            organization: req.params.organization,
            email: req.params.email,
            phoneNumber:req.params.phoneNumber,
            address:req.params.address,
            location:req.params.location,
            city:req.params.city,
            country:req.params.country,
            title: 'Edit customer',menuItems
        })
    }

    // if no error
    if( !errors ) {   
 
        var form_data = {
            userId: userId,
            firstName: firstName,
            middleName:middleName,
            lastName: lastName,
            organization: organization,
            email:email,
            phoneNumber:phoneNumber,
            address:address,
            location:location,
            city:city,
            country:country,
            dateUpdated:currentDateTime
           
        }
        // update query
        dbConn.query('UPDATE mice_tbl_customer SET ? WHERE customerId = ' + id, form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('customers/edit_customer', {
                    customerId : req.params.id,
                    userId: form_data.userId,
                    firstName: form_data.firstName,
                    middleName: form_data.middleName,
                    lastName:form_data.lastName,
                    organization: form_data.organization,
                    email: form_data.email,
                    phoneNumber:form_data.phoneNumber,
                    address:form_data.address,
                    location:form_data.location,
                    city:form_data.city,
                    country:form_data.country,
                    title: 'Edit customer',menuItems
                })
            } else {
                req.flash('success', 'Customer successfully updated');
                res.redirect('/customer');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:id)', function(req, res, next) {

    let id = req.params.id;
     
    dbConn.query('DELETE FROM mice_tbl_customer WHERE customerId = ' + id, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/customer')
        } else {
            // set flash message
            req.flash('success', 'Customer successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/customer')
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


module.exports = router;