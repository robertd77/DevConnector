const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const bcrypt =  require('bcryptjs');
const { check, validationResult } = require('express-validator');
const config = require('config');

const User = require('../../models/User');

// @route POST api/users
// Register User
// @access public 
router.post('/', [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Please Include a valid email').isEmail(),
    check('password', 'Please enter a Password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body; 
    try {
        let user = await User.findOne({ email });

        if(user) {
            return res.status(400).json({ errors: [ { msg: 'User already taken' } ] });
        }
        
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })


        user = new User({
            name,
            email,
            avatar,
            password
        })

        const salt =  await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, 
            config.get('jwtSecret'), 
            { expiresIn: 360000 },
            (error, token) => {
                if(error) {
                    throw error;
                }
                res.json({ token });
            })

       
    } catch(err) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
    
})

module.exports = router;