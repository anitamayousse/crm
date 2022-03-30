const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
    userId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
	client: String,
	email: String,
    description: String,
    category: Number,
});

const Contact = mongoose.model("Contact", ContactSchema);

module.exports = Contact;