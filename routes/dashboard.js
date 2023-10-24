var express = require('express');
var router = express.Router();
var dbConn = require('../lib/mice_db');


// Function to format the date

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.get('/', async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 0; // Get the page query parameter
    const pageSize = 5; // Define the number of events to display per page
    const menuItems = await getMenuItems();
    const events = await getEvents();
    const hotels = await getHotels();

    res.render('dashboard/dashboard', {
      title: 'Admin Dashboard', menuItems, events, hotels, formatDate, page: page,
      pageSize: pageSize,
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).send('Internal Server Error');
  }
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

const getEvents = () => {
  return new Promise((resolve, reject) => {
    const sql_query = 'SELECT e.eventId id, e.eventName, CONCAT_WS(" ", c.firstName, c.lastName) AS customer, e.eventdate, b.status, b.totalPrice FROM mice_tbl_events e INNER JOIN mice_tbl_customer c ON c.customerId = e.customerId INNER JOIN mice_tbl_bookings b ON b.eventId = e.eventId ORDER BY b.bookingId DESC';
    dbConn.query(sql_query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const getHotels = () => {
  return new Promise((resolve, reject) => {
    const sql_query = 'SELECT b.bookingId id,h.hotelName, CONCAT_WS("",c.firstName,c.lastName) AS customer,b.bookingDate,b.status,b.totalPrice FROM mice_tbl_customer c JOIN mice_tbl_bookings b ON b.customerId = c.customerId JOIN mice_tbl_hotel h ON h.hotelId = b.hotelId ORDER BY bookingId DESC';
    dbConn.query(sql_query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


router.get('/api/submenu/:parentId', async (req, res) => {
  const parentId = req.params.parentId;

  try {
    if (!parentId) {
      return res.status(404).send('Resource not found');
    }

    // Fetch submenu items for the specified parentId
    const submenuItemsResult = await submenuItems(parentId);

    // Send the submenu items as JSON response
    res.json(submenuItemsResult);
  } catch (error) {
    console.error('Error fetching submenu items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const submenuItems = (parent_id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM mice_tbl_menu_items WHERE parent_id = ' + parent_id;
    dbConn.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


router.get('/action/(:id)', async function (req, res, next) {

  const menuItems = await getMenuItems();
  let id = req.params.id;
  console.log(id);
  const sqlQuery = 'SELECT * FROM mice_tbl_events e INNER JOIN mice_tbl_customer c ON c.customerId=e.customerId INNER JOIN mice_tbl_bookings b ON b.eventId= e.eventId WHWERE e.eventId = ?';
  dbConn.query(sqlQuery, [id], function (err, rows) {
    if (err) {
      req.flash('Error', err);
      res.redirect('/events');
    } else {
      res.render('events/event_action',
        {
          title: 'Event Actions', firstName: rows[0].firstName, middleName: rows[0].middleName, lastName: lastName[0].lastName, organization: organization,
          email: rows[0].email, phoneNumber: rows[0].phoneNumber, address: rows[0].address, location: rows[0].location, city: rows[0].city, country: rows[0].country,
          eventName: rows[0].eventName, eventDate: rows[0].eventDate, eventStartTime: rows[0].eventStartTime, eventEndTime: rows.eventEndTime,
          location: rows[0].location, eventType: rows[0].eventType, bookingDate: rows[0].bookingDate, checkinDate: rows[0].checkinDate, checkoutDate: rows[0].checkoutDate,
          status: rows[0].status, totalPrice: rows[0].totalPrice, menuItems
        });
    }
  });

});



module.exports = router;
