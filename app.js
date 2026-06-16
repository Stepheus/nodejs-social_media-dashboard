const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'Di_secret_key';

mongoose.set('strictQuery', false);

const uri =  "mongodb://root:<replace password>@localhost:27017";
mongoose.connect(uri,{'dbName':'SocialDB'});

const User = mongoose.model('User', { username: String, email: String, password: String });
const Post = mongoose.model('Post', { userId: mongoose.Schema.Types.ObjectId, text: String });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: SECRET_KEY, resave: false, saveUninitialized: true, cookie: { secure: false } }));


function authenticateJWT(req, res, next ){
    const token = req.session.token;
    //No token saved in session, no verification
    if(!token) return res.status(401).json({message: "Unauthorized"});

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch(error){
        // Invalid token
        return res.status(401).json({message: "Invalid token"});
    }
}


function requireAuth(req, res, next){
    const token = req.session.token;
    if(!token) return res.redirect("/login");
    
    try{
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch(error) {
        return res.redirect("/login"); 
    }
}

//Homepage 
app.get("/", (req, res)=> res.sendFile(path.join(__dirname, "public", "index.html")));

// User registration page
app.get("/register", (req, res)=> res.sendFile(path.join(__dirname, "public", "register.html")));

// User login page 
app.get("/login", (req, res)=> res.sendFile(path.join(__dirname, "public", "login.html")));

//Post page
app.get("/post", requireAuth, (req, res)=> res.sendFile(path.join(__dirname, "public", "post.html")));

//Index
app.get("/index", requireAuth, (req, res)=> res.sendFile(path.join(__dirname, "public", "index.html"), {username: req.user.username}));


// Post Register
app.post("/register", async (req,res)=>{
    const {username, email, password} = req.body;

    //check if user exist 
    try {
        const existingUser = await User.findOne({$or: [{username}, {email}]});

        if (existingUser) return res.status(400).json({message: "User already exists"});
        
        //create and save new User
        const newUser = new User({username, email, password });
        await newUser.save();
        
        const token = jwt.sign({userId: newUser._id, username: newUser.username}, SECRET_KEY, {expireIn: "1h"});
        req.session.token = token;

        res.send({"message": `The user ${username} has been added`});

    } catch(error){
        res.status(500).json({message:"Internal Server Error"});
    }
});

// Post login
app.post("/login", async (req, res)=>{
    const {username, password} = req.body;

    try {
        const user = await User.findOne({username, password});

        //no user found in database 
        if (!user) return res.status(401).json({message: "Invalid credentials "});

        const token = jwt.sign({userId: user._id, usermame: user.username}, SECRET_KEY, {expireIn: "1hr"});
        req.session.token = token;

        res.send({"message": `${Username} has been logged in`})
    } catch (error){
        console.error(error);
        res.status(5000).json({message: 'Internal Server Error' });

    }

});


// Post deletion =

// Insert your user logout code here.

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

