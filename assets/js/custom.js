// Sticky header after scrolling
const header = document.querySelector(".header");
const stickyOffset = 150;

function toggleStickyHeader() {
  header.classList.toggle("sticky", window.scrollY > stickyOffset);
}

window.addEventListener("scroll", toggleStickyHeader);
toggleStickyHeader();

// Sounds player: track list + playback via Spotify iFrame API
const trackList = document.getElementById("trackList");
const playBtn = document.getElementById("audioPlay");
const seek = document.getElementById("seek");
const curTime = document.getElementById("curTime");
const durTime = document.getElementById("durTime");
const playerTitle = document.getElementById("playerTitle");
const spotifyLink = document.getElementById("spotifyLink");

// Playlist tracks (copied from the Spotify playlist; update here when the playlist changes)
const PLAYLIST_URL = "https://open.spotify.com/playlist/75UFhiUa7fq1dcrSttyfnQ";
const PLAYLIST_TRACKS = [
  { uri: "spotify:track:6ql3lKx9LyhjHgRZZ9OLlA", name: "A Girl Does", artists: "Mitch Rossell", duration_ms: 204058 },
  { uri: "spotify:track:33V8ZNvopdCm8BsEKzGXgM", name: "Ran into You", artists: "Mitch Rossell, Trisha Yearwood", duration_ms: 213470 },
  { uri: "spotify:track:1nggCj00NY7GRx0CyWcMKY", name: "All I Need to See", artists: "Mitch Rossell", duration_ms: 267518 },
  { uri: "spotify:track:2PoOVPahdBzzlX8B35XflM", name: "Then Again", artists: "Mitch Rossell", duration_ms: 205740 },
  { uri: "spotify:track:3OG2MwfPXYLvPMF4CK4Mo0", name: "2020", artists: "Mitch Rossell", duration_ms: 180652 },
  { uri: "spotify:track:4GoGjmCu0qSV7QjJ6QN3eP", name: "Me Being Me", artists: "Mitch Rossell", duration_ms: 248451 },
  { uri: "spotify:track:1SstqAiUas9m1iJ5VNMvkY", name: "Ask Me How I Know", artists: "Mitch Rossell", duration_ms: 232640 },
  { uri: "spotify:track:4tvWzVYvuXmYDIu3iwEn1W", name: "A Soldier's Memoir", artists: "Mitch Rossell", duration_ms: 221173 },
  { uri: "spotify:track:0Yr8Z6dNG8Z70XmOKm5oYj", name: "God, Girls, and Football", artists: "Mitch Rossell", duration_ms: 223440 },
  { uri: "spotify:track:3wVo7jOxJUNcs0QNSDAfYt", name: "God's Country", artists: "Mitch Rossell", duration_ms: 216428 },
  { uri: "spotify:track:3v5fGoeGDmeSUUHik0HTQs", name: "Highlight Reel", artists: "Mitch Rossell", duration_ms: 158625 },
  { uri: "spotify:track:2X35KQNr0y4siQS01S2o9H", name: "Raised by the Radio", artists: "Mitch Rossell", duration_ms: 224420 },
  { uri: "spotify:track:598CC6eAKKmDApi6fklrMw", name: "The Storm (Taylor's Song)", artists: "Mitch Rossell", duration_ms: 202616 },
  { uri: "spotify:track:2o7GRtLQ7k0oEYbVcUenue", name: "When Things Ain't Goin Right", artists: "Mitch Rossell", duration_ms: 216250 },
  { uri: "spotify:track:31n6Jm9kSCE1qvIfu3PGRW", name: "The Rain", artists: "Mitch Rossell", duration_ms: 243740 },
  { uri: "spotify:track:3T339ZG1BAiQpf6paDYsEs", name: "Seemed Like a Good Idea", artists: "Mitch Rossell", duration_ms: 200277 },
  { uri: "spotify:track:3arMa8U2OL8pJzERa8X9QS", name: "American Dream", artists: "Mitch Rossell", duration_ms: 228760 },
  { uri: "spotify:track:5Au91m84hp1C7kSCBmbX6t", name: "Any Girl", artists: "Mitch Rossell", duration_ms: 226456 },
  { uri: "spotify:track:1tyF2O7E5nqUDhqVQ7qeAW", name: "2 Weeks", artists: "Mitch Rossell", duration_ms: 231603 },
  { uri: "spotify:track:6thsoXw9sWTO8MeZQmzl3U", name: "Slow as I Could", artists: "Mitch Rossell", duration_ms: 211705 },
  { uri: "spotify:track:6mSzjBGN6MpEYzOOUs9Hl9", name: "Mine Was a Backroad", artists: "Mitch Rossell", duration_ms: 242430 },
  { uri: "spotify:track:4NuRdGu0nMjCV3nnLok4hi", name: "Hard Work Sucks", artists: "Mitch Rossell", duration_ms: 196514 }
];

let tracks = [];
let controller = null;
let iframeApi = null;
let currentIndex = 0;
let trackEnded = false;
let pendingIndex = null;

