const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const buyer = require("../models/organisation");
const user = require('../models/user');
const seller = require('../models/seller');
const profile = require('./profile');
const auth = require('../middleware/auth');
const connectDB = require('../config/db');
const { Z_BLOCK } = require("zlib");
const { getMaxListeners } = require("process");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();
var cookieParser = require('cookie-parser')
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

var storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({storage: storage}).single("image");

app.use(bodyParser.urlencoded({extended: false}));

const public = path.join(__dirname, "../public");
app.use(express.static(public));
app.use(cookieParser())

const views = path.join(__dirname, "../views");
app.set("views", views);
app.set("view engine", "hbs");

const partial = path.join(__dirname, "../partials");
hbs.registerPartials(partial);

app.get("/", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        var orgData = await org.findOne({_id: verify._id});
        if(data) {
            res.render("recyclepage", {
                n: data.name,
                loggedin: true, 
            });
        } else if(orgData){
            res.render("recyclepage", {
                n:orgData.name,
                orgLoggedin: true
            })
        }
    }
    catch(e){
        res.render("recyclepage");
    }
});

app.get("/sell", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        res.render("form", {
            n: data.name,
            loggedin: true
        });
    }
    catch(e){
        res.render("form", {
            loggedin: false
        });
    }
});


app.get("/company", (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        res.render("company", {
            loggedin: true
        });
    }
    catch(e){
        res.render("company", {
            loggedin: false
        });
    }
});

app.get("/buy", (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        res.render("buy", {
            loggedin: true
        });
    }
    catch(e){
        res.render("buy", {
            loggedin: false
        });
    }
})

app.get("/org", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        res.render("organisation", {
            n: data.name,
            st: "none",
            loggedin: true
        });
    }
    catch(e){
        res.render("organisation", {
            st: "none",
            loggedin: false
        });
    }
    
})

// app.post("/company", async (req, res) => {

//     const newBuyer = new buyer({
//         orgName: req.body.orgName,
//         city: req.body.city,
//         description: req.body.description,
//         email: req.body.email,
//         phone: req.body.phone
//     });

//     const result = await newBuyer.save();
//     //console.log(req.body.email);

//     if(result){

//         console.log("Data successfully inserted");

//         res.render("company", {
//             successMsg: "Registered Successfully"
//         });
//     }
//     else{
//         console.log("Fail to insert data");

//         res.render("company", {
//             failMsg: "Failed to registered. Please try again"
//         });
//     }

// })

var match = false;

// const Data = null;
app.post("/sell", upload, async (req, res) => {
    
    try{

        let id;

        let data = await seller.find({});
        const orgCity = await buyer.find({city: req.body.city});

        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var d = await user.findOne({_id: verify._id});

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
            name: req.body.name.toLowerCase(),
            city: req.body.city.toLowerCase(),
            description: req.body.description.toLowerCase(),
            email: req.body.email,
            phone: req.body.phone,
            status: `Waiting for buyer`.toLowerCase(),
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
                n: d.name,
                successMsg: "Thank you for recycling your waste",
                loggedin: true
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

        console.log(error);
        res.render("form", {
            failMsg: "Service is currently not available in your city",
            loggedin: true
        });
    }
});

app.post("/org", async (req, res) => {

    try{
        var city = req.body.city;
        let t = await buyer.find({city});

        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        //console.log(t);
        
        let msg = "";

        if(t.length == 0)
        {
            msg = "No organisation found";
        }

        //console.log(msg);

        res.render("organisation", {
            n: data.name,
            org: t,
            msg: msg,
            loggedin: true
        });
    }
    catch(error){
        res.render("organisation", {
            loggedin: true
        });
        //console.log(error);
    }
});

app.get("/checkStatus" , async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});

        res.render("checkStatus", {
            n: data.name,
            loggedin: true
        });
    }
    catch(e){
        res.render("checkStatus", {
            loggedin: false
        });
    }
});

app.post("/checkStatus", async (req, res) => {

    try{

        let wasteId = req.body.id;

        let data = await seller.find({wasteId: wasteId});

        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var d = await user.findOne({_id: verify._id});

        //console.log(data);

        if(data.length == 1)
        {
            res.render("checkStatus", {
                n: d.name,
                msg: `Current Status - ${data[0].status}`,
                id: req.body.id,
                loggedin: true
            })
        }
        else{
            res.render("checkStatus", {
                error: `No waste found`,
                id: req.body.id,
                loggedin: true
            })
        }

    }
    catch(error)
    {
        console.log(error);
    }
})

app.get("/updateStatus", async(req, res) => {
    const token = req.cookies.jwt;
    const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
    var data = await org.findOne({_id: verify._id});

    res.render("updateStatus", {
        n: data.name,
        orgLoggedin: true
    });
});

