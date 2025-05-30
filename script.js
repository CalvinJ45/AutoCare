import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase.js';

const daysContainer = document.getElementById('days');
const monthYear = document.querySelector('.month-year');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let currentDate = new Date(); // Start at February 2025 (Month is 0-indexed)
const currYear = currentDate.getFullYear();
const currMonth = currentDate.getMonth();
const currDay = currentDate.getDate();

let maintenanceData = [];
let currentMaintenanceIndex = 0;

function generateCalendar(date) {
  daysContainer.innerHTML = ''; // Clear previous cells

  const year = date.getFullYear();
  const month = date.getMonth();
  const days = date.getDate();

  monthYear.textContent = date.toLocaleString('default', { month: 'long' }) + ' ' + year;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const totalDays = lastDayOfMonth.getDate(); // How many days in the month

  // Fill blank spaces before first day
  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('greyed');
    daysContainer.appendChild(emptyDiv);
  }

  // Fill the actual days
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day'); // Make it clickable

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayElement.setAttribute("data-date", dateStr); // Required for click handler
    dayElement.textContent = day;

    const thisDay = new Date(year, month, day);

    // Sundays
    if (thisDay.getDay() === 0) {
      if (day === days && firstDayOfMonth.getMonth() === currMonth && firstDayOfMonth.getFullYear() === currYear) {
      dayElement.classList.add('today');
      }else {
        dayElement.classList.add('sunday');
      }
    }

    // Highlight today (for February 23, 2025 in your case)
    if (day === days && firstDayOfMonth.getMonth() === currMonth && firstDayOfMonth.getFullYear() === currYear) {
      dayElement.classList.add('today');
    }

    // Red dot on 28th (only for Feb 2025)
    if (year === 2025 && month === 1 && day === 28) {
      dayElement.classList.add('highlight');
    }

    daysContainer.appendChild(dayElement);
  }
}

prevBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar(currentDate);
});

nextBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar(currentDate);
});

generateCalendar(currentDate);

async function fetchAllMaintenance() {
  const userId = "8sdjMDcguHh1oq3MUP73MAIZL8D2"; // Replace with dynamic ID
  const vehicleDocRef = doc(db, "users", userId, "vehicles", "vehicle_0");
  const vehicleSnap = await getDoc(vehicleDocRef);
  const results = [];

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const services = vehicleData.services || [];

    services.forEach(service => {
      if (service.done === true) return;
      const { day, month, year } = service.date;
      const serviceDate = new Date(year, month - 1, day);
      const now = new Date();
      const timeDiff = serviceDate - now;
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      results.push({
        ...service,
        due: `${days}D ${hours}H`,
        link: "#"
      });
    });

    // Sort by soonest
    results.sort((a, b) => {
      const aDate = new Date(a.date.year, a.date.month - 1, a.date.day);
      const bDate = new Date(b.date.year, b.date.month - 1, b.date.day);
      return aDate - bDate;
    });
  }

  console.log("Maintenance Data:", results);

  return results;
}


const list = document.getElementById("carousel");

