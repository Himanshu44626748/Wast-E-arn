const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const data = require("./organisation");
const users = require('./users');
const auth = require('./auth');
const profile = require('./profile');
const connectDB = require('../config/db');
const { Z_BLOCK } = require("zlib");
const { getMaxListeners } = require("process");
const bcrypt = require("bcryptjs");
const port = process.env.PORT || 8000;

mongoose.connect("mongodb+srv://himanshu446267:44626748@cluster0.76uy4.mongodb.net/himanshu?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
.then(() => {
    console.log("Connected to database");
}).catch((error) => {
    console.log(error);
});

connectDB();

//Init middlewares
app.use(express.json({
    extented : false
}))

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "himanshu201952215@gmail.com",
        pass: "Him@n$hu201952215"
    }
})

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

const buyerSchema = new mongoose.Schema({
    orgName: String,
    city: String,
    description: String,
    email: String,
    phone: Number
});

const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    phone: Number,
    address: String,
    city: String,
    pincode: Number
})

var storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({storage: storage}).single("image");

const seller = new mongoose.model("Seller", sellerSchema);
const buyer = new mongoose.model("Buyer", buyerSchema);
const user = new mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({extended: false}));

const public = path.join(__dirname, "../public");
app.use(express.static(public));

const views = path.join(__dirname, "../views");
app.set("views", views);
app.set("view engine", "hbs");

const partial = path.join(__dirname, "../partials");
hbs.registerPartials(partial);

app.get("/", (req, res) => {
    res.render("recyclepage");
});




app.get("/company", (req, res) => {
    res.render("company");
});

app.get("/buy", (req, res) => {
    res.render("buy");
})

app.get("/org", (req, res) => {
    res.render("organisation", {
        st: "none"
    });
})

app.post("/company", async (req, res) => {

    const newBuyer = new buyer({
        orgName: req.body.orgName,
        city: req.body.city,
        description: req.body.description,
        email: req.body.email,
        phone: req.body.phone
    });

    const result = await newBuyer.save();
    //console.log(req.body.email);

    if(result){

        console.log("Data successfully inserted");

        res.render("company", {
            successMsg: "Registered Successfully"
        });
    }
    else{
        console.log("Fail to insert data");

        res.render("company", {
            failMsg: "Failed to registered. Please try again"
        });
    }

})

var match = false;

app.post("/org", async (req, res) => {

    try{
        let t = await data.available(req, res, buyer);
        //console.log(t);
        
        let msg = "";

        if(t.length == 0)
        {
            msg = "No organisation found";
        }

        //console.log(msg);

        res.render("organisation", {
            org: t,
            msg: msg
        });
    }
    catch(error){
        res.render("organisation");
        //console.log(error);
    }
    //console.log(t[0].orgName);

});

app.get("/checkStatus", (req, res) => {
    res.render("checkStatus");
});

app.post("/checkStatus", async (req, res) => {

    try{

        let wasteId = req.body.id;

        let data = await seller.find({wasteId: wasteId});

        //console.log(data);

        if(data.length == 1)
        {
            res.render("checkStatus", {
                msg: `Current Status - ${data[0].status}`,
                id: req.body.id
            })
        }
        else{
            res.render("checkStatus", {
                error: `No waste found`,
                id: req.body.id
            })
        }

    }
    catch(error)
    {
        console.log(error);
    }
})

app.get("/updateStatus", (req, res) => {
    res.render("updateStatus");
});

app.post("/updateStatus", async (req, res) => {

    var id = req.body.id;
    var status = req.body.status;

    let data = await seller.find({wasteId: id});
    if(data.length == 1)
    {
        await seller.updateOne({wasteId: id}, {status: status});

        res.render("updateStatus", {
            msg: "Updated"
        });
        
    }
    else{
        res.render("updateStatus", {
            error: "Wrong waste id"
        });
    }
    

});

app.get("/orgHome", async(req, res) => {

    var status = 'waiting for buyer';

    var data = await seller.find({status: status});

    //console.log(data);

    res.render("organisationHome", {
        data: data
    });
});

app.post("/orgHome", async(req, res) => {

    try{

        var filter = req.body.filter.toLowerCase();

        var status = 'waiting for buyer';

        if(filter === "bio" || filter === "metal" || filter === "plastic" || filter === "paper")
        {
            var data = await seller.find({status: status, description: filter});

            //console.log(filter);

            if(data.length == 0)
            {
                res.render("organisationHome", {
                    msg: "No Waste Found"
                });
            }

            else{
                res.render("organisationHome", {
                    data: data
                });
            }
        }
        else{
            var data = await seller.find({status: status, city: filter});

            //console.log(filter);
            
            if(data.length == 0)
            {
                res.render("organisationHome", {
                    msg: "No Waste Found"
                });
            }

            else{
                res.render("organisationHome", {
                    data: data
                });
            }
        }

    }
    catch(error)
    {
        console.log(error);
    }

});

app.post("/changeStatus", async(req, res) => {

    var data = await seller.find({wasteId: wasteId});

    //await seller.updateOne({wasteId: wasteId}, {status: `${data[0].}`});

});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async(req, res) => {

    try {

        pass = await bcrypt.hash(req.body.password, 10);

        const newUser = new user({
            name: req.body.name,
            password: pass,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            pincode: req.body.pincode
        });

        const userData = await newUser.save();
        var name = userData.name;
        var address = userData.address;
        var city = userData.city;
        var pincode = userData.pincode;
        var email = userData.email;
        res.render("profile", {
            n: name,
            add: address,
            ci : city,
            pin: pincode,
            em: email
        });
        
    } catch (error) {
        console.log(error)
    }

});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {

    try{
        var email = req.body.email;
        var password = req.body.password;

        var data = await user.findOne({email});

        //console.log(data);

        if(data)
        {
            var hash = await bcrypt.compare(password, data.password, (err, resp) => {
                var name = data.name;
                var address = data.address;
                var city = data.city;
                var pincode = data.pincode;
                var email = data.email;
                if(resp == true)
                {
                    console.log("Password match");
                    res.render("profile", {
                        n: name,
                        add: address,
                        ci : city,
                        pin: pincode,
                        em: email
                    });
                }
                else{
                    console.log("Password not match");
                    res.render("login", {
                        msg: "Incorrect Password"
                    });
                }
            });
        }
        else{
            res.render("login", {
                msg: "Invalid email"
            })
        }
        //console.log(hash);
    }
    catch(error)
    {
        console.log(error);
    }

});

app.get("/sell", (req, res) => {
    res.render("form");
});

app.post("/sell", async (req, res) => {
    
    try{

        let id;

        let data = await seller.find({});
        var userData = await user.findOne({email});

        if(data.length == 0)
        {
            id = 1111;
        }
        else{
            let max = data[0].wasteId;
            for(i=1;i<data.length;i++)
            {
                if(max < data[i].wasteId)
                {
                    max = data[i].wasteId;
                }
            }
            id = max+1;
        }

        const newSeller = new seller({
            wasteId: id,
            name: userData.name,
            city: userData.city,
            description: req.body.description.toLowerCase(),
            email: userData.email,
            phone: userData.phone,
            status: `Waiting for buyer`.toLowerCase(),
            img: req.file.filename
        })
        
        const result = await newSeller.save();
        console.log("Data successfully inserted");

        res.render("form", {
            successMsg: "Thank you for recycling your waste"
        });
    
    }catch(error){

        console.log(error);
        res.render("form", {
            failMsg: "Service is currently not available in your city"
        });
    }
});

app.listen(port, () => {
    console.log("Server is running on port number 8000");
});