import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();  

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const userQuery = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            throw new Error("Username not found"); 
        }

        const userDoc = querySnapshot.docs[0];
        const email = userDoc.data().email;
        const userCred = await signInWithEmailAndPassword(auth, email, password);

        

        
        const vehiclesRef = collection(db, "users", userDoc.id, "vehicles");
        const vehicleSnapshot = await getDocs(vehiclesRef);

        if (vehicleSnapshot.empty) {
            
            window.location.href = "boarding.html";
        } else {
            
            window.location.href = "main.html";
        }

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
