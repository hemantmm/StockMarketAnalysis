require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const app= express();

const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://stock-market-analysis-five-lake.vercel.app',
        'https://stock-market-analysis-five-lake-git-main-hemantmehta.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}))

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
}
);

app.get('/', (req, res) => {
    res.send('Welcome to the backend API server');
});


// User schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);

app.post('/SignUp', async (req, res) => {
    const { username, email, password } = req.body;

    if(!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    try {
        const existingUser = await User.findOne({$or: [{ username, email }] });
        if(existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user=new User({
            username,
            email,
            password: hashedPassword
        });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/Login', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Login attempt with:', { username, email, hasPassword: !!password });
    
    try {
        // Build query dynamically based on what's provided
        let query = {};
        if (username) {
            query.username = username;
        } else if (email) {
            query.email = email;
        } else {
            console.log('No username or email provided');
            return res.status(400).json({ message: 'Username or email is required' });
        }

        console.log('Searching for user with query:', query);
        const user = await User.findOne(query);
        
        if (!user) {
            console.log('User not found with query:', query);
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }
        
        console.log('User found:', { id: user._id, username: user.username, email: user.email });
        console.log('Stored password hash:', user.password);
        console.log('Provided password:', password);
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if(!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }
        
        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful for user:', user.username);
        res.json({token,username:user.username});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})