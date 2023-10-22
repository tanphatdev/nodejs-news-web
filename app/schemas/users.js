const mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
    fullname: String,
    username: String,
    password: String,
    phone: String,
    status: String,
    group: {
        id: String,
        name: String,
    },
    created: Date,
    modified: Date,
})

module.exports = mongoose.model('users', userSchema)