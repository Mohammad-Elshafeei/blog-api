const express = require("express");
const Comment = require("../models/Comment");
const auth = require("../middleware/auth")
const router = new express.Router();

router.post("/comments", auth, async (req, res) => {
    const comment = new Comment({
        ...req.body,
        owner: req.author._id
    });

    try { 
        await comment.save();
        res.status(201).send(comment);
    }catch(e) {
        res.status(400).send();
    }
});

router.get("/comments", auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed) {
        req.match = req.query.completed === "true";
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    try {
        await req.author.populate({
            path: "comments",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.author.comments);
    }catch(e) {
        res.status(500).send();
    }
});

router.get("/comments/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const comment = await Comment.findOne({
            _id,
            owner: req.author._id
        });

        if(!comment) {
            res.status(404).send();
        }

        res.send(comment);
    }catch(e) {
        res.status(500).send();
    }
});

router.patch("/comments/:id", auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["body"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        res.status(400).send({error: "Invalid updates!"});
    }

    try {
        const comment = await Comment.findOne({
            _id,
            owner: req.author._id
        });

        if(!comment) {
            res.status(404).send();
        }
        
        updates.forEach((update) => comment[update] = req.body[update]);
        await comment.save();
        res.send(comment);
    }catch(e) {
        res.status(400).send();
    }
});

router.delete("/comments/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const comment = await Comment.findOneAndDelete({
            _id,
            owner: req.author._id
        });

        if(!comment) {
            res.status(404).send();
        }

        res.send(comment);
    }catch(e) {
        res.status(500).send();
    }
});

module.exports = router;