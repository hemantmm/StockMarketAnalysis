require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app= express();

const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: ['http://localhost:3000','https://stock-market-analysis-five-lake.vercel.app/'],
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
        // console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// app.post('/Login', async (req, res) => {
//     const { username, password } = req.body;
    
//     try {
//         const user = await User.findOne({username});
//         if (!user) {
//             return res.status(400).json({ message: 'Invalid username or password' });
//         }
//         const isMatch = await bcrypt.compare(password, user.password);
//         if(!isMatch) {
//             return res.status(400).json({ message: 'Invalid username or password' });
//         }

//         const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

//         res.json({token,username:user.username});
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error' });
//     }
// })

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})