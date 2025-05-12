// Import necessary functions from Firebase SDK
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// Get form elements
const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();  // Prevent the default form submission
  // Get form input values
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phoneNumber = document.getElementById("phoneNumber").value;

  try {
    // Create a new user with email and password
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's profile with the username
    await updateProfile(userCred.user, { displayName: username });

    // Save additional user data (phone number) to Firestore
    await setDoc(doc(db, "users", userCred.user.uid), {
      username: username,
      email: email,
      phoneNumber: phoneNumber,
    });

    document.getElementById("success-message").textContent = `Account '${username}' has been created.`;
    document.getElementById("notification-box").classList.remove("hidden");

    document.getElementById("nextButton").addEventListener("click", () => {
        window.location.href = "login.html";
    });

  } catch (error) {
    alert("Error: " + error.message);
  }
});

const showPassword = document.getElementById('show-password');
const passwordType = document.getElementById('password')

showPassword.addEventListener('mouseup', hidePass);
showPassword.addEventListener('mousedown', showPass);
showPassword.addEventListener('touchend', hidePass);
showPassword.addEventListener('touchstart', showPass);

function showPass() {
    passwordType.type = 'text';
}

function hidePass() {
    passwordType.type = 'password';
}

