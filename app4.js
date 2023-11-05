import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import  session  from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose" ;
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";

// import encrypt from "mongoose-encryption";
 
const app = express();
const port = 3000;

// integred bodyparser and ejs middleware
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
  
//use session
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false,
}));
 app.use(passport.initialize());
 app.use(passport.session());
// connecter a moongose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
  
  //create a user Schema
  const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    // add this to have one not many id anything the samepersone connect
    googleId:String,
    secret:Array
  });
   //create a key to secure
    // const SECRET=process.env.SECRET;// la clef est dans .env      
    // userSchema.plugin(encrypt, { secret: SECRET ,encryptedFields:["password"]});
    
    // user passport-local-mongoose
    userSchema.plugin(passportLocalMongoose);
    //use findorcreate
    userSchema.plugin(findOrCreate);

  //create a new model
  const User=new mongoose.model('User',userSchema);

  //passport-local-mongoose sterilize and deserialize
  passport.use(User.createStrategy());

  // passport.serializeUser(User.serializeUser());
  // passport.deserializeUser(User.deserializeUser());


  // use the one for any authentication
 passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


  // use OAUTH
  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

  //renvoyer sur une autre page
app.get('/', async  (req, res)=> {
    res.render("home.ejs");
    });
    // use href de google dans le ancre
  app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {

    res.redirect('/secrets');
  });

app.get('/login', async  (req, res)=> {
    res.render("login.ejs");
    });

app.get('/register', async  (req, res)=> {
    res.render("register.ejs");
    });

app.get("/secrets", async function (req,res){
      //  if(req.isAuthenticated()){
      //     res.render("secrets.ejs");
      //  }else{
      //   res.redirect("/login");
      //  }
 const foundUser=  await   User.find({"secret":{$ne:null}}).exec();
 if (foundUser) {
  
  res.render("secrets.ejs",{userWithSecret:foundUser});
 } else if(err) {
  console.log(err);
  
 }
      
  })  
  
//  app.get('/logout',(req,res)=>{
//     res.render("home.ejs");
//  }) 
 // with passport
 app.get('/logout',(req,res)=>{
     req.logout((err)=>{
        if(err){
            console.log(err);
        }else{
        res.redirect('/');  
        }
     });
     
 });


 app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
    
  }else{
    res.redirect("/login");
  }
  
 });

 app.post('/submit', async (req, res) => {
  const submittedSecret=[];
  submittedSecret.push(req.body.secret);
  const foundUser= await User.findById(req.user.id).exec();
  if (foundUser) {
    foundUser.secret=submittedSecret;
   await  foundUser.save();
    res.redirect("/secrets");
   ;    
  } else if (err){
    console.log(err);
    
  }

 
 });

//recevoir les info du formulaire register et inserer dans la DB avec la methode POST
app.post('/register',  async (req, res) => {
    //   const newUser= new User({
    //     email:req.body.username,
    //     password:req.body.password
    //   });
    //   try {
    //     await newUser.save();
    //     res.render("secrets.ejs");
    //     console.log("sucessfull");
    //   } catch (error) {
    //     console(error);
    //   };
      
    //session and cookies
    User.register({username:req.body.username},req.body.password, function(err,user){
         if (err) {
             res.redirect("/register");
         }else{
              passport.authenticate("local")(req,res,function (){
                  res.redirect("/secrets");
              })
         }
    })
});

// recevoir les info du form login et ouvrir le secret
app.post('/login', async (req, res) => {

    // with passport
 const user =new User({
    username:req.body.username,
    password:req.body.password

 });
  req.login(user,(err)=>{
    if (err) {
        res.status(404);
    }else{
        passport.authenticate("local")(req,res, ()=>{
            res.redirect("/secrets");
        })
        
    }
  })

    // const username=req.body.username;
    // const password=req.body.password;
    // const foundUserName= await User.findOne({email:username});
    
    // try {
    //     if(foundUserName){
    //        if(foundUserName.password===password){
    //         res.render("secrets.ejs");
    //       }else{
    //             res.send("password doesn't match")
    //         }
    //     }else{
    //         res.send("connexion failled");
    //     }
    // } catch (error) {
    //     console.log(error)
    // }

});
 

}





app.listen(port, () => console.log(`server started on port ${port}!`));
