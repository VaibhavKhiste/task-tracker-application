import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

const AuthContext = createContext();

const App = () => {
  const [user, setUser ] = useState(null);
  const [projects, setProjects] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser ();
    } else {
      setUser (null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject._id);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const fetchUser  = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/me');
      setUser (response.data);
      fetchProjects();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch user info.');
      logout();
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch projects.');
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks`);
      setTasks(response.data);
    } catch (err) {
      setError('Failed to fetch tasks.');
    }
  };

  const signup = async (email, password, name, country) => {
    try {
      setError(null);
      const response = await axios.post('/api/signup', { email, password, name, country });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/login', { email, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setUser (null);
    setProjects([]);
    setSelectedProject(null);
    setTasks([]);
  };

  const createProject = async (name) => {
    try {
      setError(null);
      if (projects.length >= 4) {
        setError('Maximum 4 projects allowed.');
        return;
      }
      const response = await axios.post('/api/projects', { name });
      setProjects([...projects, response.data]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const createTask = async (title, description) => {
    try {
      if (!selectedProject) {
        setError('Select a project first.');
        return;
      }
      const response = await axios.post(`/api/projects/${selectedProject._id}/tasks`, {
        title,
        description,
      });
      setTasks([...tasks, response.data]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await axios.put(`/api/projects/${selectedProject._id}/tasks/${taskId}`, updates);
      setTasks(tasks.map(t => (t._id === taskId ? response.data : t)));
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/projects/${selectedProject._id}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      <div className="app-container">
        <h1>Task Tracker</h1>
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">Loading...</div>}
        {!user ? (
          <AuthForm />
        ) : (
          <>
            <div className="welcome-message">
              <strong>Welcome, {user.name}!</strong>
              <button onClick={logout} className="logout-button">Logout</button>
            </div>
            <ProjectSection
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onCreateProject={createProject}
            />
            {selectedProject && (
              <TaskSection
                tasks={tasks}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            )}
          </>
        )}
      </div>
    </AuthContext.Provider>
  );
};

const AuthForm = () => {
  const { signup, login } = useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      signup(email, password, name, country);
    } else {
      login(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{isSignup ? 'Signup' : 'Login'}</h2>
      {isSignup && (
        <>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            required
            className="input-field"
          />
        </>
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="input-field"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="input-field"
      />
      <button type="submit" className="submit-button">
        {isSignup ? 'Signup' : 'Login'}
      </button>
      <button
        type="button"
        onClick={() => setIsSignup(!isSignup)}
        className="toggle-button"
      >
        Switch to {isSignup ? 'Login' : 'Signup'}
      </button>
    </form>
  );
};

const ProjectSection = ({ projects, selectedProject, onSelectProject, onCreateProject }) => {
  const [newProjectName, setNewProjectName] = useState('');

  const submitProject = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  return (
    <div className="project-section">
      <h2>Projects</h2>
      <ul className="project-list">
        {projects.map(project => (
          <li
            key={project._id}
            onClick={() => onSelectProject(project)}
            className={`project-item ${selectedProject?._id === project._id ? 'selected' : ''}`}
            title="Click to select"
          >
            {project.name}
          </li>
        ))}
      </ul>
      {projects.length < 4 ? (
        <form onSubmit={submitProject} className="new-project-form">
          <input
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="input-field"
          />
          <button type="submit" className="add-project-button">Add Project</button>
        </form>
      ) : (
        <div className="max-projects-message">You have reached the maximum of 4 projects.</div>
      )}
 </div>
  );
};

const TaskSection = ({ tasks, onCreateTask, onUpdateTask, onDeleteTask }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const submitTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateTask(newTitle.trim(), newDescription.trim());
    setNewTitle('');
    setNewDescription('');
  };

  const toggleStatus = (task) => {
    let newStatus;
    if (task.status === 'pending') newStatus = 'in-progress';
    else if (task.status === 'in-progress') newStatus = 'completed';
    else newStatus = 'pending';
    onUpdateTask(task._id, { status: newStatus });
  };

  return (
    <div className="task-section">
      <h2>Tasks</h2>
      <form onSubmit={submitTask} className="new-task-form">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Task title"
          className="input-field"
          required
        />
        <input
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          className="input-field"
        />
        <button type="submit" className="add-task-button">Add Task</button>
      </form>
      {tasks.length === 0 ? (
        <div className="no-tasks-message">No tasks yet.</div>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task._id} className="task-item">
              <div className="task-header">
                <div>
                  <strong>{task.title}</strong> &nbsp;
                  <em className={`task-status ${task.status}`}>{task.status}</em>
                </div>
                <div>
                  <button onClick={() => toggleStatus(task)} className="toggle-status-button">
                    Toggle Status
                  </button>
                  <button onClick={() => onDeleteTask(task._id)} className="delete-task-button">
                    Delete
                  </button>
                </div>
              </div>
              {task.description && <div className="task-description">{task.description}</div>}
              <div className="task-dates">
                Created: {new Date(task.dateCreated).toLocaleString()}
                {task.dateCompleted && <> | Completed: {new Date(task.dateCompleted).toLocaleString()}</>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;