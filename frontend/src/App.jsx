import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/LoginPage/Login.jsx";
import Signup from "./components/Signup";
import VerifyOtp from "./components/VerifyOtp";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

import UserScreen from "./pages/UserScreen/UserScreen.jsx";
import UserHistory from "./pages/userHistory/userHistory.jsx";
import UserProfile from "./pages/userProfile/UserProfile.jsx";
import HelpSupport from "./pages/HelpSupport/HelpSupport.jsx"
import VendorSearch from "./pages/VendorSearch/VendorSearch.jsx";
import VendorRegistration from "./pages/VendorRegistration/VendorRegistration.jsx";
import VendorRegistrationPage2 from "./pages/VendorRegistrationPage2/VendorRegistration.jsx";
import VendorRegistrationPage3 from "./pages/VendorRegistrationPage3/VendorRegistration.jsx";
import VendorRegistrationSuccess from "./pages/VendorRegistrationSuccess/VendorRegistrationSuccess.jsx";
import VendorDetails from "./pages/VendorDetail/VendorDetails.jsx"
import ProtectedRoute from "./components/ProtectedRoute";

import "./theme.css";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================================
            DEFAULT
            ========================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =========================================
            AUTHENTICATION ROUTES
            ========================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOtp />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/userScreen"
          element={
            <ProtectedRoute>
              <UserScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userHistory"
          element={
            <ProtectedRoute>
              <UserHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userProfile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/helpSupport"
          element={
            <ProtectedRoute>
              <HelpSupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendorSearch"
          element={
            <ProtectedRoute>
              <VendorSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendorRegistration"
          element={
            <ProtectedRoute>
              <VendorRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendorRegistrationPage2"
          element={
            <ProtectedRoute>
              <VendorRegistrationPage2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendorRegistrationPage3"
          element={
            <ProtectedRoute>
              <VendorRegistrationPage3 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendorRegistrationSuccess"
          element={
            <ProtectedRoute>
              <VendorRegistrationSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="/vendor/:vendorId" element={<VendorDetails />} />
        {/* =========================================
            UNKNOWN ROUTES
            ========================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/userScreen"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;