
const tripsContainer = document.getElementById("trips");
const searchInput = document.getElementById("search");
const emptyMessage = document.getElementById("empty");

const archiveHeading = document.querySelector(".archive-heading");
const headingTitle = archiveHeading.querySelector("h2");
const headingEyebrow = archiveHeading.querySelector(".eyebrow");

let archiveData = {};

function makeEventCard(event) {
  const link = document.createElement("a");
  link.className = "event-card";
  link.href = event.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `Open ${event.title} Google Photos album`);

  const wrap = document.createElement("div");
  wrap.className = "event-image-wrap";

  const img = document.createElement("img");
  img.src = event.thumbnail;
  img.alt = `${event.title} thumbnail`;
  img.loading = "lazy";
  img.decoding = "async";

  img.addEventListener("error", () => {
    img.src = "images/fallback.svg";
  }, { once: true });

  const title = document.createElement("p");
  title.className = "event-title";
  title.textContent = event.title;

  const meta = document.createElement("span");
  meta.className = "event-meta";
  meta.textContent = "View photo album ↗";

  wrap.append(img);
  link.append(wrap, title, meta);

  return link;
}

function makeYearCard(year, trip) {
  const card = document.createElement("a");
  card.className = "year-card";
  card.href = `#${year}`;

  const cover = document.createElement("div");
  cover.className = "year-cover";

  const img = document.createElement("img");
  img.src = trip.events[0]?.thumbnail || "images/fallback.svg";
  img.alt = `${year} travel memories`;
  img.loading = "lazy";

  img.addEventListener("error", () => {
    img.src = "images/fallback.svg";
  }, { once: true });

  const overlay = document.createElement("div");
  overlay.className = "year-cover-overlay";

  const label = document.createElement("span");
  label.className = "year-cover-label";
  label.textContent = "EXPLORE YEAR ↗";

  overlay.append(label);
  cover.append(img, overlay);

  const info = document.createElement("div");
  info.className = "year-card-info";

  const title = document.createElement("h3");
  title.textContent = year;

  const description = document.createElement("p");
  description.textContent =
    `${trip.events.length} ${trip.events.length === 1 ? "memory" : "memories"}`;

  info.append(title, description);
  card.append(cover, info);

  return card;
}

function renderYears() {
  tripsContainer.replaceChildren();
  emptyMessage.hidden = true;

  headingEyebrow.textContent = "THE COLLECTION";
  headingTitle.textContent = "Travel archive";
  searchInput.value = "";
  searchInput.parentElement.hidden = true;

  const grid = document.createElement("div");
  grid.className = "year-grid";

  const years = Object.entries(archiveData)
    .sort(([a], [b]) => Number(b) - Number(a));

  years.forEach(([year, trip]) => {
    grid.append(makeYearCard(year, trip));
  });

  tripsContainer.append(grid);
}

function renderYear(year, filter = "") {
  const trip = archiveData[year];

  if (!trip) {
    renderYears();
    return;
  }

  tripsContainer.replaceChildren();
  const query = filter.trim().toLowerCase();

  headingEyebrow.textContent = "YOUR MEMORIES";
  headingTitle.textContent = trip.title || year;
  searchInput.parentElement.hidden = false;

  const backButton = document.createElement("a");
  backButton.className = "back-link";
  backButton.href = "#";
  backButton.textContent = "← All years";

  const yearHeading = document.createElement("div");
  yearHeading.className = "year-detail-heading";

  const yearLabel = document.createElement("span");
  yearLabel.textContent = year;

  yearHeading.append(backButton, yearLabel);
  tripsContainer.append(yearHeading);

  const grid = document.createElement("div");
  grid.className = "event-grid";

  let count = 0;

  trip.events.forEach(event => {
    const matches =
      `${event.title} ${year} ${trip.title || ""}`
        .toLowerCase()
        .includes(query);

    if (!matches) return;

    grid.append(makeEventCard(event));
    count++;
  });

  tripsContainer.append(grid);
  emptyMessage.hidden = count !== 0;
}

function renderPage() {
  const year = window.location.hash.replace("#", "");

  if (year && archiveData[year]) {
    renderYear(year, searchInput.value);
  } else {
    renderYears();
  }
}

async function init() {
  try {
    const response = await fetch("data/trips.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    archiveData = await response.json();

    renderPage();

    window.addEventListener("hashchange", renderPage);

    searchInput.addEventListener("input", () => {
      const year = window.location.hash.replace("#", "");

      if (year && archiveData[year]) {
        renderYear(year, searchInput.value);
      }
    });

  } catch (err) {
    tripsContainer.textContent =
      "Could not load the archive. Run python generate.py and commit data/trips.json.";

    console.error(err);
  }
}

init();
