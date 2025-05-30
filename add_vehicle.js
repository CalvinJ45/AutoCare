function toggleDropdown(selectedElement) {
    const dropdown = selectedElement.closest('.custom-dropdown');

    document.querySelectorAll('.custom-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });

    dropdown.classList.toggle('open');
  }

  document.querySelectorAll('.drop-option').forEach(option => {
    option.addEventListener('click', function (e) {
      const dropdown = this.closest('.custom-dropdown');
      const selected = dropdown.querySelector('.dropdown-selected span');
      selected.textContent = this.textContent;
      dropdown.classList.remove('open');
      e.stopPropagation();
    });
  });

  document.addEventListener('click', function (event) {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('open');
      }
    });
  });

// Auto-Complete for Brand & Model
const brandInput = document.getElementById("brandInput");
const brandSuggestionBox = document.getElementById("autocomplete");
const modelInput = document.getElementById("modelInput");
const modelSuggestionBox = document.getElementById("autocomplete2");

let brandList = [];
let modelList = {};

// Load Brand and Model CSV (with linkage)
fetch("dataset/car_model.csv")
  .then(response => response.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: false }).data;
    const firstColumn = parsed.map(row => row[0]).filter(Boolean);  // Brands
    const secondColumn = parsed.map(row => row[1]).filter(Boolean); // Models

    // Remove duplicates for brands
    brandList = [...new Set(firstColumn.map(item => item.trim()))];

    // Map models to brands
    brandList.forEach((brand, index) => {
      modelList[brand] = secondColumn.filter((model, i) => firstColumn[i] === brand);
    });
  });

// Show suggestions while typing (Brand)
brandInput.addEventListener("input", () => {
  const query = brandInput.value.toLowerCase();
  brandSuggestionBox.innerHTML = "";

  if (query.length === 0) {
    brandSuggestionBox.style.display = "none";
    return;
  }

  const matches = brandList.filter(item =>
    item.toLowerCase().startsWith(query)
  ).slice(0, 5); // Limit suggestions to 5

  if (matches.length > 0) {
    matches.forEach(match => {
      const div = document.createElement("div");
      div.textContent = match;
      div.addEventListener("click", () => {
        brandInput.value = match;
        brandSuggestionBox.style.display = "none";
        modelAutocomplete(match);  // Trigger model suggestions
      });
      brandSuggestionBox.appendChild(div);
    });
    brandSuggestionBox.style.display = "block";
  } else {
    brandSuggestionBox.style.display = "none";
  }
});

// Show suggestions for models when brand is selected
function modelAutocomplete(brand) {
  modelInput.disabled = false;
  modelInput.addEventListener("input", () => {
    const query = modelInput.value.toLowerCase();
    modelSuggestionBox.innerHTML = "";

    if (query.length === 0) {
      modelSuggestionBox.style.display = "none";
      return;
    }

    const matches = modelList[brand].filter(model =>
      model.toLowerCase().startsWith(query)
    ).slice(0, 5); // Limit suggestions to 5

    if (matches.length > 0) {
      matches.forEach(match => {
        const div = document.createElement("div");
        div.textContent = match;
        div.addEventListener("click", () => {
          modelInput.value = match;
          modelSuggestionBox.style.display = "none";
        });
        modelSuggestionBox.appendChild(div);
      });
      modelSuggestionBox.style.display = "block";
    } else {
      modelSuggestionBox.style.display = "none";
    }
  });
}

// Auto-Complete for Type
const typeInput = document.getElementById("typeInput");
const typeSuggestionBox = document.getElementById("autocomplete3");
let typeList = [];

// Load car type data from CSV
fetch("dataset/car_type.csv")
  .then(response => response.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: false }).data;
    typeList = parsed.map(row => row[0]).filter(Boolean);
    console.log("Type List loaded: ", typeList); // Debugging to check if typeList is correctly loaded
  })
  .catch(error => console.error("Error loading CSV:", error)); // Error handling

typeInput.addEventListener("input", () => {
  const query = typeInput.value.toLowerCase();
  typeSuggestionBox.innerHTML = "";

  if (query.length === 0) {
    typeSuggestionBox.style.display = "none";
    return;
  }

  const matches = typeList.filter(item =>
    item.toLowerCase().startsWith(query)
  ).slice(0, 5); // Limit to 5 matches

  if (matches.length > 0) {
    matches.forEach(match => {
      const div = document.createElement("div");
      div.textContent = match;
      div.addEventListener("click", () => {
        typeInput.value = match;
        typeSuggestionBox.style.display = "none";
      });
      typeSuggestionBox.appendChild(div);
    });
    typeSuggestionBox.style.display = "block";
  } else {
    typeSuggestionBox.style.display = "none";
  }
});

// Add Service History
let serviceCount = 0;
let serviceHistoryList = [];

function addService() {
  serviceCount++;
  const date = document.getElementById('service-date').value;
  const month = document.getElementById('service-month').value;
  const year = document.getElementById('service-year').value;
  const serviceDone = false

  // Get selected service type and center
  const serviceType = document.querySelectorAll('.custom-dropdown')[0]
    .querySelector('.dropdown-selected span').textContent;

  const serviceCenter = document.querySelectorAll('.custom-dropdown')[1]
    .querySelector('.dropdown-selected span').textContent;

  const serviceEntry = {
    date: { day: parseInt(date), month: parseInt(month), year: parseInt(year) },
    type: serviceType,
    center: serviceCenter,
    timestamp: new Date(),
    done: serviceDone
  };

  // Add to array (temporary)
  serviceHistoryList.push(serviceEntry);

  // Format the display text
  const serviceText = `
    <div class="service-entry">
      <h3># Service ${serviceCount}</h3>
      <p><strong>Date:</strong> ${date}/${month}/${year}</p>
      <p><strong>Type:</strong> ${serviceType}</p>
      <p><strong>Location:</strong> ${serviceCenter}</p>
    </div>
  `;

  // Append the result to the display div
  const displayDiv = document.getElementById("serviceDisplay");
  displayDiv.innerHTML += serviceText;
}


