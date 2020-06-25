const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Author = require("../models/Author");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/authors", async (req, res) => {
    const author = new Author(req.body);

    try {
        await author.save();
        const token = await author.generateAuthToken();
        res.status(201).send({author, token});
    }catch(e) {
        res.status(400).send();
    }
});

router.post("/authors/login", async (req, res) => {
    try {
        const author = await Author.findByCredentials(req.body.email, req.body.password);
        const token = await author.generateAuthToken();
        res.send({author, token});
    }catch(e) {
        res.status(400).send();
    }
});

router.post("/authors/logout", auth, async (req, res) => {
    try {
        req.author.tokens = req.author.tokens.filter((token) => token.token !== req.token);
        await req.author.save();

        res.send();
    }catch(e) {
        res.status(500).send();
    }
});

router.post("/authors/logoutAll", auth, async (req, res) => {
    try {
        req.author.tokens = [];
        await req.author.save();
        res.send();
    }catch(e) {
        res.status(500).send();
    }
});

router.get("/authors/me", auth, async (req, res) => {
    res.send(req.author);
});

router.patch("/authors/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "password", "age"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        res.status(400).send({error: "Invalid updates!"});
    }

    try {
        updates.forEach((update) => req.author[update] = req.body[update]);
        await req.author.save();
        res.send(req.author);
    }catch(e) {
        res.status(400).send();
    }
});

router.delete("/authors/me", auth, async (req, res) => {
    try {
        await req.author.remove();
        res.send(req.author);
    }catch(e) {
        res.status(500).send();
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error("Please upload an image."));
        }

        cb(undefined, true);
    }
});

router.post("/authors/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();
    req.author.avatar = buffer;
    await req.author.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.delete("/authors/me/avatar", auth, async (req, res) => {
    req.author.avatar = undefined;
    await req.author.save();
    res.send();
});

router.get("/authors/:id/avatar", async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);

        if(!author || !author.avatar) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.send(author.avatar);
    }catch(e) {
        res.status(404).send();
    }
});

module.exports = router;