function renderCarousel(data) {
  list.innerHTML = "";

  data.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "carousel-slide";

    const date = new Date(item.date.year, item.date.month - 1, item.date.day);
    const now = new Date();
    const timeDiff = date - now;

    console.log("Time Difference:", timeDiff);

    if (timeDiff < 0) {
      div.innerHTML = `
      <div class="flex space-between align-center">
          <div class="flex gap gap-1">
              <div>
                  <img src="/img/wrench.png" alt="">
              </div>
              <div class="flex flow-column gap gap-0-5">
                  <div><strong>${item.type}</strong></div>
                  <div>Due In <span class="overdue">${item.due}</span></div>
                  <div><a href="${item.link}">→ Book an Appointment</a></div>
              </div>
              <div class="flex align-center">
                <input type="checkbox" id="services${index}" name="services${index}">
              </div>
          </div>
      </div>
      `;
    }else{
      div.innerHTML = `
      <div class="flex space-between align-center">
          <div class="flex gap gap-1">
              <div>
                  <img src="/img/wrench.png" alt="">
              </div>
              <div class="flex flow-column gap gap-0-5">
                  <div><strong>${item.type}</strong></div>
                  <div>Due In <span class="time">${item.due}</span></div>
                  <div><a href="${item.link}">→ Book an Appointment</a></div>
              </div>
          </div>
          <div class="flex align-center">
             <input type="checkbox" id="services${index}" name="services${index}">
          </div>
      </div>
      `;
    }

    list.appendChild(div);

    const checkbox = div.querySelector(`#services${index}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        showConfirmationPopup("✅ Mark this maintenance as done?", checkbox, index);
      }
    });
  });

  document.getElementById("maintenance-panel").classList.remove("hidden");
}

let currentSlideIndex = 0;

function scrollToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  if (slides.length === 0) return;

  currentSlideIndex = Math.max(0, Math.min(index, slides.length - 1));
  const slideHeight = slides[index].offsetHeight + 16;; // 16px = gap
  const container = document.getElementById('carousel');
  container.scrollTop = currentSlideIndex * slideHeight;
}

document.getElementById('carousel-prev').addEventListener('click', () => {
  scrollToSlide(currentSlideIndex - 1);
});
document.getElementById('carousel-next').addEventListener('click', () => {
  scrollToSlide(currentSlideIndex + 1);
});

fetchAllMaintenance().then(renderCarousel);

let popupTimeoutId = null;
let currentCheckbox = null;
let currentServiceIndex = null;

function showConfirmationPopup(message, checkbox, serviceIndex) {
  const popup = document.getElementById("confirmation-popup");
  document.getElementById("popup-message").textContent = message;
  currentCheckbox = checkbox;
  currentServiceIndex = serviceIndex;

  popup.classList.add("show");
  popup.classList.remove("hidden");

  // Automatically confirm after 5 seconds
  popupTimeoutId = setTimeout(() => {
    confirmDone();
  }, 5000);
}

function hidePopup() {
  const popup = document.getElementById("confirmation-popup");
  popup.classList.remove("show");
  popup.classList.add("hidden");
  clearTimeout(popupTimeoutId);
}

async function confirmDone() {
  if (currentServiceIndex === null) return;

  const userId = "8sdjMDcguHh1oq3MUP73MAIZL8D2"; // Replace with dynamic user ID
  const vehicleId = "vehicle_0";
  const vehicleRef = doc(db, "users", userId, "vehicles", vehicleId);
  const vehicleSnap = await getDoc(vehicleRef);

  if (vehicleSnap.exists()) {
    const data = vehicleSnap.data();
    const services = data.services || [];

    if (services[currentServiceIndex]) {
      services[currentServiceIndex].done = true;

      await updateDoc(vehicleRef, {
        services: services
      });

      // ✅ Re-fetch and re-render updated maintenance data
      const updatedData = await fetchAllMaintenance();
      maintenanceData = updatedData;
      currentMaintenanceIndex = 0;
      renderCarousel(updatedData);
    }
  }

  hidePopup();
  currentCheckbox = null;
  currentServiceIndex = null;
}

function undoAction() {
  if (currentCheckbox) {
    currentCheckbox.checked = false;
  }
  hidePopup();
}

document.getElementById("confirm-btn").addEventListener("click", () => {
  clearTimeout(popupTimeoutId);
  confirmDone();
  fetchAllMaintenance().then(renderCarousel);
});

document.getElementById("undo-btn").addEventListener("click", () => {
  undoAction();
});

const userId = "8sdjMDcguHh1oq3MUP73MAIZL8D2"; // Replace with dynamic user ID

const vehicleMenu = document.getElementById("menu");
const vehiclePopupOverlay = document.getElementById("vehicle-popup-overlay");
const vehiclePopup = document.getElementById("vehicle-popup");
const vehicleList = document.getElementById("vehicle-list");

// Toggle popup
vehicleMenu.addEventListener("click", () => {
  vehiclePopupOverlay.classList.remove("hidden");
});

// Click outside to close
vehiclePopupOverlay.addEventListener("click", (e) => {
  if (!vehiclePopup.contains(e.target)) {
    vehiclePopupOverlay.classList.add("hidden");
  }
});

// Load vehicles (unchanged)
async function loadVehicles() {
  const userDocRef = doc(collection(db, "users"), userId);
  const vehiclesRef = collection(userDocRef, "vehicles");

  vehicleList.innerHTML = "";

  for (let i = 0; ; i++) {
    const vehicleDoc = doc(vehiclesRef, `vehicle_${i}`);
    const vehicleSnap = await getDoc(vehicleDoc);
    if (!vehicleSnap.exists()) break;

    const { brand, model, year } = vehicleSnap.data();

    const item = document.createElement("div");
    item.className = "autocare-vehicle-option";
    item.innerHTML = `
      <strong>${model} ${year}</strong>
      <span>${brand}</span>
    `;

    item.addEventListener("click", () => {
      document.querySelector("#menu h3").textContent = `${model} ${year}`;
      document.querySelector("#menu h4").textContent = brand;
      vehiclePopupOverlay.classList.add("hidden");
    });

    vehicleList.appendChild(item);
  }
}

loadVehicles();
