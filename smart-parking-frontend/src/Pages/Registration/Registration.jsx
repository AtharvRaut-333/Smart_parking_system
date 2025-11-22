import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useContext, useState } from "react";
import { FaEnvelope, FaPhone, FaUser, FaKey, FaCar } from "react-icons/fa";
import "./Registration.css";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { AuthContext } from "../../Utils/AuthContext";
import Swal from "sweetalert2";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

import Select from "@mui/material/Select";
import api from "../../api/axios";
import { FcGoogle } from "react-icons/fc";

const Registration = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { token, setToken } = useContext(AuthContext);
  const [loading, setisLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const URL = "/user/register";

  const navigate = useNavigate();
  const handleBlur = (e) => {
    const { name, value } = e.target;

    validateField(name, value);
  };

  const validators = {
    fullname: (value) => {
      if (!value || value.trim() === "") {
        return "Full name is required.";
      }
      return /^[A-Z]/.test(value)
        ? ""
        : "Full name should start with a capital letter.";
    },
    email: (value) => {
      if (!value || value.trim() === "") {
        return "Email is required.";
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? ""
        : "Invalid email format.";
    },
    contactno: (value) => {
      if (!value || value.trim() === "") {
        return "Phone number is required.";
      }
      return /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(value)
        ? ""
        : "Invalid phone number.";
    },
    vehicleType: (value) => {
      if (!value || value.trim() === "") {
        return "Vehicle Type is required.";
      }
    },
    password: (value) => {
      if (!value || value.trim() === "") {
        return "Password is required.";
      }
      return value.length >= 8
        ? ""
        : "Password must be at least 8 characters long.";
    },
    cpassword: (value, password) => {
      if (!value || value.trim() === "") {
        return "Confirm password is required.";
      }
      return value === password ? "" : "Passwords do not match.";
    },
  };

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    contactno: "",
    password: "",
    cpassword: "",
    vehicleType: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const isFormValid = () => {
    return (
      Object.values(errors).every((err) => !err) && // No validation errors
      formData.fullname.trim() &&
      formData.email.trim() &&
      formData.contactno.trim() &&
      formData.vehicleType.trim() &&
      formData.password.trim() &&
      formData.cpassword.trim() &&
      formData.password === formData.cpassword // Confirm password matches
    );
  };

  const validateField = (name, value) => {
    const errorMsg = validators[name]
      ? validators[name](value, formData.password)
      : "";

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setisLoading(true);
    const isValid =
      Object.values(errors).every((err) => !err) &&
      Object.values(formData).every((field) => field.trim());

    if (!isValid) {
      Swal.fire("Error", "Please fix all errors before submitting.", "error");
      return;
    }

    try {
      const res = await api.post(URL, formData);
      console.log(res);

      if (res.status === 201) {
        Swal.fire("Success", "Registered successfully!", "success").then(() => {
          navigate("/dashboard");
        });
        setisLoading(false);
      }
    } catch (err) {
      console.log(err);
      setisLoading(false);

      if (err.response?.status === 409) {
        Swal.fire(
          "Error",
          "Email already exists. Please use a different email.",
          "error"
        );
      } else {
        Swal.fire(
          "Error",
          err.response?.data?.message || "Something went wrong.",
          "error"
        );
      }
    }
  };
   const googleLogin = () => {
    window.location.href =
      "http://localhost:8081/oauth2/authorization/google?prompt=select_account";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-5xl">
        {/* Main Registration Card */}
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/20 overflow-hidden">
          {/* Header Section with Gradient */}
          <div className=" reg-header  px-8 py-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <img 
                  src="logo.png" 
                  alt="ParkEase Logo" 
                  className="h-12 w-12 mx-auto" 
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ParkEase</h1>
            <p className="text-blue-100 text-lg">Create Your Account</p>
            <div className="w-20 h-1 bg-white/30 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-10">
            <Box
              component="form"
              className="space-y-8"
              noValidate
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              {/* Personal Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaUser className="text-blue-600 text-sm" />
                  </div>
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaUser className="text-gray-400 text-lg" />
                      </div>
                      <TextField
                        label="Full Name"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!errors.fullname}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          disableUnderline: true,
                          style: { fontSize: '16px', fontWeight: '500' }
                        }}
                        InputLabelProps={{
                          style: { fontSize: '14px', fontWeight: '500', color: '#6B7280' }
                        }}
                      />
                    </div>
                    {!!errors.fullname && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.fullname}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaCar className="text-gray-400 text-lg" />
                      </div>
                      <FormControl
                        variant="standard"
                        error={!!errors.vehicleType}
                        fullWidth
                      >
                        <InputLabel 
                          id="vehicle-type-label"
                          style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}
                        >
                          Vehicle Type
                        </InputLabel>
                        <Select
                          labelId="vehicle-type-label"
                          value={formData.vehicleType}
                          label="Vehicle Type"
                          onChange={handleChange}
                          name="vehicleType"
                          onBlur={handleBlur}
                          disableUnderline
                          style={{ fontSize: '16px', fontWeight: '500' }}
                        >
                          <MenuItem value="" style={{ fontSize: '16px' }}>
                            <em>Select Vehicle Type</em>
                          </MenuItem>
                          <MenuItem value="Two Wheeler" style={{ fontSize: '16px' }}>Two Wheeler</MenuItem>
                          <MenuItem value="Four Wheeler" style={{ fontSize: '16px' }}>Four Wheeler</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                    {!!errors.vehicleType && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.vehicleType}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaEnvelope className="text-green-600 text-sm" />
                  </div>
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Email */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaEnvelope className="text-gray-400 text-lg" />
                      </div>
                      <TextField
                        label="Email Address"
                        error={!!errors.email}
                        onBlur={handleBlur}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          disableUnderline: true,
                          style: { fontSize: '16px', fontWeight: '500' }
                        }}
                        InputLabelProps={{
                          style: { fontSize: '14px', fontWeight: '500', color: '#6B7280' }
                        }}
                      />
                    </div>
                    {!!errors.email && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaPhone className="text-gray-400 text-lg" />
                      </div>
                      <TextField
                        onBlur={handleBlur}
                        error={!!errors.contactno}
                        label="Phone Number"
                        name="contactno"
                        value={formData.contactno}
                        onChange={handleChange}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          disableUnderline: true,
                          style: { fontSize: '16px', fontWeight: '500' }
                        }}
                        InputLabelProps={{
                          style: { fontSize: '14px', fontWeight: '500', color: '#6B7280' }
                        }}
                      />
                    </div>
                    {!!errors.contactno && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.contactno}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaKey className="text-purple-600 text-sm" />
                  </div>
                  Security
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaKey className="text-gray-400 text-lg" />
                      </div>
                      <FormControl
                        variant="standard"
                        fullWidth
                      >
                        <InputLabel 
                          htmlFor="password-input"
                          style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}
                        >
                          Password
                        </InputLabel>
                        <Input
                          id="password-input"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          onBlur={handleBlur}
                          value={formData.password || ""}
                          onChange={handleChange}
                          disableUnderline
                          style={{ fontSize: '16px', fontWeight: '500' }}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={
                                  showPassword
                                    ? "hide the password"
                                    : "display the password"
                                }
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                onMouseUp={handleMouseUpPassword}
                                size="small"
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </div>
                    {!!errors.password && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-blue-50/30">
                      <div className="flex-shrink-0">
                        <FaKey className="text-gray-400 text-lg" />
                      </div>
                      <FormControl 
                        variant="standard" 
                        fullWidth
                      >
                        <InputLabel 
                          htmlFor="confirm-password-input"
                          style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}
                        >
                          Confirm Password
                        </InputLabel>
                        <Input
                          name="cpassword"
                          onBlur={handleBlur}
                          value={formData.cpassword || ""}
                          onChange={handleChange}
                          id="confirm-password-input"
                          type={showPassword ? "text" : "password"}
                          disableUnderline
                          style={{ fontSize: '16px', fontWeight: '500' }}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={
                                  showPassword
                                    ? "hide the password"
                                    : "display the password"
                                }
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                onMouseUp={handleMouseUpPassword}
                                size="small"
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </div>
                    {!!errors.cpassword && (
                      <p className="text-red-500 text-sm ml-4 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.cpassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none shadow-lg min-w-[200px]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <ClipLoader
                        color="white"
                        loading={loading}
                        size={20}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                      />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaUser className="text-sm" />
                      Create Account
                    </span>
                  )}
                </button>
              </div>
            </Box>

            {/* Footer Section */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="text-center space-y-6">
                <p className="text-gray-600 text-base">
                  Already have an account?
                  <NavLink 
                    to="/login" 
                    className="text-blue-600 ml-2 font-semibold hover:text-blue-800 transition-colors hover:underline"
                  >
                    Sign in here
                  </NavLink>
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-gray-500 font-medium text-sm bg-gray-50 px-4 py-2 rounded-full">
                    OR CONTINUE WITH
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                
                <div className="flex justify-center">
                  <div className="transform transition-all duration-200 hover:scale-105"  >
                  
                                <button
                                  type="button"
                                  onClick={googleLogin}
                                  className="enhanced-google-btn"
                                >
                                  <FcGoogle size={20} />
                                  <span>Continue with Google</span>
                                </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;