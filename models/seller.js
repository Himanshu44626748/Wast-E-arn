const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    wasteId: Number,
    name: String,
    city: String,
    description: String,
    email: String,
    phone: Number,
    status: String,
    img: String
});

const seller = new mongoose.model("Seller", sellerSchema);

module.exports = seller;