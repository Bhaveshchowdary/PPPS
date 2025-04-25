import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const IssueCredentials = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [credentialsExist, setCredentialsExist] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if credentials already exist
  useEffect(() => {
    const checkCredentials = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const credentialsRef = doc(db, "credentials", userId);
        const docSnap = await getDoc(credentialsRef);

        if (docSnap.exists()) {
          setCredentialsExist(true); // Credentials already generated
        }
      }
    };

    checkCredentials();
  }, [auth.currentUser]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = auth.currentUser?.uid;

    if (userId) {
      const issuedCredential = {
        ...formData,
        issuedAt: new Date().toISOString(),
        userId,
      };

      // Save credentials to Firestore
      await setDoc(doc(db, "credentials", userId), issuedCredential);

      // Redirect to home after issuing credentials
      navigate("/home");
    }
  };

  if (credentialsExist) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="card">
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Credentials Already Generated
          </h2>
          <p>You have already generated your credentials.</p>
          <button onClick={() => navigate("/home")}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="card">
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Issue Credentials
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />
          <button type="submit">Submit & Get Credential</button>
        </form>
      </div>
    </div>
  );
};

export default IssueCredentials;
