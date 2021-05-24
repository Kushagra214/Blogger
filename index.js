//packages require
var express = require('express');
var ejs = require('ejs');
var session = require('express-session');
var morgan = require('morgan');
var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var User = require('./model/user');

//Joi validation
const Joi = require('joi');
const querySchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().alphanum().min(3).max(30).required(),
})

//Using Multer
var multer = require('multer');
const { Sequelize } = require('sequelize');
const { Console } = require('console');
const { func } = require('joi');
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, '/Users/kushagraagarwal/Desktop/Projects/dd/blog/public/img');
    },
    filename: function (req, file, callback) {
      callback(null, file.originalname);
    }
});
var upload = multer({ storage: storage });

var app = express();

//to enable view of .ejs file
app.set('view engine','ejs');
app.use(express.json());
// set morgan to log info about our requests for development use.
app.use(morgan('dev'));
//to allow access of public folder contents
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60000000
    }
}));


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};

// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req,res)=>{
    async function getBlogs(){
        let blogs = await User.findAll({attributes: ['blogTitle','blogDesc','fileName']});
        res.render('home',{obj: blogs});
        console.log(blogs);
        }
    getBlogs();
});

// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.render('signUp');  
    })
    .post((req, res) => {
        const { error, value } = querySchema.validate(req.body);
        if (error) {
            res.send(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
        } else {
            req.body = value;
            User.create({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                blogTitle: null,
                blogDesc:null,
                fileType: null,
                fileName: null,
                fileData: null
            })
            .then(user => {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            })
            .catch(error => {
                res.redirect('/signup');
            });
        }
    });

// route for user Login
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;
            User.findOne({ where: { username: username } }).then(function (user) {
                if (!user) {
                    res.send('No user found!');
                    res.redirect('/login');
                }
                else if (!user.validpassword(password,user.password)){
                    res.send('Invalid Password');
                    res.redirect('/login');
                } else {
                    req.session.user = user.dataValues;
                    res.redirect('/dashboard');
                }
            }).catch(err=>console.log(err))
    });

// route for user's dashboard
app.route('/dashboard')
    .get((req,res)=>{
        if (req.session.user && req.cookies.user_sid) {
            var user_name= req.session.user.username;
            console.log(user_name);
            User.findOne({
                attributes: ['blogTitle','blogDesc','fileName'],
                where: {username: user_name}})
            .then(function(blogs){
                console.log('Object data'+blogs.blogTitle)
                res.render('dashboard',{obj:blogs})})
            }
        else{
            res.redirect('/login');
        }
    })
    .post(upload.single('file'),(req, res) => {
        var title = req.body.blogTitle;
        var desc = req.body.blogDesc;
        var type= req.file.mimetype;
        if (type!==('image/jpeg'||'image/png'||'image/jpg')){
            res.send(`Please upload correct image file`);
        }else {
		var name= req.file.originalname;
        var data= fs.readFileSync(__dirname + '/public/img/' + req.file.filename);
		//var data= req.file.buffer;
        console.log(title+desc+type+name+data);
        var values={blogTitle: title, blogDesc: desc, fileType: type, fileName: name, fileData: data};
        var condition = {where:{ username: req.session.user.username}};
        options = {multi: true};
        User.update(values, condition, options)
        .then(user =>{
            req.session.user = user.dataValues;
            res.redirect('/home');
        })
        .catch(err =>
            console.log(err)
        )
        }
    });

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

//to listen to localhost 8000
app.listen(8000, function(){
    console.log("Connection started at port 3000");
});
