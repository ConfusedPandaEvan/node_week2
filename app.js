const express = require("express");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Joi = require("joi");
const cors = require("cors");
const fs = require('fs');
const authMiddleware = require("./middlewares/auth-middleware");
const app = express();
const router = express.Router();

//Bring from DB
const { User, Post, Like } = require("./models");
// const res = require("express/lib/response");
const { path } = require("express/lib/application");

app.use("/api", express.urlencoded({ extended: false }), router);


//code for resolving CORS issues
app.use(cors());

//code for image uploading using Multer
const multer = require("multer");


//Set storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    //Setting file name for no duplicates
    filename: function(req, file, cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
//Init Upload make sure only image is uploaded
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
})

//Check File Type
function checkFileType(file, cb){
    //Allowed File extensions
    const filetypes = /jpeg|jpg|png|gif/;
    //Check extensions
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb( 'Error: Images Only');
    }
}


//Check Signup Inputs
const postUserSchema = Joi.object({
  nickname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required(),
});
//Check Login Inputs
const postAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

//Signup - check input and output
router.post("/users", async (req, res) => {
  try {
    const { nickname, email, password, confirmPassword } =
      await postUserSchema.validateAsync(req.body);

    if (password !== confirmPassword) {
      res.status(400).send({
        errorMessage: "ERROR_PASSWORD_MATCH",
      });
      return;
    }

    const existUsers = await User.findAll({
      where: {
        [Op.or]: [{ nickname }, { email }],
      },
    });
    if (existUsers.length) {
      res.status(400).send({
        errorMessage: "ERROR_USER_EXISTS",
      });
      return;
    }

    await User.create({ email, nickname, password });

    res.status(201).send({});
  } catch (err) {
    res.status(400).send({
      errorMessage: "ERROR_INPUT_FORMAT",
    });
  }
});

//Login - check input and output
router.post("/auth", async (req, res) => {
  try {
    const { email, password } = await postAuthSchema.validateAsync(req.body);

    const user = await User.findOne({ where: { email, password } });

    if (!user) {
      res.status(400).send({
        errorMessage: "Email or Password is Incorrect.",
      });
      return;
    }

    const token = jwt.sign({ userId: user.userId }, "my-secret-key");
    res.send({
      token,
    });
  } catch (err) {
    res.status(400).send({
      errorMessage: "The requested format is incorrect2",
    });
  }
});

//Checking User
router.get("/users/me", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user: {
      email: user.email,
      nickname: user.nickname,
    },
  });
});

//GET get all posts
router.get("/post", async (req, res) => {
  const posts = await Post.findAll({
    order: [["createdAt", "DESC"]],
  });
  res.send({
    posts,
  });
});

//POST create posts - need to look into how to save image, check if the date is stored correctly
router.post("/post", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { userId, title, content, layout } = req.body;
    const { user } = res.locals;
    const nickname = user.userId;

    let image = req.file.filename;
    
    await Post.create({
      userId,
      title,
      content,
      createdAt: new Date().toISOString(),
      layout,
      nickname,
      image,
    });

    res.status(201).send({ success: true });
  } catch (err) {
    res.status(400).send({
      errorMessage: "something went wrong with posting",
    });
    console.log(err);
  }
});

//GET single post -- Add if image is liked by me
router.get("/post/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findByPk(postId);
  const { user } = res.locals;

  if (!post) {
    res.status(404).send({
      errorMessage: "Post not found",
    });
    // return;
  } else {
    //Count likes and add to res
    let likes = await Like.findAll({
      where: { postId },
    });
    let likeCount = likes.length;
    post.dataValues.likeCount = likeCount;

    //Check if Liked by me
    let likeByMe = false;
    let like = await Like.findAll({
      where: { postId, userId: user.userId }
    })
    if (like) {
      likeByMe = true
    }
    post.dataValues.likeByMe = likeByMe;

    res.send({ post });
  }
});

//DELETE single post
router.delete("/post/:postId", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  
  const { postId } = req.params;
  const existsPost = await Post.findOne({
    where: { postId },
  });

  if (!existsPost){
    res.status(400).send({
      errorMessage: "Please check the PostId.",
    });
    return;
  }

  if (existsPost.userId != user.userId && user.admin != true) {
    res.status(400).send({
      errorMessage: "You cannot delete this post.",
    });
  } else {
    if (existsPost) {
      //delete post and likes with the postId
      await existsPost.destroy();
      await Like.destroy({
        where: { postId },
      });
      try{
        await fs.unlink("./public/uploads/" + post.image);
      } catch (error) {
        console.log(error);
      }
      
    }
  
    res.send({});
  }
});

//PUT edit post ***need to edit image info
router.put("/post/:postId", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  const { title, content, imageLocation } = req.body;
  const { postId } = req.params;

  const existsPost = await Post.findOne({
    where: {
      postId,
    },
  });
  if (existsPost.userId != user.userId && user.admin != true) {
    res.status(400).send({
      errorMessage: "You cannot change this post.",
    });
    return;
  }
  //If post exists, update information
  if (existsPost) {
    existsPost.title = title;
    existsPost.content = content;
    existsPost.imageLocation = imageLocation;

    await existsPost.save();
    res.send({});
  } else {
    res.status(400).send({
      errorMessage: "You cannot change a non-existing Post",
    });
  }
});

//OFF.ON.OFF Like change to see userId as well
router.get("/post/:postId/like", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { user } = res.locals;


  const existsLike = await Like.findAll({
    where: { postId, userId: user.userId },
  });

  //If Like does not exist, create one, if it exists delete it
  if (existsLike == false) {
    await Like.create({
      userId,
      postId,
    });
  } else {
    await Like.destroy({
      where: { postId, userId },
    });
  }
  res.send({ existsLike });
});

//Check Mainpage Connection
router.get("/", (req, res) => {
  res.send("this is root page");
});

app.use(express.json());


//console log requests
const requestMiddleware = (req, res, next) => {
  console.log("Request URL:", req.originalUrl, " - ", new Date());
  next();
};

app.use(requestMiddleware);

//Open server to listen
app.listen(3000, () => {
  console.log("Server is Ready to SERVEEEE");
});
