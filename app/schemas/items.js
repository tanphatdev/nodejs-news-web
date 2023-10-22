const mongoose = require("mongoose")

var itemSchema = new mongoose.Schema({
    name: String,
    ordering: Number,
    status: String,
    content: String,
    created: {
        user_id: Number,
        user_name: String,
        time: Date
    },
    modified: {
        user_id: Number,
        user_name: String,
        time: Date
    },
})

module.exports = mongoose.model('items', itemSchema)