var url = require('url');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/db_gymPRs');


// login page
exports.login = function (request, response, next) {
	// if already logged in, go to home
	if (request.session.authorized)
	{ return response.redirect('/home') }
	
	// render login page
	response.render('login', {})
}

// logoff 
exports.logoff = function (request, response, next) {
	request.session.destroy(function(err) {
        if(err) 
		{
			// Handle error - maybe render error message??
            console.log(err);
        } 
		else 
		{
            response.redirect('/login');
        }
    });
}

 // login logic to validate and set session boolean to see if loggedin
exports.loginLogic = function (request, response, next){
	// check if username and password exist
	var username = request.body.username
	var password = request.body.password
	var authorized = false;

	db.all("SELECT userid, password, role FROM users", function(err, rows) {
		for(var i=0; i<rows.length; i++)
		{
			if (rows[i].userid == username & rows[i].password == password)
			{
				authorized = true
				request.session.username = username
				request.session.authorized = true
				request.session.isAdmin = rows[i].role == 'admin'
				break;
			}
		}

        if (authorized)
        {
			// Redirect to home as the user is authorized. let user know log in was successful
            response.redirect('/home'); 
        }
		else 
		{
			response.render('login', { error: "Login invalid" })
		}

	});
}

// page to create new users
exports.createUserPage = function (request, response, next) {
	// render page for creating user
	response.render('createUser', {})
}

// handle create user logic
exports.createUser = function (request, response) {
    var username = request.body.userid;
    var password = request.body.password;
	// console.log("RECEIVED: " + username + "  " + password);

    if (username == "" || password == "") {
        // input is invalid
        response.render('createUser', { error: "Invalid input. Username and password are required." });
        return;
    }

    // Check if the username already exists in the database
    db.all("SELECT userid FROM users", function(err, rows) {
        if (err) 
		{
            // Handle errors
            console.error(err);
            response.render('createUser', { error: "A server side error occurred." });
            return;
        }

        var usernameExists = rows.some(row => row.userid === username);

        if (usernameExists) 
		{
            // Username already exists
            response.render('createUser', { error: "Username already exists." });
        } 
		else 
		{
            // no issues, so create account
            response.render('createUser', { success: "Account Created!" });

            // add account to database

			db.serialize(function() {
				var insertData = "insert into users values ('" + username + "', '" + password + "', 'guest')"
				db.run(insertData);
			})
        }
    });
};



// home page 
exports.home = function (request, response){
	if (!request.session.authorized) 
	{ return response.redirect('/login') }

	var sql = "select * from posts";

	db.all(sql, function(err, rows){
		response.render('home', { posts: rows.reverse(), isAdmin: request.session.isAdmin })
	})
}
 
// create posts page
exports.createPostPage = function(request, response){
	if (!request.session.authorized) 
	{ return response.redirect('/login') }

	response.render('createPost', { isAdmin: request.session.isAdmin });
}

// create post logic
exports.createPost = function(request, response){

    var bodyweight = request.body.bodyweight;
    var squat = request.body.squat;
	var bench = request.body.bench;
	var deadlift = request.body.deadlift;
	// console.log("RECIEVED: " + bodyweight + " " + squat + " " + bench + " " + deadlift)

    if (bodyweight == "" || squat == "" || bench  == "" || deadlift == "") {
        // input is invalid
        response.render('createPost', { error: "Invalid input. All fields required." });
        return;
    }

	response.render('createPost', { success: "PR's Posted!" });

	db.serialize(function() {
		var total = parseFloat(bench) + parseFloat(squat) + parseFloat(deadlift);
		var insertData = "INSERT INTO posts (userid, bodyweight, bench, squat, deadlift, total) VALUES ('" + request.session.username + "', '" + bodyweight + "', '" + bench + "', '" + squat + "', '" + deadlift + "', '" + total +"')";
		db.run(insertData);
	})
}

// view your own posts
exports.profile = function(request, response){
	if (!request.session.authorized) 
	{ return response.redirect('/login') }

	// var isAuthorized = false;

	var sql = "select * from posts where userid = ?";

	db.all(sql, [request.session.username], function(err, rows){
		response.render('profile', { posts: rows.reverse(), isAdmin: request.session.isAdmin})
	})
}


// handle delete user logic
exports.deleteUser = function (request, response) {
    var username = request.body.userid;
	var role = request.body.role;

	db.serialize(function() {
		db.run("DELETE FROM users WHERE userid = '"+ username + "'", function(err) {
			if (err) {
				console.error(err);
				response.render('users', { error: "An error occurred while deleting the user." });
			} else {
				// user deleted successfully

				db.run("delete from posts where userid = '"+ username + "'")
				exports.adminPanelPage(request, response);
			}
		});
	});
}


// handle delete post logic
exports.deletePost = function (request, response) {
	var postid = request.body.postid;
	db.serialize(function() {
		db.run("DELETE FROM posts WHERE postid = '"+ postid + "'", function(err) {
			if (err) {
				console.error(err);
				response.render('profile', { error: "An error occurred while deleting the post." });
			}
			else
			{
				exports.profile(request, response); // redirect??????????????????????
			}
		});
	});
}

exports.adminPanelPage = function (request, response) {
	if (!request.session.authorized) 
	{ return response.redirect('/login') }
	if (!request.session.isAdmin)
	{ return response.redirect('/home') }

	// Display all users and passwords (requires admin)
	db.all("SELECT userid, password, role FROM users where role = 'guest'", function(err, rows) {
		// Sort by userid in alphabetical order
		rows.sort((a, b) => {
			if (a.userid < b.userid) { return -1; }
			if (a.userid > b.userid) { return 1; }
			return 0; });
		response.render('users', { userEntries: rows, isAdmin: request.session.isAdmin });
	})
}