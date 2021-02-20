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

var storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({storage: storage}).single("image");

const seller = new mongoose.model("Seller", sellerSchema);
const buyer = new mongoose.model("Buyer", buyerSchema);

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

app.get("/sell", (req, res) => {
    res.render("form");
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

// app.get("/api/auth", (req, res) => {
//     res.render("login");
// })
app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/signup', (req, res) => {
    res.render('signup');
})
// app.get('/signup', (req, res) => {
//     res.render('E:\\Wast-E-arn\\views\\sign\\index');
// })

app.use('/signup', users)
app.use('/login', auth);
app.use('/api/profile', profile);

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

// const Data = null;
app.post("/sell", upload, async (req, res) => {
    
    try{

        let id;

        let data = await seller.find({});
        const orgCity = await buyer.find({city: req.body.city});

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
            name: req.body.name,
            city: req.body.city,
            description: req.body.description,
            email: req.body.email,
            phone: req.body.phone,
            status: `Processing at ${orgCity[0].orgName}`,
            img: req.file.filename
        })
        const userName = req.body.name;
        // Data = userName;
        
        
        const result = await newSeller.save();

        //console.log(orgCity);
    
        if(orgCity[0].city)
        {
        
            const orgMail = {
                from: req.body.email,
                to: orgCity[0].email,
                subject: `${id} Waste Found`,
                text: `${req.body.name} is selling their waste(waste id - ${id}) please collect it from ${req.body.city}. His contact number is - ${req.body.phone} and Email id is - ${req.body.email}`
            }

            const sellerMail = {
                from: req.body.email,
                to: req.body.email,
                subject: "Thank you for recycling your waste",
                text: `Dear ${req.body.name} thank you for recycling. Your waste id is ${id}`
            }
    
            console.log("Data successfully inserted");
    
            res.render("form", {
                successMsg: "Thank you for recycling your waste"
            });

            transporter.sendMail(sellerMail, (error, info) => {
                if(error){
                    console.log(error)
                }
                else{
                    console.log("Mail sended to seller");
                }
            })
            
            transporter.sendMail(orgMail, (error, info) => {
                if(error){
                    console.log(error);
                }else{
                    console.log("Mail sended to organisation");
                }
            })
        }
    }catch(error){

        res.render("form", {
            failMsg: "Service is currently not available in your city"
        });
    }
});

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

app.listen(port, () => {
    console.log("Server is running on port number 8000");
});