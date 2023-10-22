const mongoose = require("mongoose")

var categorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    ordering: Number,
    status: String,
    created: {
        user_id: String,
        user_name: String,
        time: Date
    },
    modified: {
        user_id: String,
        user_name: String,
        time: Date
    },
})

module.exports = mongoose.model('category', categorySchema)