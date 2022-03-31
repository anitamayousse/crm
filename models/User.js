const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
	email: {
		type: String,
		unique: true,
        required: true,
	},
	password: {
    type: String,
    required: true,
    max: 8
    
    },
    confirmPassword: {
        type: String,
        required: true,
        max: 8
        },
    isAdmin: Boolean,
    contacts: [{ type: mongoose.Types.ObjectId, ref: "Contact" }],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;