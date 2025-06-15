import { updateDoc, collection, doc, getDocs, getDoc, addDoc, query, orderBy, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const mechanicId = localStorage.getItem("selectedMechanicId");
  if (!mechanicId) return;

  const mechanicDoc = await getDoc(doc(db, "mechanics", mechanicId));
  if (!mechanicDoc.exists()) return;

  document.querySelector(".fav-btn").setAttribute("data-id", mechanicId);
  const data = mechanicDoc.data();

  document.getElementById("header-img").src = data.image;
  document.getElementById("mechanic-name").textContent = `${data.name},`;
  document.getElementById("mechanic-location").textContent = data.location;
  document.getElementById("contact").textContent = data.contact;
  document.getElementById("distance").textContent = `${data.distance_km.toFixed(2)} KM`;
  document.getElementById("rating-badge").textContent = `⭐${data.rating}`;
  document.getElementById("review-count").textContent = `${data.review_count} ratings`;
  document.getElementById("fav-count").textContent = data.favorite_count ?? 0;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const favRef = doc(db, "users", user.uid, "favorites", mechanicId);
      const favDoc = await getDoc(favRef);
      const icon = document.querySelector(".info-row .fa-heart");
      if (favDoc.exists()) {
        icon.className = "fa-solid fa-heart";
      } else {
        icon.className = "fa-regular fa-heart";
      }
      
      document.querySelector(".fav-btn").setAttribute("data-id", mechanicId);
    }
  });

  loadReviews(mechanicId);
  setupReviewForm(mechanicId);
});

async function loadReviews(mechanicId) {
  const reviewList = document.getElementById("review-list");
  const reviewRef = collection(db, "mechanics", mechanicId, "reviews");
  const q = query(reviewRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;

  reviewList.innerHTML = "";
  if (snapshot.empty) {
    reviewList.innerHTML = `<p class="no-review-text">No Reviews</p>`;
  } else {
    snapshot.forEach(doc => {
      const r = doc.data();
      total += r.rating;
      count++;

      reviewList.innerHTML += `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <strong>${r.name}</strong>
              <div class="stars-review">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div class="review-meta">
              <span class="review-date">${new Date(r.timestamp?.toDate()).toLocaleDateString()}</span>
            </div>
          </div>
          <p class="review-text">${r.text}</p>
        </div>
      `;
    });
  }

  document.getElementById("total-reviews").textContent = count;
  document.getElementById("average-rating").textContent = count ? (total / count).toFixed(1) : "0.0";
      const avgRating = count ? (total / count).toFixed(1) : "0.0";
      document.getElementById("average-rating").textContent = avgRating;

      // Generate stars
      const starDisplay = document.getElementById("star-display");
      const rounded = Math.round(avgRating);
      let starsHtml = "";

      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-star ${i <= rounded ? 'fas' : 'far'}" style="color: ${i <= rounded ? 'gold' : 'gray'};"></i>`;
      }
      starDisplay.innerHTML = starsHtml;
}

function setupReviewForm(mechanicId) {
  const form = document.getElementById("review-form");
  const textInput = document.getElementById("review-text");

  let selectedRating = 0;
  const starEls = document.querySelectorAll("#star-rating i");

  starEls.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.value);
      updateStarDisplay(selectedRating);
    });
  });

  function updateStarDisplay(rating) {
    starEls.forEach(star => {
      const val = parseInt(star.dataset.value);
      star.className = val <= rating ? "fa-star fas" : "fa-star far";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to leave a review.");
      return;
    }

    const name = user.displayName || "Anonymous";
    const text = textInput.value.trim();
    const rating = selectedRating;

    if (!text || !rating) {
      alert("Please fill out the review and select a rating.");
      return;
    }

    await addDoc(collection(db, "mechanics", mechanicId, "reviews"), {
      name,
      rating,
      text,
      timestamp: serverTimestamp()
    });

    const reviewRef = collection(db, "mechanics", mechanicId, "reviews");
    const snapshot = await getDocs(reviewRef);

    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const r = doc.data();
      total += r.rating;
      count++;
    });

    const avgRating = count ? total / count : 0;

    const mechanicRef = doc(db, "mechanics", mechanicId);
    await updateDoc(mechanicRef, {
      review_count: count,
      rating: parseFloat(avgRating.toFixed(1))
    });

    form.reset();
    selectedRating = 0;
    updateStarDisplay(0);
    loadReviews(mechanicId);
  });
}
