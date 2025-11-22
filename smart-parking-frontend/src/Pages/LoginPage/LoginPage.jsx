import React, { useState } from "react";
import "./LoginPage.css";
import { FcGoogle } from "react-icons/fc";
import Swal from "sweetalert2";
import axios from "axios";
import { BsFacebook } from "react-icons/bs";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../Store/UserSlice/UserSlice";
import api from "../../api/axios";

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginType, setLoginType] = useState("user"); // "user" or "owner"
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const URL = "http://localhost:8081/user/login";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const googleLogin = () => {
    window.location.href =
      "http://localhost:8081/oauth2/authorization/google?prompt=select_account";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/user/login", formData);
      console.log(res);

      if (res.status === 200) {
        const user = {
          username: res.data.username,
          email: res.data.email,
          contact: loginType === "user" ? res.data.contact : res.data.contactno,
          fullname: res.data.fullname,
          userId: res.data.userId,
        };

        // Store both token and user data in localStorage
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        // Update Redux state
        dispatch(setUser(user));

        onClose(); // Close modal first

        Swal.fire({
          title: "Login Successful!",
          text: "Welcome back! Redirecting to your dashboard...",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          if (loginType === "user") {
            navigate("/dashboard");
          } else {
            navigate("/parkingownerdash");
          }
        });
      } else {
        Swal.fire({
          title: "Login Failed!",
          text: res.data.message || "Invalid credentials, please try again.",
          icon: "error",
          confirmButtonText: "Retry",
        });
      }
    } catch (err) {
      console.log(err);

      Swal.fire(
        "Error",
        err.response?.data?.message || "Something went wrong.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="enhanced-modal-overlay" onClick={handleOverlayClick}>
      <div className="enhanced-modal-container">
        {/* Close button */}
        <button className="enhanced-modal-close-btn" onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Header with gradient */}
        <div className="enhanced-modal-header">
          <div className="login-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H15M10 17L15 12L10 7M15 12H3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="enhanced-modal-title">Welcome Back</h2>
          <p className="enhanced-modal-subtitle">
            Sign in to{" "}
            {loginType === "user"
              ? "find parking spaces"
              : "manage your parking spaces"}
          </p>
        </div>

        <div className="enhanced-modal-body">
          {/* Login Type Toggle with enhanced styling */}
          <div className="enhanced-login-type-toggle">
            <div
              className="toggle-slider"
              style={{
                transform:
                  loginType === "owner" ? "translateX(100%)" : "translateX(0%)",
              }}
            ></div>
            <button
              type="button"
              onClick={() => setLoginType("user")}
              className={`enhanced-toggle-btn ${
                loginType === "user" ? "active" : ""
              }`}
            >
              <span className="toggle-icon">👤</span>
              User
            </button>
            <button
              type="button"
              onClick={() => setLoginType("owner")}
              className={`enhanced-toggle-btn ${
                loginType === "owner" ? "active" : ""
              }`}
            >
              <span className="toggle-icon">🏢</span>
              Owner
            </button>
          </div>

          {/* Sign up prompt */}
          <div className="signup-prompt">
            <span>Don't have an account? </span>
            <Link
              to={loginType === "user" ? "/userregister" : "/ParkingOwner"}
              className="enhanced-signup-link"
            >
              Create one now
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="enhanced-form">
            {/* Email field */}
            <div className="enhanced-form-group">
              {/* <label htmlFor="email" className="enhanced-label">
                Email Address
              </label> */}
              <div className="enhanced-input-container">
                <div className="input-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="22,6 12,13 2,6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  onChange={handleChange}
                  name="email"
                  className="enhanced-input"
                  required
                  placeholder="Enter your email address"
                  value={formData.email}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="enhanced-form-group">
              <div className="password-label-container">
                {/* <label htmlFor="password" className="enhanced-label">
                  Password
                </label> */}
                <NavLink
                  to="/forgetpassword"
                  className="enhanced-forgot-password"
                >
                  Forgot password?
                </NavLink>
              </div>
              <div className="enhanced-input-container">
                <div className="input-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                    <path
                      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  onChange={handleChange}
                  className="enhanced-input"
                  name="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C9.85086 19.9649 7.76941 19.243 6.06 17.94M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C16 4 20 8 20 12C19.9986 13.0588 19.7619 14.1023 19.31 15.06M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.481 9.80385 14.1962C9.51900 13.9113 9.29439 13.5717 9.14351 13.1984C8.99264 12.8251 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88M1 1L23 23M4.5 4.5C2.454 6.33 1 9.073 1 12C1 12 5 20 12 20C13.821 20.0002 15.613 19.5518 17.18 18.7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              className={`enhanced-submit-btn ${isLoading ? "loading" : ""}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Social login for users only */}
          {loginType === "user" && (
            <>
              <div className="divider">
                <span>or continue with</span>
              </div>

              <button
                type="button"
                onClick={googleLogin}
                className="enhanced-google-btn"
              >
                <FcGoogle size={20} />
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
