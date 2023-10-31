import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";
import md5 from "md5";
 
const app = express();
const port = 5000;


const a=md5(1234);
    console.log(a);
// integred bodyparser and ejs
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

// connecter a moongose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
  
  //create a user Schema
  const userSchema=new mongoose.Schema({
    email:String,
    password:String
  });
   //create a key to secure
    // const SECRET=process.env.SECRET;// la clef est dans .env      
    // userSchema.plugin(encrypt, { secret: SECRET ,encryptedFields:["password"]});
   

  //create a new model
  const User=new mongoose.model('User',userSchema);

  //renvoyer sur une autre page
app.get('/', async  (req, res)=> {
    res.render("home.ejs");
    });

app.get('/login', async  (req, res)=> {
    res.render("login.ejs");
    });

app.get('/register', async  (req, res)=> {
    res.render("register.ejs");
    });
  
//recevoir les info du formulaire register et inserer dans la DB avec la methode POST
app.post('/register',  async (req, res) => {
      const newUser= new User({
        email:req.body.username,
        password:md5(req.body.password)
      });
      try {
        await newUser.save();
        res.render("secrets.ejs");
        console.log("sucessfull");
      } catch (error) {
        console(error);
      };
      
    
});

// recevoir les info du form login et ouvrir le secret
app.post('/login', async (req, res) => {
    const username=req.body.username;
    const password= md5(req.body.password);
    const foundUserName= await User.findOne({email:username});
    
    try {
        if(foundUserName){
           if(foundUserName.password===password){
            res.render("secrets.ejs");
          }else{
                res.send("password doesn't match")
            }
        }else{
            res.send("connexion failled");
        }
    } catch (error) {
        console.log(error)
    }

});
 

}





app.listen(port, () => console.log(`server started on port ${port}!`));
