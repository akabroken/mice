var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/mice_db');
 
// display user page
router.get('/',async function(req, res, next) {     
    
    const menuItems = await getMenuItems(); 
    dbConn.query('SELECT * FROM mice_tbl_menu_items ORDER BY id desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/users/index.ejs
            res.render('settings/menuItems',{data:'',title: 'Menu items',menuItems});   
        } else {
            // render to views/users/index.ejs
            res.render('settings/menuItems',{data:rows,title: 'Menu items',menuItems});
        }
    });
});



// display add user page
router.get('/add',async function(req, res, next) {   
    const menuItems = await getMenuItems();  
    // render to add.ejs
    dbConn.query('SELECT * FROM mice_tbl_menu_items', function (err, rows) {
        if (err) {
            req.flash('error', err);
            renderAddPage(res, '',  '','');
        } else{
            renderAddPage(res, '', '',rows);
        }
    })
    
})

// Function to render add.ejs page with flash message and data
async function renderAddPage(res, label, link,  data) {
    const menuItems = await getMenuItems(); 
    res.render('settings/add_menuItem', {
        label: label,
        link: link,
        data: data,
        title: 'Add menu',menuItems
    });
}



// add a new user
router.post('/add',async function(req, res, next) {    
    const menuItems = await getMenuItems(); 
    let label = req.body.label;
    let link = req.body.link;
    const  parent_id = req.body.parent_id;    
    let errors = false;

    if(parent_id ===null){
        parent_id =0;
    }


    if(label.length === 0) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter menu label");
        // render to add.ejs with flash message
        res.render('settings/add_menuItem', {
            label: label,
            link:link,
            parent_id:parent_id,
            title: 'Add menu',menuItems
        })
    }

    // if no error
    if(!errors) {
  
        var form_data = {
            label: label,
            link:link,
            parent_id:parent_id
        }
        
        // insert query
        dbConn.query('INSERT INTO mice_tbl_menu_items SET ?', form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                req.flash('error', err)
  
                // render to add.ejs
                res.render('settings/add_menuItem', {
                    label: form_data.label,
                    link: form_data.link,
                    parent_id: form_data.parent_id ,
                    title: 'Add menu',menuItems             
                })
            } else {                
                req.flash('success', 'Menu item successfully added');
                res.redirect('/menu');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:id)',async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems(); 
    dbConn.query('SELECT * FROM mice_tbl_menu_items WHERE id = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'Menu item not found with id = ' + id)
            res.redirect('/menu')
        }
        // if user found
        else {

            // render to edit.ejs
            res.render('settings/edit_menuItem', {
                title: 'Edit menu item', 
                id: rows[0].id ,
                label: rows[0].label,
                link: rows[0].link,
                parent_id:rows[0].parent_id,
                title: 'Edit menu',menuItems
            })
        }
    })
})

// update user data
router.post('/update/:id',async function(req, res, next) {

    const menuItems = await getMenuItems(); 
    let id = req.params.id;
    let label = req.body.label;
    let link = req.body.link;
    let parent_id = req.body.parent_id;
    let errors = false;

    if(label.length === 0 || link.length === 0 ) {
        errors = true;
        
        // set flash message
        req.flash('error', "Please respective data");
        // render to add.ejs with flash message
        res.render('settings/edit_menuItem', {
            id : req.params.id,
            label: label,
            link:link,
            parent_id:parent_id,
            title: 'Edit menu',menuItems
        })
    }

    // if no error
    if( !errors ) {   
        var form_data = {
            label: label,
            link:link,
            parent_id:parent_id
        }
        // update query
        dbConn.query('UPDATE mice_tbl_menu_items SET ? WHERE id  = ' + id, form_data, function(err, result) {
            //if(err) throw err
            if (err) {
                // set flash message
                req.flash('error', err)
                // render to edit.ejs
                res.render('settings/edit_menuItem', {
                    id : req.params.id,
                    label: form_data.label,
                    link: form_data.link,
                    parent_id: form_data.parent_id,
                    title: 'Edit menu',menuItems
                })
            } else {
                req.flash('success', 'Menu item successfully updated');
                res.redirect('/menu');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:id)',async function(req, res, next) {

    let id = req.params.id;
    const menuItems = await getMenuItems(); 
     
    dbConn.query('DELETE FROM mice_tbl_menu_items WHERE id = ' + id, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/menu')
        } else {
            // set flash message
            req.flash('success', 'Menu item successfully deleted! ID = ' + id)
            // redirect to user page
            res.redirect('/menu')
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