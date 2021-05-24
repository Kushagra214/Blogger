var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');

// creating a sequelize instance with our local MySQL database information.
var sequelize = new Sequelize('dd','root','12345',{
    host: 'localhost',
    dialect: 'mysql'
});

//connection test
try{
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
}catch(error){
    console.error('Unable to connect to the database:', error);
}

// setup User model and its fields.
var User = sequelize.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    blogTitle: {
        type: Sequelize.STRING
    },
    blogDesc: {
        type: Sequelize.STRING
    },
    fileType: {
        type: Sequelize.STRING
    },
    fileName:{
        type: Sequelize.STRING
    },
    fileData:{
        type: Sequelize.BLOB('long')
    }
}, {
    hooks: {
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    },   
});

User.prototype.validpassword = (password,orgpass)=> {
    return bcrypt.compareSync(password,orgpass);
}

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

module.exports = User;