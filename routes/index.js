var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("INVOKED: router.get(home)");
  res.render('index', { title: 'Express' });
});

/* GET all posts from db */
/* router.get('/posts', function(req, res, next) {
	console.log("INVOKED: router.get(posts)");
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
}); */


/* GET all posts from db INCLUDING comments */
router.get('/posts', function(req, res, next) {
	console.log("INVOKED: router.get(posts)");
	
  Post.find({}).populate('comments').exec(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});


/* POST create a post in the db */
router.post('/posts', auth, function(req, res, next) {
	console.log("INVOKED: router.post(posts)");
  var post = new Post(req.body);
   post.author = req.payload.username;

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

/* preload post objects by id */
router.param('post', function(req, res, next, id) {
	console.log("INVOKED: router.param(post)");
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

/* GET specific post from the db along with associated comments */
router.get('/posts/:post', function(req, res, next) {
	console.log("INVOKED: router.get(post)");
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

/* preload comment objects by id */
router.param('comment', function(req, res, next, id) {
	console.log("INVOKED: router.param(comment)");
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

/* upvote a specific post */
router.put('/posts/:post/upvote', auth, function(req, res, next) {
	console.log("INVOKED: router.put(post.upvote)");
  req.post.upvote(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

/* downvote a specific post */
router.put('/posts/:post/downvote', auth, function(req, res, next) {
	console.log("INVOKED: router.put(post.downvote)");
  req.post.downvote(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

/* upvote a specific comment in a post */
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
	console.log("INVOKED: router.put(comment.upvote)");
  req.comment.upvote(function(err, comment){
    if (err) { return next(err); }
    res.json(comment);
  });
});

/* downvote a specific comment in a post */
router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
	console.log("INVOKED: router.put(comment.downvote)");
  req.comment.downvote(function(err, comment){
    if (err) { return next(err); }
    res.json(comment);
  });
});

/* POST a comment in a post */
router.post('/posts/:post/comments', auth, function(req, res, next) {
	console.log("INVOKED: router.post(comment)");
  var comment = new Comment(req.body);
  comment.post = req.post;
   comment.author = req.payload.username;
  
  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

/* POST create new user and password */
router.post('/register', function(req, res, next){
	console.log("INVOKED: router.post(register)");
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

/* POST authenticate a user */
router.post('/login', function(req, res, next){
	console.log("INVOKED: router.post(login)");
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
