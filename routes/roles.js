var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/mice_db');
 
// display user page
router.get('/',async function(req, res, next) {  
    const menuItems = await getMenuItems();     
    dbConn.query('SELECT * FROM mice_tbl_roles ORDER BY roleId desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('settings/roles',{data:'',title: 'Roles',menuItems});   
        } else {
            // render to views/users/index.ejs
            res.render('settings/roles',{data:rows,formatDate,title: 'Roles',menuItems});
        }
    });
});



// display add user page
router.get('/add',async function(req, res, next) {    
    // render to add.ejs
    const menuItems = await getMenuItems(); 
    res.render('settings/add_role', {
        roleName: '',
        permissions:'',
        status:'',
        title: 'Add roles',menuItems       
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

    let roleName = req.body.roleName;
    let permissions = req.body.permissions;
    let status = req.body.status;
   
    const currentDateTime = getCurrentDateTime();
    const menuItems = await getMenuItems(); 
    
    let errors = false;

    if(roleName.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter role");
        // render to add.ejs with flash message
        res.render('settings/add_role', {
            roleName: roleName,
            permissions:permissions,
            status:status,
            title: 'Add roles',menuItems
        })
    }

    // if no error
    if(!errors) {

        var form_data = {
            roleName: roleName,
            permissions: permissions,
            status: status
        }
        
        // insert query
        dbConn.query('INSERT INTO mice_tbl_roles SET ?', form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('settings/add_role', {
                    roleName: form_data.roleName,
                    permissions: form_data.permissions,
                    status: form_data.status,
                    title: 'Add roles',menuItems                    
                })
            } else {                
                req.flash('success', 'Role successfully added');
                res.redirect('/roles');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)',async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems(); 
   
    dbConn.query('SELECT * FROM mice_tbl_roles WHERE roleId = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'Role not found with id = ' + id)
            res.redirect('/roles')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('settings/edit_role', {
                title: 'Edit role', 
                id: rows[0].roleId ,
                roleName: rows[0].roleName,
                permissions: rows[0].permissions,
                status:rows[0].status,
                title: 'Edit roles',menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id',async function(req, res, next) {

    let id = req.params.id;
    let roleName = req.body.roleName;
    let permissions = req.body.permissions;
    let status = req.body.status;
    const currentDateTime = getCurrentDateTime();
    let errors = false;
    const menuItems = await getMenuItems(); 

    if(roleName.length === 0 || permissions.length === 0 ) {
        errors = true;
        
        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('settings/edit_role', {
            roleId : req.params.id,
            roleName: roleName,
            permissions: permissions,
            status:status,
            title: 'Edit roles',menuItems
        })
    }

    // if no error
    if( !errors ) {   
 
        var form_data = {
            roleName: roleName,
            permissions: permissions,
            status:status
        }
        // update query
        dbConn.query('UPDATE mice_tbl_roles SET ? WHERE roleId  = ' + id, form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('settings/edit_role', {
                    roleId : req.params.id,
                    roleName: form_data.roleName,
                    permissions: form_data.permissions,
                    status: form_data.status,
                    title: 'Edit roles',menuItems
                })
            } else {
                req.flash('success', 'Role successfully updated');
                res.redirect('/roles');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:id)', function(req, res, next) {

    let id = req.params.id;
     
    dbConn.query('DELETE FROM mice_tbl_roles WHERE roleId = ' + id, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/roles')
        } else {
            // set flash message
            req.flash('success', 'Roles successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/roles')
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