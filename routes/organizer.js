var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/mice_db');
 
// display user page
router.get('/',async function(req, res, next) {
    const menuItems = await getMenuItems();       
    dbConn.query('SELECT * FROM mice_tbl_organizers ORDER BY organizerId desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('organizers/organizers',{data:'', title: 'Organizers',menuItems});   
        } else {
            // render to views/users/index.ejs
            res.render('organizers/organizers',{data:rows,formatDate, title: 'Organizers',menuItems});
        }
    });
});



// display add user page
router.get('/add',async function(req, res, next) {   
    const menuItems = await getMenuItems();  
    // render to add.ejs
    res.render('organizers/add_organizer', {
        staffId: '',
        description:'',
        title: 'Add Organizer',menuItems
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
router.post('/add',async function(req, res, next) {    

    let staffId = req.body.staffId;
    let description = req.body.description;
    const menuItems = await getMenuItems(); 
   
    const currentDateTime = getCurrentDateTime();
    
    let errors = false;

    if(staffId.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter organizer");
        // render to add.ejs with flash message
        res.render('organizers/add_organizer', {
            staffId: staffId,
            description:description,
            title: 'Add organizer',menuItems
        })
    }

    // if no error
    if(!errors) {

        var form_data = {
            staffId: staffId,
            description: description,
            createdDate: currentDateTime
        }
        
        // insert query
        dbConn.query('INSERT INTO mice_tbl_organizers SET ?', form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('organizers/add_organizer', {
                    staffId: form_data.staffId,
                    description: form_data.description,
                    title: 'Add organizer',menuItems                    
                })
            } else {                
                req.flash('success', 'Organizer successfully added');
                res.redirect('/organizer');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)',async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems(); 
   
    dbConn.query('SELECT * FROM mice_tbl_organizers WHERE organizerId   = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'Organizer not found with id = ' + id)
            res.redirect('/organizer')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('organizers/edit_organizer', {
                title: 'Edit organizer', 
                id: rows[0].organizerId,
                staffId: rows[0].staffId,
                description: rows[0].description,
                title: 'Edit Organizer',menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id',async function(req, res, next) {

    let id = req.params.id;
    let staffId = req.body.staffId;
    let description = req.body.description;
    const currentDateTime = getCurrentDateTime();
    const menuItems = await getMenuItems(); 
    let errors = false;

    if(staffId.length === 0 || description.length === 0 ) {
        errors = true;
        
        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('organizers/edit_organizer', {
            organizerId: req.params.id,
            staffId: staffId,
            description: description,
            title: 'Edit Organizer',menuItems
        })
    }

    // if no error
    if( !errors ) {   
 
        var form_data = {
            staffId: staffId,
            description: description,
            updatedDate:currentDateTime
        }
        // update query
        dbConn.query('UPDATE mice_tbl_organizers SET ? WHERE organizerId  = ' + id, form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('organizers/edit_organizer', {
                    organizerId : req.params.id,
                    staffId: form_data.staffId,
                    description: form_data.description,
                    title: 'Edit Organizer',menuItems
                })
            } else {
                req.flash('success', 'Organizer successfully updated');
                res.redirect('/organizer');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:id)',async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems(); 
     
    dbConn.query('DELETE FROM mice_tbl_organizers WHERE organizerId = ' + id, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/organizer')
        } else {
            // set flash message
            req.flash('success', 'Organizer successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/organizer')
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