// Admin Setup Utility
// This file contains functions to set up the initial admin account

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

/**
 * Create the initial admin account
 * Email: victorralph407@gmail.com
 * Password: Set during first setup
 */
export const createAdminAccount = async (password) => {
  const ADMIN_EMAIL = "victorralph407@gmail.com";
  const ADMIN_NAME = "System Administrator";

  try {
    // Check if admin already exists
    const adminQuery = await getDoc(doc(db, "users", "admin"));
    if (adminQuery.exists()) {
      console.log("Admin account already exists");
      return {
        success: false,
        message: "Admin account already exists",
      };
    }

    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      password
    );

    // Create admin user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      status: "active",
      createdAt: new Date(),
    });

    console.log("Admin account created successfully!");
    return {
      success: true,
      message: "Admin account created successfully",
      uid: userCredential.user.uid,
    };
  } catch (error) {
    console.error("Error creating admin account:", error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
};

/**
 * Update existing user to admin role
 * Use this if the account already exists
 */
export const makeUserAdmin = async (userId) => {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        role: "admin",
        status: "active",
      },
      { merge: true }
    );

    console.log("User updated to admin successfully");
    return {
      success: true,
      message: "User updated to admin",
    };
  } catch (error) {
    console.error("Error updating user to admin:", error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
};

/**
 * Instructions for manual setup
 */
export const getManualSetupInstructions = () => {
  return `
    MANUAL ADMIN SETUP INSTRUCTIONS
    ================================

    1. Register a new account with email: victorralph407@gmail.com
    2. Go to Firebase Console (https://console.firebase.google.com)
    3. Select your project
    4. Go to Firestore Database
    5. Find the 'users' collection
    6. Locate the document with email: victorralph407@gmail.com
    7. Edit the document:
       - Change 'role' field to: "admin"
       - Change 'status' field to: "active"
    8. Save changes
    9. Log out and log back in

    You should now have admin access!
  `;
};

export default {
  createAdminAccount,
  makeUserAdmin,
  getManualSetupInstructions,
};
