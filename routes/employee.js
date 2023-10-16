var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/mice_db');
 
// display user page
router.get('/', async function(req, res, next) {  
    const menuItems = await getMenuItems();    
    dbConn.query('SELECT * FROM mice_tbl_staffs ORDER BY staffId desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('employees/employees',{data:'', title: 'Employees',menuItems});   
        } else {
            // render to views/users/index.ejs
            res.render('employees/employees',{data:rows,formatDate, title: 'Employees',menuItems});
        }
    });
});



// display add user page
router.get('/add', async function(req, res, next) {  
    const menuItems = await getMenuItems();  
    // render to add.ejs
    res.render('employees/add_employee', {
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        staffNo: '',
        phoneNumber: '',
        role:'',
        title: 'Add employee',menuItems
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

    let firstName = req.body.firstName;
    let middleName = req.body.middleName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let staffNo = req.body.staffNo;
    let phoneNumber = req.body.phoneNumber;
    let role = req.body.role;
    const currentDateTime = getCurrentDateTime();
    const menuItems = await getMenuItems();  
    let errors = false;

    if(firstName.length === 0 || middleName.length === 0|| lastName.length === 0 || staffNo.length === 0 || phoneNumber.length === 0 || role.length === 0 ) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter name and email and position");
        // render to add.ejs with flash message
        res.render('employees/add_employee', {
            firstName: firstName,
            middleName: middleName,
            lastName:lastName,
            email: email,
            staffNo: staffNo,
            phoneNumber:phoneNumber,
            role:role,
            title: 'Add employee',menuItems
        })
    }

    // if no error
    if(!errors) {

        var form_data = {
            firstName: firstName,
            middleName: middleName,
            lastName:lastName,
            email: email,
            staffNo: staffNo,
            phoneNumber:phoneNumber,
            roleId:role,
            dateEnrolled:currentDateTime
        }
        
        // insert query
        dbConn.query('INSERT INTO mice_tbl_staffs SET ?', form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('employees/add_employee', {
                    firstName: form_data.firstName,
                    middleName: form_data.middleName,
                    lastName:form_data.lastName,
                    email: form_data.email,
                    staffNo: form_data.staffNo,
                    phoneNumber:form_data.phoneNumber,
                    roleId:form_data.role,
                    title: 'Add employee',menuItems
                })
            } else {                
                req.flash('success', 'Employee successfully added');
                res.redirect('/employee');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)', async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems();  
    dbConn.query('SELECT * FROM mice_tbl_staffs WHERE staffId = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'staff not found with id = ' + id)
            res.redirect('/employee')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('employees/edit_employee', {
                title: 'Edit Employee', 
                id: rows[0].staffId ,
                firstName: rows[0].firstName,
                middleName: rows[0].middleName,
                lastName: rows[0].lastName,
                email: rows[0].email,
                staffNo: rows[0].staffNo,
                phoneNumber: rows[0].phoneNumber,
                role: rows[0].roleId,
                title: 'Edit employee',menuItems
            })
            res.end();
        }
    })
})

// update user data
router.post('/update/:id',async function(req, res, next) {

    let id = req.params.id;
    let firstName = req.body.firstName;
    let middleName = req.body.middleName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let staffNo = req.body.staffNo;
    let phoneNumber = req.body.phoneNumber;
    let role = req.body.role;
    const currentDateTime = getCurrentDateTime();
    let errors = false;
    const menuItems = await getMenuItems();  

    if(firstName.length === 0 || middleName.length === 0 || email.length === 0) {
        errors = true;
        
        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('employees/edit_employee', {
            staffId: req.params.id,
            firstName: firstName,
            middleName: middleName,
            lastName:lastName,
            email: email,
            staffNo: staffNo,
            phoneNumber:phoneNumber,
            role:role,
            title: 'Edit employee',menuItems
        })
    }

    // if no error
    if( !errors ) {   
 
        var form_data = {
            firstName: firstName,
            middleName: middleName,
            lastName:lastName,
            email: email,
            staffNo: staffNo,
            phoneNumber:phoneNumber,
            roleId:role,
            lastUpdate:currentDateTime
        }
        // update query
        dbConn.query('UPDATE mice_tbl_staffs SET ? WHERE staffId = ' + id, form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('employees/edit_employee', {
                    staffId : req.params.id,
                    firstName: form_data.firstName,
                    middleName: form_data.middleName,
                    lastName: form_data.lastName,
                    email: form_data.email,
                    staffNo: form_data.staffNo,
                    phoneNumber: form_data.phoneNumber,
                    roleId:form_data.role,
                    title: 'Edit employee',menuItems
                })
            } else {
                req.flash('success', 'Employee successfully updated');
                res.redirect('/employee');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:id)', function(req, res, next) {

    let id = req.params.id;
     
    dbConn.query('DELETE FROM mice_tbl_staffs WHERE staffId = ' + id, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/employee')
        } else {
            // set flash message
            req.flash('success', 'Employee successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/employee')
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