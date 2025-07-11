import React, { useState } from "react";
import { useAuth } from "../../contexts/Auth";

export default function SignUp({ setView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage("");
    setLoading(true);

    // The username is passed in the options.data field.
    // The Supabase trigger you created in the SQL step will
    // use this to create a new row in your 'profiles' table.
    const { error } = await signUp({
      email,
      password,
      options: {
        data: { username: username },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Success! Please check your email to confirm your account.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-800 min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Create an Account
        </h1>
        {error && (
          <p className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center">
            {error}
          </p>
        )}
        {message && (
          <p className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-center">
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:bg-indigo-400"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Already have an account?{" "}
          <button
            onClick={() => setView("login")}
            className="text-indigo-400 hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