function formatTime(sec) {
  if (!isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function setFill(range) {
  const percent = ((range.value - range.min) / (range.max - range.min)) * 100;
  range.style.setProperty("--fill", percent + "%");
}

function renderTracks() {
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "track" + (index === currentIndex ? " active" : "");
    li.innerHTML =
      '<span class="track-play"></span>' +
      '<span class="track-name"></span>' +
      '<span class="track-time"></span>';
    const name = li.querySelector(".track-name");
    name.textContent = track.name + " ";
    const small = document.createElement("small");
    small.textContent = "- " + track.artists;
    name.appendChild(small);
    li.querySelector(".track-time").textContent = formatTime(track.duration_ms / 1000);
    li.addEventListener("click", () => playTrack(index));
    trackList.appendChild(li);
  });
}

function setActive(index) {
  currentIndex = index;
  trackList.querySelectorAll(".track").forEach((li, i) => li.classList.toggle("active", i === index));
  playerTitle.textContent = tracks[index].name;
  durTime.textContent = formatTime(tracks[index].duration_ms / 1000);
  curTime.textContent = "00:00";
  seek.value = 0;
  setFill(seek);
}

function playTrack(index) {
  // Clicking the current track toggles play / pause
  if (controller && index === currentIndex) {
    controller.togglePlay();
    return;
  }
  setActive(index);
  if (!controller) {
    pendingIndex = index; // play as soon as the Spotify player is ready
    return;
  }
  trackEnded = false;
  controller.loadUri(tracks[index].uri);
  controller.play();
}

function initController() {
  if (!iframeApi || !tracks.length || controller) return;
  iframeApi.createController(
    document.getElementById("spotifyEmbed"),
    { uri: tracks[0].uri, width: 300, height: 80 },
    (ctrl) => {
      controller = ctrl;
      if (pendingIndex !== null) {
        playTrack(pendingIndex);
        pendingIndex = null;
      }
      ctrl.addListener("playback_update", (e) => {
        const { isPaused, position, duration } = e.data;
        document.body.classList.toggle("is-playing", !isPaused);
        if (!isPaused) pauseBgMusic();
        trackList.querySelectorAll(".track").forEach((li, i) => {
          li.classList.toggle("playing", i === currentIndex && !isPaused);
        });
        curTime.textContent = formatTime(position / 1000);
        if (duration) {
          durTime.textContent = formatTime(duration / 1000);
          seek.value = (position / duration) * 100;
          setFill(seek);
          // Go to next track when this one ends
          if (position >= duration - 500 && !trackEnded) {
            trackEnded = true;
            if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1);
          }
        }
      });
    }
  );
}

// Define the callback first, then load Spotify's script (otherwise the callback can be missed)
window.onSpotifyIframeApiReady = (api) => {
  iframeApi = api;
  initController();
};

const spotifyScript = document.createElement("script");
spotifyScript.src = "https://open.spotify.com/embed/iframe-api/v1";
spotifyScript.async = true;
document.body.appendChild(spotifyScript);

playBtn.addEventListener("click", () => {
  if (controller) {
    controller.togglePlay();
  } else {
    pendingIndex = currentIndex;
  }
});

seek.addEventListener("input", () => setFill(seek));
seek.addEventListener("change", () => {
  if (!controller) return;
  const seconds = (seek.value / 100) * (tracks[currentIndex].duration_ms / 1000);
  controller.seek(seconds);
});

tracks = PLAYLIST_TRACKS;
spotifyLink.href = PLAYLIST_URL;
renderTracks();
setActive(0);
initController();

setFill(seek);

// Media slider
$("#mediaSlider").slick({
  centerMode: true,
  variableWidth: true,
  slidesToShow: 1,
  infinite: true,
  arrows: false,
  dots: false,
  speed: 600,
});

// Play the YouTube video inside the thumbnail (works on slick clones too)
$("#mediaSlider").on("click", ".video-btn", function () {
  const card = this.closest(".media-card");
  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube.com/embed/" + card.dataset.videoId + "?autoplay=1&rel=0";
  iframe.title = "YouTube video player";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  card.appendChild(iframe);
  card.classList.add("playing");
});

// Stop playing videos when the slide changes (remove the iframe, show the thumbnail again)
$("#mediaSlider").on("beforeChange", function () {
  $("#mediaSlider .media-card.playing").each(function () {
    $(this).removeClass("playing").find("iframe").remove();
  });
});

// Use the HD thumbnail when YouTube has one (otherwise keep the standard one)
$("#mediaSlider .media-card").each(function () {
  const id = this.dataset.videoId;
  const hd = new Image();
  hd.onload = function () {
    if (hd.naturalWidth > 120) {
      $('#mediaSlider .media-thumb[src*="' + id + '"]').attr("src", hd.src).addClass("hd");
    }
  };
  hd.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
});

// Shop slider
$("#shopSlider").slick({
  slidesToShow: 4,
  slidesToScroll: 1,
  infinite: true,
  dots: false,
  prevArrow: ".shop-prev",
  nextArrow: ".shop-next",
  responsive: [
    {
      breakpoint: 992, // Screens <= 1024px
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
      }
    },
    {
      breakpoint: 768,  // Screens <= 768px (Tablets)
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2
      }
    },
    {
      breakpoint: 480,  // Screens <= 480px (Mobile phones)
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1
      }
    }
  ]
});

