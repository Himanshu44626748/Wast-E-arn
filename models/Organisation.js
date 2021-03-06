const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
    orgName: String,
    city: String,
    description: String,
    email: String,
    phone: Number
});

module.exports = Buyer = mongoose.model('buyer', buyerSchema);