import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import MyTasks from './pages/MyTasks';
import ProjectDetails from './pages/ProjectDetails';
import Team from './pages/Team';


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />


          <Route path="tasks" element={<MyTasks />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
