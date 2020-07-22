const express = require('express');
const app = express();
const port = 3000;

const bcrypt = require('bcrypt'); // we are using this because we are dealing with passwords which has to be made secure
require('dotenv').config();

const methodOverride = require('method-override');
const flash = require('express-flash');
const session = require('express-session');

const passport = require('passport');
const initializePassport = require('./passport-config');
initializePassport(
	passport,
	(email) => users.find((user) => user.email === email),
	(id) => users.find((user) => user.id === id)
);

// for now we are storing the data inside this array
const users = [];

// in order to use ejs syntax we have to tell our server that we are using ejs
app.set('view-engine', 'ejs');

// when working with forms we use this
app.use(express.urlencoded({ extended: false }));

app.use(flash());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, (req, res) => {
	// setting up a route for "/"
	console.log(req.originalUrl);
	res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
	res.render('login.ejs');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
	res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
	// we can use try/catch inside async code block only
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10); // the number 10 is used for encryption level
		users.push({
			id: Date.now().toString(),
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword,
		});
		res.redirect('/login');
	} catch (e) {
		res.redirect('/register');
	}

	// console.log(users)
});

app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true,
	})
);

app.delete('/logout', (req, res) => {
	req.logOut();
	res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/');
	}
	next()
}

app.listen(port, () => {
	// listening to port number
	console.log(`>>> Listening to port number ${port}`);
});
