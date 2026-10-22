require('dotenv').config();
require('./database/database').connect();
const cookieParser = require('cookie-parser');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cookieParser())


app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1>');
});

app.post('/register', async(req, res) => {
  try {
    //get all data from request body
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).send('All fields are required');
    }

    //check if user already exists
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    //encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    //save the user
    const user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword
    });
    await user.save();

    //generate a token for the user and send it as a cookie
    const token = jwt.sign(
      { userId: user._id },
      'ssh', ///process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('token', token, { httpOnly: true });

    user.token = token;
    user.password = undefined;



    // Add user creation logic here
    res.status(201).json(user);
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user._id },
      'ssh', ///process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('token', token, { httpOnly: true });

    user.token = token;
    user.password = undefined;

    res.status(200).json(user);
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});


app.get("/dashboard", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const decoded = jwt.verify(token, 'ssh'); ///process.env.JWT_SECRET);
    res.status(200).send(`Welcome to the dashboard, user ${decoded.userId}`);
  } catch (error) {
    res.status(400).send('Invalid token');
  }

  
});


module.exports = app;