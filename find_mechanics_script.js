import { updateDoc, increment, collection, doc, setDoc, getDocs, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadMechanics();
  } else {
    console.log("Not logged in");
    loadMechanics(); // Still load, just without favorites
  }
});

// Favorites
function addFavoriteListeners() {
  const favButtons = document.querySelectorAll(".fav-btn");

  favButtons.forEach(button => {
    button.addEventListener("click", async (e) => {
      const mechanicId = button.getAttribute("data-id");
      const icon = button.querySelector("i");

      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to favorite this workshop.");
        return;
      }

      const favRef = doc(db, "users", user.uid, "favorites", mechanicId);
      const mechanicRef = doc(db, "mechanics", mechanicId);
      const favDoc = await getDoc(favRef);

      if (favDoc.exists()) {
        // Unfavorite
        await deleteDoc(favRef);
        await updateDoc(mechanicRef, {
          favorite_count: increment(-1)
        });
        icon.className = "fa-regular fa-heart";
      } else {
        // Favorite
        const mechanicData = await getDoc(mechanicRef);
        if (mechanicData.exists()) {
          await setDoc(favRef, mechanicData.data());
          await updateDoc(mechanicRef, {
            favorite_count: increment(1)
          });
          icon.className = "fa-solid fa-heart";
        }
      }
    });
  });
}

async function loadMechanics() {
  const container = document.getElementById("mechanic-cards");
  container.innerHTML = "";

  const user = auth.currentUser;
  let favoriteIds = new Set();

  if (user) {
    const favSnapshot = await getDocs(collection(db, "users", user.uid, "favorites"));
    favSnapshot.forEach(doc => favoriteIds.add(doc.id));
  }

  const mechanicRef = collection(db, "mechanics");
  const snapshot = await getDocs(mechanicRef);

  container.innerHTML = ""; // Clear container

  snapshot.forEach(doc => {
    const data = doc.data();
    const mechanicId = doc.id;
    const isFavorite = favoriteIds.has(mechanicId);
    const heartClass = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";

    // Create the card element
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${data.image}" alt="${data.name}" />
      <div class="info">
        <div class="top-row">
          <p class="distance">${data.distance_km.toFixed(2)} km</p>
          <button class="fav-btn" data-id="${mechanicId}">
            <i class="${heartClass}"></i>
          </button>
        </div>
        <h3>${data.name}, ${data.location}</h3>
        <p class="review">⭐ ${data.rating} • ${data.review_count} Reviews</p>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;

      localStorage.setItem("selectedMechanicId", mechanicId);
      window.location.href = "mechanics.html";
    });

    // Append the card to container
    container.appendChild(card);
  });

  // Reattach favorite listeners to the new cards
  addFavoriteListeners();
}

// Search
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', function () {
  const filter = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    if (title.includes(filter)) {
      card.style.display = 'block'; // or 'flex' if using flexbox layout
    } else {
      card.style.display = 'none';
    }
  });
});

// Filters
const filterButtons = document.querySelectorAll('.filters button');

filterButtons.forEach(button => {
  button.addEventListener('click', async () => {
    // Remove 'active' class from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    // Add 'active' class to the clicked button
    button.classList.add('active');

    const filter = button.textContent.trim();

    if (filter === 'My Favorites') {
      await loadFavoriteMechanics();
    } else if (filter === 'Top Reviews') {
      await loadMechanicsSortedByReviews();
    } else if (filter === 'Near Me') {
      await loadMechanicsSortedByDistance();
    }
  });
});

