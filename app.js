// App.js
/**
* Task Tracker Frontend using ReactJS
* 
* To run:
* 1. Create a new React app: npx create-react-app task-tracker
* 2. Replace src/App.js with this code.
* 3. Install axios: npm install axios
* 4. Run: npm start
*/

import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const App = () => {
   const [user, setUser ] = useState(null);
   const [projects, setProjects] = useState([]);
   const [token, setToken] = useState(localStorage.getItem('token'));

   useEffect(() => {
       if (token) {
           axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
           fetchUser ();
           fetchProjects();
       }
   }, [token]);

   const fetchUser  = async () => {
       try {
           const response = await axios.get('/api/me');
           setUser (response.data);
       } catch (error) {
           console.error('Error fetching user:', error);
       }
   };

   const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setError(null); // Clear error on success
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'Failed to fetch projects.');
      } else if (error.request) {
        setError('No response from server. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

   const signup = async (email, password, name, country) => {
       try {
           const response = await axios.post('/api/signup', { email, password, name, country });
           setToken(response.data.token);
           localStorage.setItem('token', response.data.token);
           fetchUser ();
           fetchProjects();
       } catch (error) {
           console.error('Signup error:', error);
       }
   };

   const login = async (email, password) => {
       try {
           const response = await axios.post('/api/login', { email, password });
           setToken(response.data.token);
           localStorage.setItem('token', response.data.token);
           fetchUser ();
           fetchProjects();
       } catch (error) {
           console.error('Login error:', error);
       }
   };

   const logout = () => {
       setToken(null);
       localStorage.removeItem('token');
       setUser (null);
       setProjects([]);
   };

   return (
       <AuthContext.Provider value={{ user, signup, login, logout }}>
           <div>
               <h1>Task Tracker</h1>
               {user ? (
                   <div>
                       <h2>Welcome, {user.name}</h2>
                       <button onClick={logout}>Logout</button>
                       <ProjectList projects={projects} />
                   </div>
               ) : (
                   <AuthForm signup={signup} login={login} />
               )}
           </div>
       </AuthContext.Provider>
   );
};

const AuthForm = ({ signup, login }) => {
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
       <form onSubmit={handleSubmit}>
           <h2>{isSignup ? 'Signup' : 'Login'}</h2>
           {isSignup && (
               <>
                   <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                   <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
               </>
           )}
           <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
           <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
           <button type="submit">{isSignup ? 'Signup' : 'Login'}</button>
           <button type="button" onClick={() => setIsSignup(!isSignup)}>
               Switch to {isSignup ? 'Login' : 'Signup'}
           </button>
       </form>
   );
};

const ProjectList = ({ projects }) => {
   return (
       <div>
           <h2>Your Projects</h2>
           <ul>
               {projects.map((project) => (
                   <li key={project._id}>{project.name}</li>
               ))}
           </ul>
       </div>
   );
};

export default App;