// Video modal: play when opened, pause when closed
const videoModal = document.getElementById("videoModal");
const modalVideo = document.getElementById("modalVideo");

videoModal.addEventListener("shown.bs.modal", () => modalVideo.play());
videoModal.addEventListener("hidden.bs.modal", () => modalVideo.pause());

// Bento gallery: scrubbed Flip animation, middle tile grows to fill the screen
gsap.registerPlugin(ScrollTrigger, Flip);

const bentoGallery = document.getElementById("bentoGallery");
const bentoItems = bentoGallery.querySelectorAll(".bento-item");
let bentoCtx;

function createBentoTween() {
  if (bentoCtx) bentoCtx.revert();
  bentoGallery.classList.remove("bento-final");

  // Phones show a single image, so there is no animation
  if (window.matchMedia("(max-width: 768px)").matches) return;

  bentoCtx = gsap.context(() => {
    // Capture the final layout, then animate to it while scrolling
    bentoGallery.classList.add("bento-final");
    const state = Flip.getState(bentoItems);
    bentoGallery.classList.remove("bento-final");

    const flip = Flip.to(state, { simple: true, ease: "expoScale(1, 5)" });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: bentoGallery,
          start: "center center",
          end: "+=100%",
          scrub: true,
          pin: bentoGallery.parentNode
        }
      })
      .add(flip);

    return () => gsap.set(bentoItems, { clearProps: "all" });
  });
}

createBentoTween();
window.addEventListener("resize", createBentoTween);

// Preloader + AOS (animate content only once; not used on the bento gallery)
const preloader = document.getElementById("preloader");
let preloaderDone = false;

function hidePreloader() {
  if (preloaderDone) return;
  preloaderDone = true;
  preloader.classList.add("hide");
  document.body.classList.remove("is-loading");
  setTimeout(() => preloader.remove(), 700);
  AOS.init({ once: true, duration: 800, easing: "ease-out" });
  ScrollTrigger.refresh();
}

document.getElementById("preloaderSkip").addEventListener("click", hidePreloader);

window.addEventListener("load", () => {
  hidePreloader();
  ScrollTrigger.refresh();
  AOS.refresh();
});

// Hero background video: slow motion (1 = normal speed)
const heroVideo = document.querySelector(".hero-video");
const heroVideoSpeed = 0.5;

heroVideo.playbackRate = heroVideoSpeed;
heroVideo.addEventListener("loadedmetadata", () => {
  heroVideo.playbackRate = heroVideoSpeed;
});

// Background music: sticky speaker button plays "Son" through a hidden YouTube player
const musicFab = document.getElementById("musicFab");
const BG_MUSIC_ID = "edAgbWuw5yk"; // Mitch Rossell - Son
let bgPlayer = null;
let bgReady = false;
let bgPending = false;

let bgLoadingTimer = null;

function setBgLoading(on) {
  musicFab.classList.toggle("loading", on);
  clearTimeout(bgLoadingTimer);
  if (on) bgLoadingTimer = setTimeout(() => musicFab.classList.remove("loading"), 20000); // safety
}

function pauseBgMusic() {
  if (bgReady && bgPlayer.getPlayerState() === 1) bgPlayer.pauseVideo();
}

window.onYouTubeIframeAPIReady = () => {
  bgPlayer = new YT.Player("bgMusic", {
    width: 200,
    height: 200,
    videoId: BG_MUSIC_ID,
    playerVars: { playsinline: 1, rel: 0 },
    events: {
      onReady: () => {
        bgReady = true;
        if (bgPending) bgPlayer.playVideo();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) bgPlayer.playVideo(); // loop
        musicFab.classList.toggle("playing", e.data === YT.PlayerState.PLAYING);
        // Spinner while buffering, hide it once playing or paused
        if (e.data === YT.PlayerState.BUFFERING) {
          setBgLoading(true);
        } else if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) {
          setBgLoading(false);
        }
      }
    }
  });
};

const ytScript = document.createElement("script");
ytScript.src = "https://www.youtube.com/iframe_api";
ytScript.async = true;
document.body.appendChild(ytScript);

musicFab.addEventListener("click", () => {
  if (!bgReady) {
    bgPending = true; // start as soon as the player is ready
    setBgLoading(true);
    return;
  }
  if (bgPlayer.getPlayerState() === 1) {
    bgPlayer.pauseVideo();
  } else {
    if (controller) controller.pause(); // stop the Sounds player
    setBgLoading(true);
    bgPlayer.playVideo();
  }
});

// Close the menu drawer when the screen becomes wide (992px and up)
const drawerEl = document.getElementById("menuDrawer");

window.matchMedia("(min-width: 992px)").addEventListener("change", (e) => {
  if (e.matches) {
    const drawer = bootstrap.Offcanvas.getInstance(drawerEl);
    if (drawer) drawer.hide();
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
});
