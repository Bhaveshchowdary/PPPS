// src/Main.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import AllPetetions from './pages/All_petetions';
import CreatePetetion from './pages/Create_petetion';
import Profile from './pages/Profile';
import SignedPetetions from './pages/Signed_petetions';
import MyPetetions from './pages/My_petetions';
import IssueCredentials from "./pages/IssueCredentials";
import ConnectWallet from './components/ConnectWallet';

function RouterComponent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/home" element={<Home />} />
        <Route path="/connect" element={<ConnectWallet/>}/>
        <Route path="/all-petitions" element={<AllPetetions />} />
        <Route path="/create-petition" element={<CreatePetetion />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signed-petitions" element={<SignedPetetions />} />
        <Route path="/created-petitions" element={<MyPetetions />} />
        <Route path="/issue-credentials" element={<IssueCredentials />} />
      </Routes>
    </Router>
  );
}

export default RouterComponent;
