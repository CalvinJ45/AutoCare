import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const originalModalContent = `
  <h3>Update Mileage</h3>
  <input type="number" id="mileage-input" min="0" placeholder="Enter New Mileage (KM)" />
  <div class="modal-buttons">
    <button id="mileage-cancel">Cancel</button>
    <button id="mileage-save">Save</button>
  </div>
`;

function attachModalListeners(vehicleDocRef, vehicle, mileageNum, modal, modalContent) {
  const cancelBtn = document.getElementById("mileage-cancel");
  const saveBtn = document.getElementById("mileage-save");
  const input = document.getElementById("mileage-input");

  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  saveBtn.onclick = async () => {
    let newMileage = input.value.trim();

    if (!newMileage || isNaN(newMileage) || Number(newMileage) < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    newMileage = Number(newMileage);

    try {
      await updateDoc(vehicleDocRef, { mileage: newMileage });
      vehicle.mileage = newMileage;
      mileageNum.textContent = newMileage + " KM";

      modalContent.innerHTML = `
        <div class="check-wrapper">
          <img src="assets/success.png" alt="Success" class="checkmark-img" />
        </div>
      `;

      setTimeout(() => {
        modal.classList.add("hidden");
        modalContent.innerHTML = originalModalContent;
        attachModalListeners(vehicleDocRef, vehicle, mileageNum, modal, modalContent);
      }, 2000);
      
    } catch (error) {
      alert("Error updating mileage: " + error.message);
    }
  };
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
   }

  const uid = user.uid;
  const currentVehicle = "vehicle_0"
  const vehicleDocRef = doc(db, "users", uid, "vehicles", currentVehicle);
  const vehicleSnap = await getDoc(vehicleDocRef);

  if (!vehicleSnap.exists()) {
    document.querySelector(".vehicle-info").textContent = "No vehicle data found.";
    return;
  }

  const vehicle = vehicleSnap.data();

  document.querySelector(".vehicle-info").innerHTML = `
      <div class="info-row"><span>Car Brand</span><span>${vehicle.brand}</span></div>
      <div class="info-row"><span>Model</span><span>${vehicle.model}</span></div>
      <div class="info-row"><span>Year</span><span>${vehicle.year}</span></div>
  `;

  const mileageNum = document.querySelector(".mileage-value");
  mileageNum.textContent = `${vehicle.mileage} KM`;

  //   Changing Mileage
  const modal = document.getElementById("mileage-modal");
  const mileageInput = document.getElementById("mileage-input");
  const saveBtn = document.getElementById("mileage-save");
  const cancelBtn = document.getElementById("mileage-cancel");

  const modalContent = document.querySelector(".modal-content");

  document.querySelector(".status-card.mileage").addEventListener("click", () => {
  modalContent.innerHTML = originalModalContent;

  // Prefill the input with the current mileage
  const mileageInput = modalContent.querySelector("#mileage-input");
  mileageInput.value = vehicle.mileage;

  attachModalListeners(vehicleDocRef, vehicle, mileageNum, modal, modalContent);
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  saveBtn.addEventListener("click", async () => {
    let newMileage = mileageInput.value.trim();

    if (!newMileage || isNaN(newMileage) || Number(newMileage) < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    newMileage = Number(newMileage);
  });

  // Show Services Information
  const displayDiv = document.getElementById("serviceDisplay");
  displayDiv.innerHTML = ""; // Clear previous entries

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const services = vehicleData.services; // This should be an array or object

    if (services && services.length > 0) {
      // Sort services from newest to oldest
      services.sort((a, b) => {
        const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
        const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
        return dateB - dateA; // Newest first
      });

      services.forEach(service => {
        console.log("Service Data:", service);
        // Access service.type, service.date, service.center here

        const day = String(service.date.day).padStart(2, '0');
        const month = String(service.date.month).padStart(2, '0');
        const year = service.date.year;

        const serviceText = `
          <div class="service-entry">
            <h3>${service.type}</h3>
            <p><strong>Date:</strong> ${day}/${month}/${year}</p>
            <p><strong>Location:</strong> ${service.center}</p>
          </div>
        `;

        displayDiv.innerHTML += serviceText;
      });
    } else {
      console.log("No services found in the vehicle document");
    }
  } else {
    console.log("Vehicle document not found");
  }
});