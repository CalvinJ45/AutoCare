import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

window.onload = function () {
  document.getElementById('save-button').addEventListener('click', saveVehicleData);
};

async function saveVehicleData() {
  const brand = document.getElementById('brandInput').value;
  const type = document.getElementById('typeInput').value;
  const model = document.getElementById('modelInput').value;
  const year = parseInt(document.getElementById('year-manufactured').value);
  const mileage = parseInt(document.querySelector('.mileage-wrapper input').value);

  const vehicleData = {
    brand,
    type,
    model,
    year,
    mileage,
    services: serviceHistoryList,
    lastUpdated: new Date()
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userId = user.uid;
      const vehiclesCollectionRef = collection(db, "users", userId, "vehicles");

      try {
        // Get existing vehicles to determine next index
        const snapshot = await getDocs(vehiclesCollectionRef);
        const nextIndex = snapshot.size; // Number of existing vehicles
        const vehicleId = `vehicle_${nextIndex}`;

        const vehicleDocRef = doc(db, "users", userId, "vehicles", vehicleId);
        await setDoc(vehicleDocRef, vehicleData);

        document.getElementById("notification-box").classList.remove("hidden");
        document.getElementById("nextButton").addEventListener("click", () => {
            window.location.href = "main.html";
        });

        console.log(`Saved as ${vehicleId}:`, vehicleData);
        serviceHistoryList = [];

      } catch (error) {
        console.error("Error saving vehicle data:", error);
        alert("Failed to save vehicle data.");
      }
    } else {
      alert("User not logged in");
    }
  });
}
