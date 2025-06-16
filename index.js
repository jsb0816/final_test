const API_KEY = "8075ef55495efe85d77cbea6c0d2cd86";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

const movieContainer = document.getElementById("movie-container");
const favoritesContainer = document.getElementById("favorites-container");
const quizSection = document.getElementById("mbti-quiz");
const modal = document.getElementById("movie-modal");
const modalDetails = document.getElementById("modal-details");

// 인기 영화 불러오기
document.addEventListener("DOMContentLoaded", () => {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
            displayMovies(data.results);
            renderTop10List(data.results);
        });
});

function displayMovies(movies) {
    movieContainer.innerHTML = "";
    movieContainer.style.display = "flex";
    favoritesContainer.style.display = "none";
    quizSection.style.display = "none";

    movies.forEach((movie) => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.innerHTML = `
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" />
      <h3>${movie.title}</h3>
      <p>평점: ${movie.vote_average}</p>
      <button class="fav-btn">${isFavorited(movie.id) ? "❤️" : "🤍"}</button>
    `;

        card.querySelector(".fav-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFavorite(movie);
            displayMovies(movies);
        });

        card.addEventListener("click", () => showMovieModal(movie.id));
        movieContainer.appendChild(card);
    });
}

function renderTop10List(movies) {
    const top10 = [...movies]
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 10);

    const ul = document.getElementById("top10-list");
    ul.innerHTML = "";

    top10.forEach((movie, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}위. ${movie.title}`;
        ul.appendChild(li);
    });
}


// 검색 기능
document.getElementById("search-btn").addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) searchMovies(query);
});

document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const query = e.target.value.trim();
        if (query) searchMovies(query);
    }
});

function searchMovies(query) {
    fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.results.length > 0) {
                displayMovies(data.results);
            } else {
                alert("검색 결과가 없습니다.");
            }
        })
        .catch((err) => {
            console.error("검색 오류", err);
        });
}

// 모달
function showMovieModal(movieId) {
    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ko-KR`)
        .then((res) => res.json())
        .then((movie) => {
            modalDetails.innerHTML = `
        <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" />
        <h2>${movie.title}</h2>
        <p><strong>개봉일:</strong> ${movie.release_date}</p>
        <p><strong>평점:</strong> ${movie.vote_average}</p>
        <p>${movie.overview}</p>
      `;
            modal.classList.add("show");
        });
}

document.querySelector(".close-btn").addEventListener("click", () => {
    modal.classList.remove("show");
});

// 찜하기
function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function isFavorited(id) {
    const favorites = getFavorites();
    return favorites.some((m) => m.id === id);
}

function toggleFavorite(movie) {
    let favorites = getFavorites();
    if (isFavorited(movie.id)) {
        favorites = favorites.filter((m) => m.id !== movie.id);
    } else {
        favorites.push(movie);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

// 찜한 영화 보기
document.getElementById("favorites-btn").addEventListener("click", () => {
    const favorites = getFavorites();
    movieContainer.style.display = "none";
    quizSection.style.display = "none";
    favoritesContainer.style.display = "flex";
    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = "<p style='text-align:center; width:100%'>찜한 영화가 없습니다.</p>";
        return;
    }

    favorites.forEach((movie) => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.innerHTML = `
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" />
      <h3>${movie.title}</h3>
      <p>평점: ${movie.vote_average}</p>
      <button class="fav-btn">❤️</button>
    `;
        card.querySelector(".fav-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFavorite(movie);
            card.remove();
        });
        card.addEventListener("click", () => showMovieModal(movie.id));
        favoritesContainer.appendChild(card);
    });
});

// MBTI 추천
document.getElementById("mbti-btn").addEventListener("click", () => {
    movieContainer.style.display = "none";
    favoritesContainer.style.display = "none";
    quizSection.style.display = "block";
});

document.getElementById("submit-mbti").addEventListener("click", () => {
    const q1 = document.querySelector("input[name='q1']:checked");
    const q2 = document.querySelector("input[name='q2']:checked");
    const q3 = document.querySelector("input[name='q3']:checked");

    if (!q1 || !q2 || !q3) {
        alert("모든 질문에 답해주세요.");
        return;
    }

    const mbti = q1.value + q2.value + q3.value;
    const typeToGenre = {
        INF: 18,
        INT: 27,
        ENF: 10749,
        ENT: 28,
        ISF: 16,
        EST: 35,
        ESN: 14,
        etc: 99,
    };
    const genreId = typeToGenre[mbti] || typeToGenre.etc;

    fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
            if (data.results.length > 0) {
                const movie = data.results[Math.floor(Math.random() * data.results.length)];
                showMovieModal(movie.id);
            } else {
                alert("추천할 영화가 없습니다.");
            }
        });
});

// 로고 클릭 → 홈으로
document.getElementById("logo").addEventListener("click", () => {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => displayMovies(data.results));
});

function loadTop10Chart() {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR&page=1`)
        .then((res) => res.json())
        .then((data) => {
            const top10 = data.results.slice(0, 10);
            const chartList = document.getElementById("chart-list");
            chartList.innerHTML = "";

            top10.forEach((movie, index) => {
                const li = document.createElement("li");
                li.textContent = `${movie.title}`;
                chartList.appendChild(li);
            });
        })
        .catch((err) => console.error("Top10 차트 로딩 오류", err));
}

// 🔃 페이지 로드시 자동 실행
document.addEventListener("DOMContentLoaded", loadTop10Chart);
