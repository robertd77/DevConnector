const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route POST api/posts
// Create a Post
// @access private
router.post('/', [auth, [
    check('text', 'text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post ({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    })

    const post = await newPost.save();

    res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }

})

// @route GET api/posts
// Get all posts
// @access private

router.get('/', auth, async (req,res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// @route GET api/posts/:id
// Get post by id
// @access private
router.get('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err);
        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
})

// @route DELETE api/posts/:id
// Delete Post
// @access private
router.delete('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        await post.remove();

        res.json({ msg: 'Post Removed' });
    } catch (err) {
        console.error(err);
        if(err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
})

// @route PUT api/posts/like/:id
// Like a Post
// @access private
router.put('/like/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if post has already been liked by this user
        if(post.likes.map(like => like.user.toString()).includes(req.user.id)) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// @route PUT api/posts/unlike/:id
// Unlike a post
// @access private
router.put('/unlike/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if post has already been liked by this user
        if(!(post.likes.map(like => like.user.toString()).includes(req.user.id))) {
            return res.status(400).json({ msg: 'Post not yet liked' });
        }

       // Get remove index
       const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

       post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// @route POST api/posts/comment/:id
// Comment on a post
// @access private
router.post('/comment/:id', [auth, [
    check('text', 'text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);



        const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
        }

    post.comments.unshift(newComment);

    await post.save();

    res.json(post.comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }

})

// @route POST api/posts/comment/:id/:comment_id
// Delete a comment
// @access private
router.delete('/comment/:id/:comment_id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        if(!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        //Check if user deleting comment is user that made it
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const removeIndex = post.comments.map(comm => comm.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
 
         await post.save();
         res.json(post.comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

module.exports = router;