import {
  createContext,
  useContext,
  useState,
} from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [loading, setLoading] = useState(false);

  // Refresh current user from database
  const refreshUser = async () => {
    try {
      const { data } = await api.get("/api/auth/me");

      const updatedUser = data.data;

      setUser((currentUser) => ({
        ...currentUser,
        ...updatedUser,
      }));

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...JSON.parse(
            localStorage.getItem("user") || "{}"
          ),
          ...updatedUser,
        })
      );

      return updatedUser;
    } catch (error) {
      console.error(
        "Failed to refresh user:",
        error
      );

      return null;
    }
  };

  // Register
  const register = async (
    name,
    email,
    password
  ) => {
    setLoading(true);

    try {
      const { data } = await api.post(
        "/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.data)
      );

      localStorage.setItem(
        "token",
        data.data.token
      );

      setUser(data.data);

      toast.success(
        "Account created successfully!"
      );

      return true;

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
          "Registration failed"
      );

      return false;

    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (
    email,
    password
  ) => {
    setLoading(true);

    try {
      const { data } = await api.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.data)
      );

      localStorage.setItem(
        "token",
        data.data.token
      );

      setUser(data.data);

      toast.success(
        `Welcome back, ${data.data.name}!`
      );

      return true;

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
          "Login failed"
      );

      return false;

    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);

    toast.success(
      "Logged out successfully"
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};