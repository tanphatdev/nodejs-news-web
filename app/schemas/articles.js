const mongoose = require("mongoose")

var articlesSchema = new mongoose.Schema({
    name: String,
    slug: String,
    status: String,
    special: String,
    content: String,
    thumb: String,
    category: {
        id: String,
        name: String,
    },
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

module.exports = mongoose.model('articles', articlesSchema)