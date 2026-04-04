const containerId = 'stream-player';
const container = document.getElementById(containerId);
const tabs = {
    flukeTTV: document.getElementById('tab-flukeTTV'),
    flukeYT: document.getElementById('tab-flukeYT'),
};

let twitchPlayer = null;

function loadTwitch() {
    container.innerHTML = ''; // clear YouTube iframe if present

    var options = {
        autoplay: false,
        muted: true,
        channel: 'flukegamingttv'
    };

    var twitchPlayer = new Twitch.Player(container, options);
    twitchPlayer.setVolume(0.5);
}

function loadYouTube() {
  // Twitch embed doesn't have a clean destroy API, so wipe DOM
  container.innerHTML = `
    <iframe
      src="const youtubeSrc =
  "https://www.youtube.com/embed/live_stream?channel=UCewiYYWHvvmSqnxq5U9TNZg";"
      allowfullscreen>
    </iframe>
  `;
  twitchPlayer = null;
}

function setActive(active) {
    Object.entries(tabs).forEach(([key, element]) => {
        element.setAttribute('aria-selected', key === active);
    });

    if (active === 'flukeTTV') loadTwitch();
    if (active === 'flukeYT') loadYouTube();
}

tabs.flukeTTV.onclick = () => setActive('flukeTTV');
tabs.flukeYT.onclick = () => setActive('flukeYT');

// default
setActive('flukeTTV');