app.post("/updateStatus", async (req, res) => {

    var id = req.body.id;
    var status = req.body.status;

    let data = await seller.find({wasteId: id});
    const token = req.cookies.jwt;
    const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
    var d = await user.findOne({_id: verify._id});
    if(data.length == 1)
    {
        await seller.updateOne({wasteId: id}, {status: status});

        res.render("updateStatus", {
            msg: "Updated",
            orgLoggedin: true
        });
        
    }
    else{
        res.render("updateStatus", {
            error: "Wrong waste id",
            orgLoggedin: false
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

app.get("/userSignup", (req, res) => {
    res.render("signup");
});

app.post("/userSignup", async(req, res) => {

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

        const token = await newUser.generateAuthToken();
        //console.log(token);

        res.cookie("jwt", token);

        const userData = await newUser.save();

        res.render("profile", {
            n: req.body.name,
            e: req.body.email,
            loggedin: true
        });
        
    } catch (error) {
        console.log(error)
    }

});

app.get("/orgSignup", (req, res) => {
    
    
    res.render("orgSignup");
})

app.post("/orgSignup", async(req, res) => {
    try {
        pass = await bcrypt.hash(req.body.password, 10);

        const newOrg = new org({
            name: req.body.name,
            orgName: req.body.orgName,
            password: pass,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            pincode: req.body.pincode            
        });

        const token = await newOrg.generateAuthToken();
        res.cookie("jwt", token);

        const orgData = await newOrg.save();

        var status = 'waiting for buyer';

        var data = await seller.find({status: status});

        //console.log(data);

        res.render("organisationHome", {
            data: data,
            n: req.body.name,
            e: req.body.email,
            orgLoggedin: true
        });

    } catch (error) {
        console.log(error);
    }
})


app.get("/userLogin", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        res.render("login", {
            n: data.name,
            loggedin: true
        });
    }
    catch(e){
        res.render("login", {
            loggedin: false
        });
    }
});

app.post("/userLogin", async (req, res) => {


    try{
        var email = req.body.email;
        var password = req.body.password;

        var data = await user.findOne({email});

        //console.log(data);

        if(data)
        {
            const token = await data.generateAuthToken();
            //console.log(token);

            res.cookie("jwt", token, {
                httpOnly: true
            });

            var hash = await bcrypt.compare(password, data.password, (err, resp) => {
                
                var name = data.name;
                var email = data.email;

                if(resp == true)
                {
                    console.log("Password match");
                    res.render("profile", {
                        n: name,
                        e: email,
                        loggedin: true
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

app.get("/orgLogin", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await org.findOne({_id: verify._id});
        res.render("orgLogin", {
            n: data.name,
            orgLoggedin: true
        });
    }
    catch(e){
        res.render("orgLogin", {
            loggedin: false
        });
    }
});


app.post("/orgLogin", async (req, res) => {
    try{
        var email = req.body.email;
        var password = req.body.password;

        var data = await org.findOne({email});
        console.log(data);
        if(data)
        {
            const token = await data.generateAuthToken();
            //console.log(token);

            res.cookie("jwt", token, {
                httpOnly: true
            });

            var hash = await bcrypt.compare(password, data.password, async (err, resp) => {
                
                var name = data.name;
                var email = data.email;

                var status = 'waiting for buyer';

                var orgdata = await seller.find({status: status});

                //console.log(data);

                // res.render("organisationHome", {
                //     data: data,
                //     n: req.body.name,
                //     e: req.body.email,
                //     orgLoggedin: true
                // });
                if(resp == true )
                {
                    console.log("Password match");
                    res.render("organisationHome", {
                        data: orgdata,
                        n: name,
                        e: email,
                        orgLoggedin: true
                    });
                }
                else{
                    console.log("Password not match");
                    res.render("orgLogin", {
                        msg: "Incorrect Password"
                    });
                }
            });
        }
        else{
            res.render("orgLogin", {
                msg: "Invalid email"
            })
        }
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

app.get("/profile", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");
        var data = await user.findOne({_id: verify._id});
        var name = data.name;
        var email = data.email;
        res.render("profile", {
            n: name,
            e: email
        });
    }
    catch(e){
        console.log(e);
    }
})

app.get("/logout", async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const verify = jwt.verify(token, "wastearndevelopedbyteamblackpearl");

        const data = await user.findOne({_id: verify._id});
        const orgData = await org.findOne({_id: verify._id});

        if(data){
        data.tokens = data.tokens.filter((d) => {
            return d.token != token;
        })
        
        res.clearCookie("jwt");
        await data.save();
        res.render("login", {
            loggedin: false
        });
        }
        else if(orgData){
        orgData.tokens = orgData.tokens.filter((d) => {
        return d.token != token;

        })
        res.clearCookie("jwt");
        await orgData.save();
        res.render("orgLogin", {
            orgLoggedin: false
        });
        }
    }
    catch(e){
        console.log(e);
    }
})

app.listen(port, () => {
    console.log("Server is running on port number 8000");
});