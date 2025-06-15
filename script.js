import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

let uid = null; 
let vid = null; 
let currentMaintenanceDates = []; 

const vehicleTitle = document.getElementById("vehicle-title");
const vehicleBrand = document.getElementById("vehicle-brand");
let vehicleId = "vehicle_0";
localStorage.setItem("selectedVehicleId", vehicleId);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        uid = user.uid;
        const vehicleRef = doc(collection(db, "users", uid, "vehicles"), vehicleId);
        vid = await getDoc(vehicleRef);

        const { model, year, brand } = vid.data();

        
        vehicleTitle.textContent = `${model} ${year}`;
        vehicleBrand.textContent = brand;

        console.log("Logged-in user UID:", uid);
        

        let currentDate = new Date();
        const upcomingMaintenance = await fetchAllMaintenance(uid, vid);

        
        currentMaintenanceDates = upcomingMaintenance.map(m => m.date);

        fetchAllMaintenance(uid, vid).then(renderCarousel);
        generateCalendar(currentDate, currentMaintenanceDates);
        loadVehicles(uid, vid);

        prevBtn.addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() - 1);
          generateCalendar(currentDate, currentMaintenanceDates);
        });

        nextBtn.addEventListener('click', () => {
          currentDate.setMonth(currentDate.getMonth() + 1);
          generateCalendar(currentDate, currentMaintenanceDates);
        });

        document.getElementById("confirm-btn").addEventListener("click", () => {
          clearTimeout(popupTimeoutId);
          confirmDone(uid, vid, vehicleRef); 
        });
    } else {
        
        window.location.href = "index.html";
    }
});

const daysContainer = document.getElementById('days');
const monthYear = document.querySelector('.month-year');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let currentDate = new Date();
const currYear = currentDate.getFullYear();
const currMonth = currentDate.getMonth();
const currDay = currentDate.getDate();


function generateCalendar(date, maintenanceDates = []) {
  daysContainer.innerHTML = ''; 

  const year = date.getFullYear();
  const month = date.getMonth();
  const days = date.getDate();

  monthYear.textContent = date.toLocaleString('default', { month: 'long' }) + ' ' + year;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay(); 
  const totalDays = lastDayOfMonth.getDate(); 

  
  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('greyed');
    daysContainer.appendChild(emptyDiv);
  }

  
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day'); 

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayElement.setAttribute("data-date", dateStr); 
    dayElement.textContent = day;

    const thisDay = new Date(year, month, day);

    
    if (thisDay.getDay() === 0) {
      if (day === days && firstDayOfMonth.getMonth() === currMonth && firstDayOfMonth.getFullYear() === currYear) {
        dayElement.classList.add('today');
      } else {
        dayElement.classList.add('sunday');
      }
    }

    
    if (day === currDay && firstDayOfMonth.getMonth() === currMonth && firstDayOfMonth.getFullYear() === currYear) {
      dayElement.classList.add('today');
    }

    
    const isMaintenanceDay = maintenanceDates.some(m => 
      m.day === day && m.month === (month + 1) && m.year === year
    );
    
    if (isMaintenanceDay) {
      dayElement.classList.add('highlight');
    }

    daysContainer.appendChild(dayElement);
  }
}

async function fetchAllMaintenance(uid, vid) {
  const vehicleSnap = vid;
  const results = [];

  const MAINTENANCE_INTERVALS = {
    "Engine Oil Check": 1,
    "Tire Check": 1,
    "Air Filter Check": 12,
    "Brake Fluid Check": 12,
    "General Inspection": 6,
  };

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const services = vehicleData.services || [];

    
    const latestServiceMap = {};

    
    let latestGeneralInspectionDate = null;

    services.forEach(service => {
      if (!service.date || !service.type) return;

      const { day, month, year } = service.date;
      const serviceDate = new Date(year, month - 1, day);

      
      const current = latestServiceMap[service.type];
      if (!current || serviceDate > new Date(current.date.year, current.date.month - 1, current.date.day)) {
        latestServiceMap[service.type] = { ...service, date: { day, month, year } };
      }

      
      if (service.type === "General Inspection") {
        if (!latestGeneralInspectionDate || serviceDate > latestGeneralInspectionDate) {
          latestGeneralInspectionDate = serviceDate;
        }
      }
    });

    
    for (const [type, intervalMonths] of Object.entries(MAINTENANCE_INTERVALS)) {
      let baseDate;
      if (latestServiceMap[type]) {
        const { year, month, day } = latestServiceMap[type].date;
        baseDate = new Date(year, month - 1, day);
      } else if (latestGeneralInspectionDate) {
        baseDate = new Date(latestGeneralInspectionDate);
      } else {
        continue; 
      }

      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + intervalMonths);

      const now = new Date();
      const timeDiff = dueDate - now;
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      results.push({
        type: type,
        dueDate,
        due: `${days}D ${hours}H`,
        link: "#",
        date: {
          day: dueDate.getDate(),
          month: dueDate.getMonth() + 1,
          year: dueDate.getFullYear()
        }
      });
    }

    
    results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  console.log("Upcoming Maintenance:", results);
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
                  <img src="img/wrench.png" alt="">
              </div>
              <div class="flex flow-column gap gap-0-5">
                  <div><h3><strong>${item.type}</strong></h3></div>
                  <div>Due In <span class="overdue">${item.due}</span></div>
                  <div><a href="find_mechanics.html">→ Book an Appointment</a></div>
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
                  <img src="img/wrench.png" alt="">
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
  const slideHeight = slides[index].offsetHeight + 16;; 
  const container = document.getElementById('carousel');
  container.scrollTop = currentSlideIndex * slideHeight;
}

