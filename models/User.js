const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    phone: Number,
    address: String,
    city: String,
    pincode: Number,
    tokens: [{
        token: String
    }]
})


userSchema.methods.generateAuthToken = async function(){
    try{
        //console.log(this._id);
        const token = await jwt.sign({_id: this._id}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token});
        await this.save();
        return token;
    }
    catch(e)
    {
        console.log(e);
    }
}

const user = new mongoose.model("User", userSchema);

module.exports = user;