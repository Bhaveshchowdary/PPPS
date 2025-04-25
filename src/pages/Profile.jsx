import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Import Firebase db
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore functions
import { getAuth } from "firebase/auth"; // Firebase authentication

const Profile = () => {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth(); // Get the current authenticated user

  // Fetch credentials when the component mounts
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!auth.currentUser) {
        navigate("/home");
        return;
      }

      // Create a query to search for credentials by userId (uid)
      const q = query(
        collection(db, "credentials"),
        where("userId", "==", auth.currentUser.uid) // Ensure that the `userId` is correctly stored
      );

      try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Assuming only one document per user
          const doc = querySnapshot.docs[0].data();
          setCredentials(doc); // Set the credentials state
        } else {
          // Handle the case where no credentials are found
          console.log("No credentials found for this user");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching credentials: ", error);
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [auth.currentUser, navigate]);

  // If data is loading, show a loading message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no credentials found for the user, show a message
  if (!credentials) {
    return <div>No credentials issued. Please get credentials first.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Your Profile</h2>
        <div className="mb-4">
          <h3 className="text-lg">Name: {credentials.name}</h3>
          <p>Email: {credentials.email}</p>
          <p>Issued At: {new Date(credentials.issuedAt).toLocaleString()}</p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default Profile;