document.getElementById('carousel-prev').addEventListener('click', () => {
  scrollToSlide(currentSlideIndex - 1);
});
document.getElementById('carousel-next').addEventListener('click', () => {
  scrollToSlide(currentSlideIndex + 1);
});

let popupTimeoutId = null;
let currentCheckbox = null;
let currentServiceIndex = null;

function showConfirmationPopup(message, checkbox, serviceIndex) {
  const popup = document.getElementById("confirmation-popup");
  
  currentCheckbox = checkbox;
  currentServiceIndex = serviceIndex;

  popup.classList.add("show");
  popup.classList.remove("hidden");

  
  
  
  
}

function hidePopup() {
  const popup = document.getElementById("confirmation-popup");
  popup.classList.remove("show");
  popup.classList.add("hidden");
  clearTimeout(popupTimeoutId);
}

async function confirmDone(uid, vid, vehicleRef) {
  if (currentServiceIndex === null) return;

  const vehicleSnap = vid;
  if (!vehicleSnap.exists()) return;

  const vehicleData = vehicleSnap.data();
  const services = vehicleData.services || [];

  
  const dateInput = document.getElementById('service-date');
  const locationSelect = document.getElementById('service-location');

  const dateValue = dateInput.value;
  const locationValue = locationSelect.value;

  if (!dateValue || !locationValue) {
    alert("Please enter both the service date and location.");
    return;
  }

  const [year, month, day] = dateValue.split('-').map(Number);

  const maintenanceItems = await fetchAllMaintenance(uid, vid);
  const completedService = maintenanceItems[currentServiceIndex];

  if (completedService) {
    const newServiceEntry = {
      type: completedService.type,
      date: { day, month, year },
      center: locationValue
    };

    services.push(newServiceEntry);

    await updateDoc(vehicleRef, {
      services: services
    });

    hidePopup();
    
    
    const updatedVid = await getDoc(vehicleRef);
    const updatedData = await fetchAllMaintenance(uid, updatedVid);

    
    const updatedMaintenanceDates = updatedData.map(m => m.date);

    
    const currDate = new Date();
    generateCalendar(currDate, updatedMaintenanceDates); 

    
    renderCarousel(updatedData);
  }

  currentCheckbox = null;
  currentServiceIndex = null;
}


function undoAction() {
  if (currentCheckbox) {
    currentCheckbox.checked = false;
  }
  hidePopup();
}

document.getElementById("undo-btn").addEventListener("click", () => {
  undoAction();
});

const vehicleMenu = document.getElementById("menu");
const vehiclePopupOverlay = document.getElementById("vehicle-popup-overlay");
const vehiclePopup = document.getElementById("vehicle-popup");
const vehicleList = document.getElementById("vehicle-list");


vehicleMenu.addEventListener("click", () => {
  vehiclePopupOverlay.classList.remove("hidden");
});


vehiclePopupOverlay.addEventListener("click", (e) => {
  if (!vehiclePopup.contains(e.target)) {
    vehiclePopupOverlay.classList.add("hidden");
  }
});


async function loadVehicles(uid, vid) {
  const userDocRef = doc(collection(db, "users"), uid);
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

    item.addEventListener("click", async() => {
      vehicleId = `vehicle_${i}`; 
      localStorage.setItem("selectedVehicleId", vehicleId);
      document.querySelector("#menu h3").textContent = `${model} ${year}`;
      document.querySelector("#menu h4").textContent = brand;
      vehiclePopupOverlay.classList.add("hidden");

      
      const vehicleRef = doc(collection(db, "users", uid, "vehicles"), vehicleId);
      vid = await getDoc(vehicleRef); 

      const currentDate = new Date();
      const upcomingMaintenance = await fetchAllMaintenance(uid, vid);

      
      currentMaintenanceDates = upcomingMaintenance.map(m => m.date);

      generateCalendar(currentDate, currentMaintenanceDates);
      renderCarousel(upcomingMaintenance);
    });

    vehicleList.appendChild(item);
  }
}