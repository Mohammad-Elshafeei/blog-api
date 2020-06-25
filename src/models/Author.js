const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        tolowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email.");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw new Error("Password cannot contain 'password'.");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error("Age must be a positive number.");
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

authorSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "owner"
});

authorSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "owner"
});

authorSchema.methods.toJSON = function() {
    const author = this;
    const authorObject = author.toObject();

    delete authorObject.password;
    delete authorObject.tokens;
    delete authorObject.avatar;

    return authorObject;
}

authorSchema.methods.generateAuthToken = async function() {
    const author = this;
    const token = jwt.sign({_id: author._id.toString()}, process.env.JWT_SECRET);

    author.tokens = author.tokens.concat({token});
    await author.save();

    return token;
}

authorSchema.statics.findByCredentials = async (email, password) => {
    const author = await Author.findOne({email});

    if(!author) { 
        throw new Error ("Unabel to login.");
    }

    const isMatch = await bcrypt.compare(password, author.password);

    if(!isMatch) { 
        throw new Error("Unable to login.");
    }

    return author;
}

authorSchema.pre("save", async function(next) {
    const author = this;

    if(author.isModified("password")) {
        author.password = await bcrypt.hash(author.password, 8);
    }

    next();
});

authorSchema.pre("remove", async function(next) {
    const author = this;
    await Post.deleteMany({owner: author._id});
    await Comment.deleteMany({owner: author._id});
    next();
});

const Author = mongoose.model("Author", authorSchema);

module.exports = Author;
