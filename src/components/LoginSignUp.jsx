import { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

function LoginSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  // Clear form fields when switching between login and sign-up modes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset previous errors
    try {
      if (isLogin) {
        // Trying to log in
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Trying to sign up
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Log the error to get more details
      console.error("Firebase Error: ", err);  // Logs the full error object

      // Handle specific errors based on Firebase documentation
      if (err.code === "auth/invalid-credential") {
        setError("Account does not exist. Please sign up.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format. Please check and try again.");
      } else {
        // Catch-all error handler
        setError("An error occurred: " + err.message);
      }
    }
  };

  return (
    <div className="card" style={{ margin: "auto", marginTop: "10vh" }}>
      <h2 style={{ marginBottom: "1rem" }}>
        {isLogin ? "Login to Continue" : "Create an Account"}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      <p style={{ marginTop: "1rem" }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          style={{ color: "#646cff", cursor: "pointer", fontWeight: "bold" }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Sign Up" : "Login"}
        </span>
      </p>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #ccc",
  fontSize: "1rem",
};

export default LoginSignUp;
