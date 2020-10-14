const express = require('express');
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult, body } = require('express-validator');
const router = express.Router();

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { response } = require('express');

// @route GET api/profile/me
// Get current users profile 
// @access private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'No profile for this user' });
            
        }

        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route POST api/profile
// Create/Update user profile
// @access private

router.post('/', [auth, [
    check('status', 'Status is Required').not().isEmpty(),
    check('skills', 'Skill is Required').not().isEmpty()
]], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Build Profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }    
    
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(twitter) profileFields.social.twitter = twitter;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile) {
            //Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, 
                { $set: profileFields },
                {  new: true }
            );

            return res.json(profile);
        }

        //Create
        profile = new Profile(profileFields);
        await profile.save();
        return res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route GET api/profile
// Get all profiles
// @access public
router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.err(err.message);
        res.status(500).send('Server Error');
    }
})

// @route GET api/profile/user/:user_id
// Get profile by userId
// @access public
router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' }); 
        } 
        res.status(500).send('Server Error');
    }
})

// @route DELETE api/profile
// Delete Profile, user and posts
// @access private
router.delete('/', auth, async (req,res) => {
    try {
        // Remove user posts
        await Post.deleteMany({ user: req.user.id });
        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // Remove user
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User Deleted' });
    } catch (err) {
        console.err(err.message);
        res.status(500).send('Server Error');
    }
})

// @route PUT api/profile/experience
// Add profile experience
// @access private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty(),
]], async (req,res) => {
    try {
      const errors = validationResult(req);  
      if(!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() })
      }

      const newExp = { ...req.body };

      try {
         const profile = await Profile.findOne({ user: req.user.id });
         profile.experience.unshift(newExp);
         
         await profile.save();

         res.json(profile);
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error')
      }

    } catch (err) {
        console.err(err.message);
        res.status(500).send('Server Error');
    }
})

// @route DELETE api/profile/experience/:exp_id
// Delete profile experience
// @access private
router.delete('/experience/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// @route PUT api/profile/education
// Add profile education
// @access private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty(),
    check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
]], async (req,res) => {
    try {
      const errors = validationResult(req);  
      if(!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() })
      }

      const newEdu = { ...req.body };

      try {
         const profile = await Profile.findOne({ user: req.user.id });
         profile.education.unshift(newEdu);
         
         await profile.save();

         res.json(profile);
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error')
      }

    } catch (err) {
        console.err(err.message);
        res.status(500).send('Server Error');
    }
})

// @route DELETE api/profile/education/:edu_id
// Delete profile education
// @access private
router.delete('/education/:edu_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// @route GET api/profile/github/:username
// Get user repos from github
// @access public
router.get('/github/:username', (req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created: 
            asc&client_id=${config.get('githubClientId')}&client_secret${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        }

        request(options, (error, response, body) => {
            if(error) {
                console.error(error);
            }
            if(response.statusCode !== 200) {
                return res.status(404).json({ 'msg': 'No Github Profile found' });
            }

            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})


module.exports = router;