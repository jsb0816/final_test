// ✅ TMDb API 설정
const API_KEY = "24b9dda7678c5412670e883aaac5c23f"; // TMDb API 키
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// ✅ DOM 요소 선택
const modal = document.getElementById("movie-modal");
const container = document.getElementById("movie-container");
const modalDetails = document.getElementById("modal-details");

// ✅ TMDb 인기 영화 로드
fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR`)
    .then((res) => res.json())
    .then((data) => {
        const movies = data.results;

        // overview가 없는 경우 영어로 다시 요청
        const fetchEnglishOverviews = movies.map(async (movie) => {
            if (!movie.overview) {
                const res = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=en-US`);
                const engData = await res.json();
                movie.overview = engData.overview || "No overview available.";
            }
            return movie;
        });

        Promise.all(fetchEnglishOverviews).then((completedMovies) => {
            displayMovies(completedMovies);
        });
    })
    .catch((error) => {
        console.log("TMDb 에러 발생", error);
    });

// ✅ TMDb 영화 카드 렌더링
function displayMovies(movies) {
    const title = document.createElement("h2");
    title.innerText = "🔥 실시간 인기 영화 (TMDb)";
    title.style.textAlign = "center";
    title.style.marginTop = "30px";
    container.before(title);

    container.innerHTML = "";
    movies.forEach(function (movie, index) {
        const card = document.createElement("div");
        card.className = "movie-card";

        card.innerHTML = `
            <img src="${IMG_URL + movie.poster_path}" alt='${movie.title}'/>
            <h3>${index + 1}위. ${movie.title}</h3>
            <p>평점: ${movie.vote_average}</p>
            <p>${movie.overview.substring(0, 80)}...</p>
        `;
        container.appendChild(card);

        card.addEventListener("click", () => {
            showMovieModal(movie.id);
        });
    });
}

// ✅ TMDb 상세 정보 모달
function showMovieModal(movieId) {
    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ko-KR`)
        .then((res) => res.json())
        .then((movie) => {
            if (!movie.overview) {
                fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`)
                    .then((res) => res.json())
                    .then((engMovie) => {
                        movie.overview = engMovie.overview || "No overview available.";
                        showModalContent(movie);
                    })
                    .catch((err) => {
                        console.error("영어 개요 로딩 실패", err);
                        movie.overview = "개요 정보를 불러올 수 없습니다.";
                        showModalContent(movie);
                    });
            } else {
                showModalContent(movie);
            }
        })
        .catch((error) => console.error("상세 정보 로드 에러", error));
}

// ✅ 모달 내용 렌더링
function showModalContent(movie) {
    modalDetails.innerHTML = `
        <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" />
        <h2>${movie.title}</h2>
        <p><strong>개봉일:</strong> ${movie.release_date}</p>
        <p><strong>평점:</strong> ${movie.vote_average}</p>
        <p>${movie.overview}</p>
    `;
    modal.classList.remove("hidden");
}

// ✅ 모달 닫기
document.querySelector(".close-btn").addEventListener("click", () => {
    modal.classList.add("hidden");
});

// ✅ 검색 버튼 클릭 이벤트
document.getElementById("search-btn").addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
        searchMovies(query);
    }
});

// ✅ 엔터 키로도 검색 가능
document.getElementById("search-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const query = event.target.value.trim();
        if (query) {
            searchMovies(query);
        }
    }
});

// ✅ 영화 검색 함수
function searchMovies(query) {
    fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.results.length > 0) {
                displayMovies(data.results);
            } else {
                alert("검색 결과가 없습니다!");
            }
        })
        .catch((error) => {
            console.error("검색 오류", error);
        });
}

////////////////////////////////////////
// ✅ KOBIS 오픈 API 연동 시작
////////////////////////////////////////

// ✅ KOBIS API 래퍼 클래스 정의
function KobisOpenAPIRestService(key, host) {
    this.key = key;
    this.host = host ? host : "https://www.kobis.or.kr";
    this.DAILY_BOXOFFICE_URI = "/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList";
}
KobisOpenAPIRestService.prototype.requestGet = function (key, host, serviceURI, isJson, paramMap) {
    const urlStr = host + serviceURI + (isJson ? ".json" : ".xml");
    let retVal = null;
    $.extend(paramMap, { key: this.key });
    $.ajax({
        type: "get",
        url: urlStr,
        data: paramMap,
        success: function (responseData) {
            retVal = responseData;
        },
        error: function (jqXHR, textStatus, err) {
            console.error("KOBIS API 오류", jqXHR.responseText);
        },
        dataType: isJson ? "json" : "xml",
        async: false
    });
    return retVal;
};
KobisOpenAPIRestService.prototype.getDailyBoxOffice = function (isJson, paramMap) {
    return this.requestGet(this.key, this.host, this.DAILY_BOXOFFICE_URI, isJson, paramMap);
};

// ✅ 박스오피스 정보 표시 함수
function displayKobisBoxOffice() {
    const kobis = new KobisOpenAPIRestService("24b9dda7678c5412670e883aaac5c23f");

    // 어제 날짜 (당일 데이터는 없기 때문에 -1일 처리)
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const data = kobis.getDailyBoxOffice(true, { targetDt: dateStr });
    const list = data.boxOfficeResult.dailyBoxOfficeList;

    const boxOfficeSection = document.createElement("div");
    boxOfficeSection.innerHTML = `<h2 style="text-align:center; margin-top:30px;">🎬 KOBIS 박스오피스 Top 10</h2>`;
    boxOfficeSection.style.display = "flex";
    boxOfficeSection.style.flexWrap = "wrap";
    boxOfficeSection.style.justifyContent = "center";

    list.forEach((movie, index) => {
        const box = document.createElement("div");
        box.className = "movie-card";
        box.innerHTML = `
            <h3>${index + 1}위. ${movie.movieNm}</h3>
            <p>개봉일: ${movie.openDt}</p>
            <p>누적 관객수: ${Number(movie.audiAcc).toLocaleString()}명</p>
        `;
        boxOfficeSection.appendChild(box);
    });

    const container = document.getElementById("movie-container");
    container.parentElement.insertBefore(boxOfficeSection, container);
}

// ✅ 페이지 로딩 시 KOBIS 순위도 출력
displayKobisBoxOffice();
