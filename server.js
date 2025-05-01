/**
 * Task Tracker Backend using ExpressJS + MongoDB + JWT Authentication
 * 
 * To run:
 * 1. Install dependencies: npm install express mongoose bcrypt jsonwebtoken cors dotenv
 * 2. Setup .env file with MONGODB_URI and JWT_SECRET
 * 3. Run: node server.js
 */

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

/** MongoDB connection */
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasktracker', {
    // Removed deprecated options
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

/** User Schema */
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
}, { timestamps: true });

/** Project Schema */
const projectSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
}, { timestamps: true });

/** Task Schema */
const taskSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dateCreated: { type: Date, default: Date.now },
    dateCompleted: { type: Date, default: null },
}, { timestamps: true });

/** Models */
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);

/** Middleware to authenticate JWT token */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // user: { id: userId }
        next();
    });
};

/** Routes */
app.get('/', (req, res) => {
    res.send('Welcome to the Task Tracker API backend!');
  });

/** Signup */
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, name, country } = req.body;
        if (!email || !password || !name || !country) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, name, country });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user._id, email, name, country } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during signup', error: error.message });
    }
});

/** Login */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, country: user.country } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

/** Get current user info */
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Create a new project (max 4 per user) */
app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Project name required' });

        const projectCount = await Project.countDocuments({ user: req.user.id });
        if (projectCount >= 4) {
            return res.status(400).json({ message: 'Maximum 4 projects allowed per user' });
        }

        const project = new Project({ user: req.user.id, name });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Get all projects for current user */
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Tasks CRUD under project */

/** Middleware to check if project belongs to user */
const verifyProjectOwner = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this project' });
        }
        req.project = project;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/** Create Task */
app.post('/api/projects/:projectId/tasks', authenticateToken, verifyProjectOwner, async (req, res) => {
    try {
        const { title, description, status } = req.body;
        if (!title) return res.status(400).json({ message: 'Task title required' });
        const task = new Task({
            project: req.project._id,
            title,
            description: description || '',
            status: status || 'pending',
            dateCreated: new Date(),
        });
        if (task.status === 'completed') {
            task.dateCompleted = new Date();
        }
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Get Tasks for a project */
app.get('/api/projects/:projectId/tasks', authenticateToken, verifyProjectOwner, async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.project._id });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Get a single Task */
app.get('/api/projects/:projectId/tasks/:taskId', authenticateToken, verifyProjectOwner, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Update Task */
app.put('/api/projects/:projectId/tasks/:taskId', authenticateToken, verifyProjectOwner, async (req, res) => {
    try {
        const { title, description, status } = req.body;
        const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;

        if (status !== undefined) {
            const oldStatus = task.status;
            task.status = status;
            if (oldStatus !== 'completed' && status === 'completed') {
                task.dateCompleted = new Date();
            } else if (oldStatus === 'completed' && status !== 'completed') {
                task.dateCompleted = null;
            }
        }

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Delete Task */
app.delete('/api/projects/:projectId/tasks/:taskId', authenticateToken, verifyProjectOwner, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: req.project._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/** Start server */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
