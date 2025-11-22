import React, { useEffect } from "react";
import HomePage, { UserHome } from "./Pages/Homepage/HomePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Registration from "./Pages/Registration/Registration";
import { AuthProvider } from "./Utils/AuthContext";
import Dashboard from "./Pages/DashBoard/DashBoard";
import ParkingSpaceOwnerLogin from "./Pages/LoginPage/ParkingSpaceOwnerLogin";

import ParkingOwnerRegistrationForm from "./Pages/Registration/ParkingOwnerRegistrationForm";
import UserProfile from "./Pages/Profile/UserProfile";
import DashBoardHome from "./Pages/DashBoard/DashBoardHome";
import ForgetPassword from "./Pages/ForgetPassword/ForgetPassword";
import ChangePassword from "./Pages/ChangePassword/ChangePassword";

import AdminDashboard from "./Pages/AdminDashBoard/AdminDashboard";
import ParkingUsersTable from "./Components/ParkingUsersTable/ParkingUsersTable";
// import AdminHome from "./Pages/AdminHome/AdminHome";
import ParkingOwnerProfile from "./Pages/Profile/PakingOwnerProfile";
import ParkingOwnersTable from "./Components/ParkingOwnersTable.jsx/ParkingOwnersTable";
import OwnerRequests from "./Components/OwnerRequest/OwnerRequest";
import ParkingOwnerDashboard from "./Pages/ParkingOwnerDash/ParkingOwnerDashboard";
import ParkingSpaces from "./Components/ParkingSpaces/ParkingSpaces";
import ReceiptViewer from "./Pages/Reciept/RecieptPreviewer";
import PrivateRoute from "./Components/PrivateRoute/PrivateRoute";
import ParkingNearMe from "./Components/ParkingNearMe/ParkingNearMe";
import AllParkingSpots from "./Components/AllParkingSpots/AllParkingSpots";
import BookingHistory from "./Pages/Booking History/BookingHistory";
import AllUserHistory from "./Pages/Booking History/AllUserHistory";
import Home from "./Pages/ParkingOwnerDash/Home";
import PaymentHistory from "./Pages/payment/PaymentHistory";
import AdminLogin from "./Pages/Admin/AdminLogin";
import UserPaymentHistory from "./Components/UsePaymentHistory/PaymentHistory";
import AllPayments from "./Pages/AdminDashBoard/AllPayments";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWebSocket } from "./Hooks/useWebSocket";
import { useSelector } from "react-redux";


const App = () => {
 const { isConnected } = useWebSocket();
  const { currentUser } = useSelector(state => state.user);

useEffect(() => {
  console.log('=== REDUX STATE DEBUG ===');
  console.log('Current User:', currentUser);
  console.log('User ID:', currentUser?.userId); // Fix: Use userId
  console.log('User Name:', currentUser?.fullname || currentUser?.name);
  console.log('WebSocket connected:', isConnected);
  console.log('========================');
}, [currentUser, isConnected]);
  return (
    <BrowserRouter>
     <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />}>
          <Route path="/" element={<UserHome/>}/>
          <Route path="/parkingspaces" element={<AllParkingSpots />} />
          
          </Route>
          <Route path="BookingHistory" element={<BookingHistory />} />
          <Route
            path="ParkingOwner"
            element={<ParkingOwnerRegistrationForm />}
          />
          <Route
            path="ParkingSpaceOwnerLogin"
            element={<ParkingSpaceOwnerLogin />}
          />
        
          <Route path="/userregister" element={<Registration />} />
          <Route path="/forgetpassword" element={<ForgetPassword />} />

          <Route element={<PrivateRoute />}>
            <Route path="/parkingownerdash" element={<ParkingOwnerDashboard />}>
              <Route path="" element={<Home />} />
              <Route
                path="ParkingOwnerProfile"
                element={<ParkingOwnerProfile />}
              />
              <Route path="payment-history" element={<PaymentHistory />} />
              <Route path="view-bookings" element={<AllUserHistory />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route path="" element={<DashBoardHome />}></Route>
              <Route
                path="/dashboard/my-booking"
                element={<BookingHistory />}
              ></Route>
              <Route path="UserProfile" element={<UserProfile />}></Route>
              <Route path="payments" element={<UserPaymentHistory />}></Route>
              <Route path="parkingspaces" element={<AllParkingSpots />}></Route>
              <Route
                path="parkingspaces/:searchedPlace"
                element={<ParkingSpaces />}
              ></Route>
              <Route path="parkingnearme" element={<ParkingNearMe />}></Route>
              <Route path="reciept/:id" element={<ReceiptViewer />} />
            </Route>
          </Route>
          <Route path="/admindashboard" element={<AdminDashboard />}>
            {/* <Route path="" element={<AdminHome />}></Route> */}
            <Route path="" element={<ParkingUsersTable />}></Route>
            <Route path="ownerrequests" element={<OwnerRequests />}></Route>
            <Route path="payments" element={<AllPayments />} />
{/* <Route path="parking-spaces" element={<ParkingSpacesPage />} /> */}

            <Route
              path="parkingowners"
              element={<ParkingOwnersTable />}
            ></Route>
          </Route>
          <Route path="/changepassword" element={<ChangePassword />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
