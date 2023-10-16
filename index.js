var createError = require('http-errors');
var express = require('express');
var path = require('path');
var flash = require('express-flash');
var session = require('express-session');
var mysql = require('mysql');
// const cookieparser = require("cookie-parser");
// const helmet = require("helmet");
var connection  = require('./lib/mice_db');
var employeeRouter = require('./routes/employee');
var usersRouter = require('./routes/users');
var customerRouter = require('./routes/customer');
var organizerRouter = require('./routes/organizer');
var rolesRouter = require('./routes/roles');
var hotelsRouter = require('./routes/hotels');
var hotelroomsRouter = require('./routes/hotelrooms');
var dashboardRouter = require('./routes/dashboard');
var eventsRouter = require('./routes/events');
var menuRouter = require('./routes/menu');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var indexRouter = require('./routes/home');
const { log } = require('console');

var app = express();
// allow the app to use cookieparser
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ 
    cookie: { maxAge: 60000 },
    store: new session.MemoryStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));

// app.use(helmet());
// // allow the app to use cookieparser
// app.use(cookieparser());

app.use(flash());
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/employee', employeeRouter);
app.use('/users', usersRouter);
app.use('/customer', customerRouter);
app.use('/organizer', organizerRouter);
app.use('/roles', rolesRouter);
app.use('/hotels', hotelsRouter);
app.use('/hotelrooms',hotelroomsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/events', eventsRouter);
app.use('/menu', menuRouter);
app.use('/register', registerRouter);



//app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.listen(3000);