const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
var cors = require("cors");
const { connection } = require("./config/db");
const app = express();
const port = 8080;
app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
    res.send("home");
  });
  

// Create a schema for user credentials
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name:String
});

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the directory to store uploaded videos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Set the filename to be unique
  },
});

const upload = multer({ storage: storage });

// Middleware to check admin credentials
const adminAuth = (req, res, next) => {
  const { email, password } = req.body;

  if (email === 'admin@gmail.com' && password === 'admin123') {
    req.isAdmin = true; // Set isAdmin property in the request object
  } else {
    req.isAdmin = false; // Set isAdmin property in the request object
  }

  next(); // Proceed to the next middleware
};

// User sign-up endpoint
app.post('/signup', async (req, res) => {
    try {
      // Check if required properties exist in req.body
      if (!req.body.email || !req.body.password || !req.body.name) {
        throw new Error('Missing required properties in request body.');
      }
  
      // Extract properties from req.body
      const { email, password, name } = req.body;
  
      // Create a new user
      const user = await User.create({ email, password, name });
  
      // Save the user to the database
      await user.save();
  
      console.log('User sign-up:', email, password, name);
      res.send('User sign-up successful.');
    } catch (error) {
      console.error('Error signing up user:', error);
      res.status(500).send('Error signing up user.');
    }
  });


app.post('/signin', async(req, res, next) => {
    const { email, password } = req.body;
    try {
        // Implement user sign-in logic here
        // Check if the user exists in the database
        const user = await User.findOne({ email });
    
        // if (!user) {
        //   throw new Error('User not found.');
        // }

       let isPasswordValid ;
       let newpass=user.password || "";
       if( newpass == password) {
            isPasswordValid = true;
       }else{
        isPasswordValid = false;
       }

        // Compare the provided password with the stored password
        // const isPasswordValid = await user.comparePassword(password);
    
        if (!isPasswordValid) {
          throw new Error('Incorrect password.');
        }
    
        console.log('User sign-in:', email);
  
     
  
     res.send("User login successful")
      //  res.send({massage:"User login successful",isAdmin:isAdmin});
    } catch (error) {
      console.error('Error signing in user:', error);
      res.status(500).send('Error signing in user.');
    }
  });
  

// Upload video endpoint (restricted to admin)
app.post('/upload', adminAuth, upload.single('video'), (req, res) => {
  if (req.isAdmin) {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No video file uploaded.');
    }

    // Store the video details in your MongoDB collection
    const Video = mongoose.model('Video', { filename: String, path: String });

    const video = new Video({
      filename: file.originalname,
      path: file.path
    });

    video.save()
      .then(() => {
        res.send('Video uploaded successfully in the admin panel.');
      })
      .catch((error) => {
        console.error('Error uploading video:', error);
        res.status(500).send('Error uploading video.');
      });
  } else {
    return res.status(401).send('Unauthorized access.'); // Unauthorized access error
  }
});

app.listen(port, async () => {
  try {
    await connection;
    console.log("Connected to db");
  } catch (error) {
    console.log(error);
  }

  console.log("listening to the port " + port);
});