const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectMongoose, User } = require("./models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
const Post = require("./models/Post");
const PostModel = require("./models/Post");

connectMongoose();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      username,
      password: bcrypt.hashSync(req.body.password, 10),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { name, username, password } = req.body;
  const userDoc = await User.findOne({ username: req.body.username });
  if (!userDoc) {
    return res.status(401).send("Could not find user");
  }

  const passOk = bcrypt.compareSync(req.body.password, userDoc.password);

  if (!passOk) {
    return res.status(401).send({
      success: false,
      message: "Incorrect Password",
    });
  }

  const payload = {
    name,
    username,
    id: userDoc._id,
  };

  if (passOk) {
    jwt.sign(payload, "secret", (err, token) => {
      if (err) {
        return res.status(400).json(err);
      } else {
        return res.cookie("token", token).json({
          id: userDoc._id,
          name: userDoc.name,
          username: userDoc.username,
        });
      }
    });
  }
});

app.get("/profile", (req, res) => {
  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", (err, info) => {
      if (err) throw err;
      res.json(info);
    });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("Logout successful");
});

app.post("/post", uploadMiddleware.single("files"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newFilename = path + "." + ext;
  fs.renameSync(path, newFilename);

  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newFilename,
        author: info.id,
      });
      res.json(postDoc);
    });
});
app.put("/post", uploadMiddleware.single("files"), async (req, res) => {
  let newFilename = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newFilename = path + "." + ext;
    fs.renameSync(path, newFilename);
  }

  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor =
        JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      //   res.json({ isAuthor, postDoc, info });
      if (!isAuthor) {
        return res.status(400).json("You are not the actual author");
      }

      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newFilename ? newFilename : postDoc.cover,
      });

      res.json(postDoc);
    });
  // res.json({test:4,fileIs:req.file})
});
app.get("/post", async (req, res) => {
  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  res.json(
    await Post.find()
      .populate("author", ["name", "username"])
      .sort({ createdAt: -1 })
      .limit(30)
  );
});

app.get("/post/:id", async (req, res) => {
  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", [
    "name",
    "username",
  ]);
  res.json(postDoc);
});

app.delete("/post/:id", async (req, res) => {
  // const id = req.body._id
  const token = req.cookies.token;
  if (token)
    jwt.verify(token, "secret", (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  const { id } = req.params;
  // console.log("hello"+id+ "\nCoookies"+token)
  const postDoc = await Post.deleteOne({_id:id})
  
  // res.status(200).json("Deleted")
});

app.listen(4000, () => {
  console.log("Connected to 4000 port");
});