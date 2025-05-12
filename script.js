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
