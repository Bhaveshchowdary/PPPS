//This page is the main page of the application

import './../App.css';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    const goToProfile = () => {
    navigate('/profile');
    };

    const handleLogout = () => {
    navigate('/');
    };

    const navigateTo = (path) => {
    navigate(path);
    };

    return (
    <div>
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem'
        }}>
        <button onClick={goToProfile}>Profile</button>
        <button onClick={handleLogout}>Logout</button>
        </div>

        {/* <div className="card" style={{ margin: '0 auto' }}>
        <h2>Welcome to the Petition Dashboard</h2>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => navigateTo('/all-petitions')}>All Petitions</button>
            <button onClick={() => navigateTo('/signed-petitions')}>Signed Petitions</button>
            <button onClick={() => navigateTo('/create-petition')}>Create Petition</button>
            <button onClick={() => navigateTo('/created-petitions')}>Created Petitions</button>
        </div>
        </div> */}
        <div className="card" style={{ margin: '0 auto' }}>
        <h2>Welcome to the Petition Dashboard</h2>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => navigateTo('/all-petitions')}>All Petitions</button>
            <button onClick={() => navigateTo('/create-petition')}>Create Petition</button>
        </div>
        </div>
    </div>
    );
}

export default Home;
