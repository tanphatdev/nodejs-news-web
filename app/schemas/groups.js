const mongoose = require("mongoose")

var groupSchema = new mongoose.Schema({
    name: String,
    status: String,
    group_acp: String,
    created: Date,
    modified: Date,
})

module.exports = mongoose.model('groups', groupSchema)