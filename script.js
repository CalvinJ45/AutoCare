import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
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

async function fetchMaintenanceForDate(dateStr) {
  const userId = "8sdjMDcguHh1oq3MUP73MAIZL8D2"; // replace with dynamic user ID
  const vehicleDocRef = doc(db, "users", userId, "vehicles", "vehicle_0");
  const vehicleSnap = await getDoc(vehicleDocRef);
  const results = [];

  if (vehicleSnap.exists()) {
    const vehicleData = vehicleSnap.data();
    const services = vehicleData.services || [];

    services.forEach((service) => {
      const { day, month, year } = service.date;
      const serviceDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (serviceDateStr === dateStr) {
        results.push({
          title: service.type,
          due: "N/A", // or calculate dynamically if needed
          link: "#",  // or generate a link
          ...service,
        });
      }
    });
  }

  return results;
}


document.getElementById("days").addEventListener("click", async function(e) {
  if (!e.target.classList.contains("day")) return;

  const dateStr = e.target.dataset.date; // format YYYY-MM-DD
  const data = await fetchMaintenanceForDate(dateStr);

  console.log(data);

  const list = document.getElementById("maintenance-list");
  list.innerHTML = "";

  if (data.length > 0) {
    data.forEach(item => {
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>${item.title}</strong><br>
        Due in <span class="text blue">${item.due}</span><br>
        <a href="${item.link}" class="text underline">Book an Appointment</a>
      `;
      div.classList.add("pad-5", "margin", "mt-2", "bg", "white", "rad-1", "border");
      list.appendChild(div);
    });
    document.getElementById("maintenance-panel").classList.remove("hidden");
  } else {
    list.innerHTML = "<em>No maintenance scheduled</em>";
    document.getElementById("maintenance-panel").classList.remove("hidden");
  }
});