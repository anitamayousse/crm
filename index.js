const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
// Models
const User = require("../back /models/userModel");
const Contact= require("../back /models/userModel");
const secret = "TZbMladabXvKgceHxrS9tHMwx8hE58";

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Connexion à MongoDB
mongoose
	.connect(
		"mongodb+srv://Anita:gtXSsxboyg5LMeQQ@cluster0.oppld.mongodb.net/morning_populate?retryWrites=true&w=majority",
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
	if (req.body.password.length >= 6 ){
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

app.post("/contacts/:userId/info", async (req, res) => {
	// 1 - Vérifier le token qui est dans le cookie
	let data;
    let contacts;
	try {
		data = jwt.verify(req.cookies.jwt, secret);
        contacts= await Contact.create(req.body);
		await User.findByIdAndUpdate(req.params.userId, {
			$push: 
			{ 
			client: client._id ,
			email: email._id,
			description: description._id,
			category: category._id
			},

		})
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
// Start server
app.listen(8000, () => {
	console.log("Listening");
});