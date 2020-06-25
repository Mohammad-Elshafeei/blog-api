const express = require("express");
require("./db/mongoose");
const authorRouter = require("./routes/author");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");

const port = process.env.PORT;
const app = express();

app.use(express.json());
app.use(authorRouter);
app.use(postRouter);
app.use(commentRouter);

app.listen(port, () => {
	console.log(`Server is up on port ${port}`);
});