// Load only favorite mechanics
async function loadFavoriteMechanics() {
  const container = document.getElementById('mechanic-cards');
  container.innerHTML = '';

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to see your favorites.");
    return;
  }

  const favoriteIds = new Set();
  const favSnapshot = await getDocs(collection(db, 'users', user.uid, 'favorites'));
  favSnapshot.forEach(doc => favoriteIds.add(doc.id));

  if (favoriteIds.size === 0) {
    container.innerHTML = '<h2 class="fav-notif">No Favorites.</h2>';
    return;
  }

  const mechanicRef = collection(db, 'mechanics');
  const snapshot = await getDocs(mechanicRef);

  container.innerHTML = '';

  snapshot.forEach(doc => {
    if (!favoriteIds.has(doc.id)) return;

    const data = doc.data();
    const mechanicId = doc.id;
    const isFavorite = favoriteIds.has(mechanicId);
    const heartClass = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";

    // Create the card element
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${data.image}" alt="${data.name}" />
      <div class="info">
        <div class="top-row">
          <p class="distance">${data.distance_km.toFixed(2)} km</p>
          <button class="fav-btn" data-id="${mechanicId}">
            <i class="${heartClass}"></i>
          </button>
        </div>
        <h3>${data.name}, ${data.location}</h3>
        <p class="review">⭐ ${data.rating} • ${data.review_count} Reviews</p>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;

      localStorage.setItem("selectedMechanicId", mechanicId);
      window.location.href = "mechanics.html";
    });

    // Append the card to container
    container.appendChild(card);
  });

  // Reattach favorite listeners to the new cards
  addFavoriteListeners();
}

// Load mechanics sorted by reviews (descending)
async function loadMechanicsSortedByReviews() {
  const container = document.getElementById('mechanic-cards');
  container.innerHTML = '';

  const user = auth.currentUser;
  let favoriteIds = new Set();

  if (user) {
    const favSnapshot = await getDocs(collection(db, 'users', user.uid, 'favorites'));
    favSnapshot.forEach(doc => favoriteIds.add(doc.id));
  }

  const mechanicRef = collection(db, 'mechanics');
  const snapshot = await getDocs(mechanicRef);

  const mechanics = [];
  snapshot.forEach(doc => {
    mechanics.push({ id: doc.id, data: doc.data() });
  });

  mechanics.sort((a, b) => {
    if (b.data.rating === a.data.rating) {
      return b.data.review_count - a.data.review_count;
    }
    return b.data.rating - a.data.rating;
  });

  container.innerHTML = '';

  mechanics.forEach(({ id, data }) => {
    const isFavorite = favoriteIds.has(id);
    const heartClass = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const card = document.createElement("div");

    card.classList.add("card");
    card.dataset.mechanicId = id;

    card.innerHTML = `
      <img src="${data.image}" alt="${data.name}" />
      <div class="info">
        <div class="top-row">
          <p class="distance">${data.distance_km.toFixed(2)} km</p>
          <button class="fav-btn" data-id="${id}">
            <i class="${heartClass}"></i>
          </button>
        </div>
        <h3>${data.name}, ${data.location}</h3>
        <p class="review">⭐ ${data.rating} • ${data.review_count} Reviews</p>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;

      localStorage.setItem("selectedMechanicId", id);
      window.location.href = "mechanics.html";
    });

    // Append the card to container
    container.appendChild(card);
  });

  // Reattach favorite listeners to the new cards
  addFavoriteListeners();
}

// Load mechanics sorted by distance ascending
async function loadMechanicsSortedByDistance() {
  const container = document.getElementById('mechanic-cards');

  const user = auth.currentUser;
  let favoriteIds = new Set();

  if (user) {
    const favSnapshot = await getDocs(collection(db, 'users', user.uid, 'favorites'));
    favSnapshot.forEach(doc => favoriteIds.add(doc.id));
  }

  const mechanicRef = collection(db, 'mechanics');
  const snapshot = await getDocs(mechanicRef);

  const mechanics = [];
  snapshot.forEach(doc => {
    mechanics.push({ id: doc.id, data: doc.data() });
  });

  mechanics.sort((a, b) => a.data.distance_km - b.data.distance_km);

  container.innerHTML = '';

  mechanics.forEach(({ id, data }) => {
    const isFavorite = favoriteIds.has(id);
    const heartClass = isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart";

    // Create the card element
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${data.image}" alt="${data.name}" />
      <div class="info">
        <div class="top-row">
          <p class="distance">${data.distance_km.toFixed(2)} km</p>
          <button class="fav-btn" data-id="${id}">
            <i class="${heartClass}"></i>
          </button>
        </div>
        <h3>${data.name}, ${data.location}</h3>
        <p class="review">⭐ ${data.rating} • ${data.review_count} Reviews</p>
      </div>
    `;

    // ✅ Click to go to detail (but ignore favorite button click)
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;

      localStorage.setItem("selectedMechanicId", id);
      window.location.href = "mechanics.html";
    });

    container.appendChild(card);
  });

  // Reattach favorite listeners
  addFavoriteListeners();
}

