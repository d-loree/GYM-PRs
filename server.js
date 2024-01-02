var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var hbs = require('hbs');

var session = require('express-session')

// Create express middleware dispatcher
var  app = express(); 

const PORT = process.env.PORT || 3000

// View engine setup
app.set('views', path.join(__dirname, 'views'));
// Use hbs handlebars wrapper
app.set('view engine', 'hbs'); 

// register hbs partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Generate pretty view-source code in browser
app.locals.pretty = true; 

// Read routes modules
var routes = require('./routes/index');

// Register middleware with dispatcher
// Middleware
app.use(session({
	secret: 'your-secret-key',
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: 'auto',
		maxAge: 3600000 // expire cookie after 1 hour
	  },
  }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(express.urlencoded({ extended: true })) // ---

// Routes
app.get('/', routes.home);
app.get('/home', routes.home);
app.get('/createpost', routes.createPostPage);
app.get('/createuser', routes.createUserPage);
app.get('/profile', routes.profile);
app.get('/login', routes.login);
app.get('/adminpanel', routes.adminPanelPage);
app.get('/logoff', routes.logoff);-


// Handle post requests from clients
app.post("/createuser", routes.createUser)
app.post("/createpost", routes.createPost)
app.post("/deleteuser", routes.deleteUser)
app.post("/deletepost", routes.deletePost)
app.post("/login", routes.loginLogic)


//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log(`To Test as Admin:`)
		console.log('user: Admin, password: 1234')
		console.log('http://localhost:3000/home')
	}
})
