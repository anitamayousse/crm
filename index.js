const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
// Models
const User = require("./models/User");
const Contact= require("./models/Contact");
const secret = "TZbMladabXvKgceHxrS9tHMwx8hE58";

// Middlewares
app.use(express.json());
app.use(cookieParser());

// function verifyAdmin (req, res, next){
// 	if(req.decoded._doc.isAdmin === true){
// 		return next();
// 	}else{
// 		var err = new Error('Not an Admin =.=');
// 		err.status = 401;
// 		return next(err);
// 	}
//    };
// Connexion à MongoDB
mongoose
	.connect(
		"mongodb+srv://Anita:gtXSsxboyg5LMeQQ@cluster0.oppld.mongodb.net/crm?retryWrites=true&w=majority",
		{
			useNewUrlParser: true,
		}
	)
	.then(() => {
		console.log("Connected to MongoDB");
	});

// Routes
app.post("/signup", async (req, res) => {
	// if (req.body.password.length < 6) {
	// 	return res.status(400).json({
	// 		message: "Invalid data",
	// 	});
	// }
    if (req.body.confirmPassword != req.body.password ){
        return res.status(400).json({
        message: "Confirmation password does not match",
    });
    } 
	// 1 - Hasher le mot de passe
	const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const hashedConfirmPassword = await bcrypt.hash(req.body.confirmPassword, 12);

	// 2 - Créer un utilisateur
	try {
		await User.create({
			email: req.body.email,
            password: hashedPassword,
            confirmPassword: hashedConfirmPassword,
			isAdmin:req.body.isAdmin
		});
	} catch (err) {
		return res.status(400).json({
			message: "This account already exists",
		});
	}
	res.status(201).json({
		message: `User ${req.body.email} created`,
	});
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;

	// 1 - Vérifier si le compte associé à l'email existe
	const user = await User.findOne({ email });

	if (!user) {
		return res.status(400).json({
			message: "Invalid email or password",
		});
	}

	// 2 - Comparer le mot de passe au hash qui est dans la DB
	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		return res.status(400).json({
			message: "Invalid email or password",
		});
	}
	// 3 - Générer un token
	const token = jwt.sign({ id: user._id }, secret);

	// 4 - On met le token dans un cookie
	res.cookie("jwt", token, { httpOnly: true, secure: false });

	// 5 - Envoyer le cookie au client
	res.json({
		message: `User info : Email: ${req.body.email} `,
	});
});

app.get("/contacts", async (req, res) => {
	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let contacts;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
        contacts= await Contact.find();
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}
	// L'utilisateur est authentifié/autorisé
	res.json({
        message: "Your token is valid",
        data,
        contacts
    }

	);
});



app.post("/contacts/:userId", async (req, res) => {
	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let contact;
	let contactRelated;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
		contactRelated = await User.findById(req.params.userId);
        contact= await Contact.create(
			{ 
				userId: contactRelated._id,
				client: req.body.client ,
				email: req.body.email,
				description: req.body.description,
				category: req.body.category,
				},
		);
		res.json({
			message: "Your added a new client",
			data,
			contact
		});
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}
});
// to make modification on clients info
app.put("/contacts/:contactId", async (req, res) => {

	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let contact;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
		contact = await Contact.findByIdAndUpdate(req.params.contactId, 
			{ 
				client: req.body.client ,
				email: req.body.email,
				description: req.body.description,
				category: req.body.category,
				},
		);
		res.json({
			message: "Your changed the info of the client",
			data,
			contact
		});
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}
});
// to delete the client from the lists of contacts
app.delete("/contacts/:contactId", async (req, res) => {
	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let contact;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
		contact = await Contact.findByIdAndDelete(req.params.contactId);
		res.json({
			message: "This contact has been deleted from our database",
			contact
		});
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}
});
//get by query 
// to test use this URL localhost:8000/contacts/filter?category=4
app.get("/contacts/filter",async (req, res) => {
	let filterContact;
	let data;
	try {
	data = jwt.verify(req.cookies.jwt, secret);
	filterContact = await Contact.find(req.query);
	res.json(filterContact);
} catch (err) {
	return res.status(401).json({
		message: "Your token is not valid",
	});
}

});

app.get('/logout',(req,res)=>{
	try {
		data = jwt.verify(req.cookies.jwt, secret);
		res.clearCookie("jwt").status(200).json({
			message: "You have successfully logged out!",
		  });
		  res.redirect("/");
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}

   });
// to count the number of contacts 
app.get("/admin/totalcontacts", async (req, res) => {
	try {
	const data = await Contact.count(
			{
				 $group: { 
					 _id:null,
					 total: {$sum: 1}
				 }
			})
		 res.json(data);

	} catch (err) {
		return res.status(401).json({
			message: "Error",
		});
	}
  });


app.delete("/users/:userId", async (req, res) => {

	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let users;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
		users = await User.findByIdAndDelete(req.params.userId 
			);
		res.json({
			message: "This user with all its contacts has been deleted from our database",
			users
		});
	} catch (err) {
		return res.status(401).json({
			message: "Your token is not valid",
		});
	}
});

app.listen(8000, () => {
	console.log("Listening");
});