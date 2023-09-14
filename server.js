const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const User = require('./models/Signup');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const expressSession = require('express-session');
require('dotenv').config();



mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);
const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Database Connected');
});

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'Gmail'
    auth: {
      user: 'gewersdeon61@gmail.com',
      pass: 'dqpkeoompwquevaq',
    },
  });

  app.use(
    expressSession({
      secret: secretKey, // Replace with your actual secret key
      resave: false,
      saveUninitialized: false,
    })
  );

  app.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
  
    if (!name || !email || !subject || !message) {
      return res.status(400).send('Incomplete data provided.');
    }
  
    const mailOptions = {
      from: email, // Set the "from" address to the sender's email
      to: 'gewersdeon61@gmail.com', // Replace with your email address
      subject: subject,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
       
        Message: ${message}
      `,
    };
  
    try {
       await transporter.sendMail(mailOptions);
    //   res.status(200).json({ message: 'Message sent successfully.' });
    res.redirect('/');
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error sending message.');
    }
  });
  app.get('/', (req, res) => {
    res.render('index', { isLoggedIn: req.session.isLoggedIn });
  });
  
  app.get('/signup', (req, res) => {
    res.render('signup', { emailInUseError: req.session.emailInUseError });
});

  // Create a new user (Sign Up)
  app.post('/api/signup', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Check if the email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Email is already in use, send an error response
            return res.status(400).render('signup', {
                emailInUseError: 'This email is already in use. Please use a different email.',
            });
        }

        // Email is not in use, proceed with creating the user
        const newUser = new User({ fullname, email, password });
        await newUser.save();

        // Redirect to the login page or any other appropriate route
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


  // Handle user signout
app.get('/signout', (req, res) => {
    // Destroy the user's session to log them out
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      // Redirect to the homepage or any other appropriate route after signout
      res.redirect('/');
    });
  });
  

  // Render the login form
app.get('/login', (req, res) => {
        // Check if there's a login error in the session
        const loginError = req.session.loginError;
        // Clear the login error from the session
        delete req.session.loginError;
    
        // Render the login page with the loginError variable
        res.render('login', { loginError });
  });
  
  // Handle login form submission
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            req.session.loginError = 'User not found. Please check your credentials.';
            res.redirect('/login');
            return; // Added return to prevent further execution
        }

        // Compare the provided password with the stored hashed password
        if (user.password === password) {
            // Successfully logged in
            // You might create a session or a JWT token here for authentication
            req.session.isLoggedIn = true;
            res.redirect('/');
        } else {
            req.session.loginError = 'Incorrect password. Please try again.';
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});