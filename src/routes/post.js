const express = require("express");
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/posts", auth, async (req, res) => {
    const post = new Post({
        ...req.body,
        owner: req.author._id
    });

    try {
        await post.save();
        res.status(201).send(post);
    }catch(e) {
        res.status(400).send();
    }
});

router.get("/posts", auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed) {
        match.completed = req.query.completed === "true";
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }
    
    try {
        await req.author.populate({
            path: "posts",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.author.posts);
    }catch(e) {
        res.status(500).send();
    }
});

router.get("/posts/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const post = await Post.findOne({ 
            _id,
            owner: req.author._id
        });

        if(!post) {
            res.status(404).send();
        }

        res.send(post);
    }catch(e) {
        res.status(500).send();
    }
});

router.patch("/posts/:id", auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["title", "body"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        res.status(400).send({error: "Invalid updates!"});
    }

    try {
        const post = await Post.findOne({
            _id,
            owner: req.author._id
        });

        if(!post) {
            res.status(404).send();
        }

        updates.forEach((update) => post[update] = req.body[update]);
        await post.save();
        res.send(post);
    }catch(e) {
        res.status(400).send();
    }
});

router.delete("/posts/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const post = await Post.findOneAndDelete({
            _id,
            owner: req.author._id
        });

        if(!post) {
            req.status(404).send();
        }

        res.send(post);
    }catch(e) {
        res.status(500).send();
    }
});

module.exports = router;
