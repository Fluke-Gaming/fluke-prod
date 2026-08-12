const containerId = 'stream-player';
const container = document.getElementById(containerId);
const tabs = {
    flukeTTV: document.getElementById('tab-flukeTTV'),
    flukeYT: document.getElementById('tab-flukeYT'),
};

let twitchPlayer = null;

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-CA', {
        month: 'short', day: 'numeric'
    });
}

// ---------- TWITCH STREAM ----------

async function isTwitchLive(url) {
    try {
        const res = await fetch(`${url}/stream-status`);
        const data = await res.json();

        return data.live;
    } catch (err) {
        console.error('TTV Live check failed:', err);
        return false;
    }
}

async function getTwitchChannelInfo(url) {
    try {
        const res = await fetch(`${url}/channel-info`);
        const data = await res.json();

        return data;
    } catch (err) {
        console.error('TTV channel info failed:', err);
        return null;
    }
}

async function showTwitchOffline(url) {
    const channelInfo = await getTwitchChannelInfo(url);
    const offlineBanner = channelInfo.offline_image;

    offlineHtml = `
        <a class="grid" href="https://www.twitch.tv/flukegamingttv" target="_blank">
            <img class="card__thumb--thumb" src="${offlineBanner}" />
        </a>
    `;
    return offlineHtml;
}

async function loadTwitch() {
    container.innerHTML = ''; // clear YouTube iframe if present
    const url = 'https://twitch-helix.flukegaming57.workers.dev';

    const isLive = await isTwitchLive(url);

    if (isLive) {
        var options = {
            autoplay: false,
            muted: true,
            channel: 'flukegamingttv'
        };

        var twitchPlayer = new Twitch.Player(container, options);
        twitchPlayer.setVolume(0.5);

    } else {
        const twitchOffline = await showTwitchOffline(url);
        container.innerHTML = twitchOffline;
    }

}

// ---------- YOUTUBE STREAM ----------

async function isYouTubeLive(channelId, apiKey) {
    const base = 'https://www.googleapis.com/youtube/v3';
    try {
        const res = await fetch(
            `${base}/search?part=snippet&channelId=${channelId}` +
            `&eventType=live&type=video&key=${apiKey}`
        );
        const data = await res.json();
        return (data.items && data.items.length > 0)
            ? data.items[0].id.videoId     // truthy string if live
            : null;                        // null if offline
    } catch (err) {
        console.error('YT Live check failed:', err);
        return null;
    }
}

async function getYouTubeVideos(channelId, apiKey) {
    const base = 'https://www.googleapis.com/youtube/v3';

    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        return [
            {
                id: { videoId: "iT5A3RgkMwk" },
                snippet: {
                    title: "PokeOne Adventures",
                    thumbnails: { medium: { url: "https://i.ytimg.com/vi/iT5A3RgkMwk/mqdefault.jpg" } },
                    publishedAt: "2026-06-02T03:31:44Z"
                }
            },
            {
                id: { videoId: "T68lC9wbRr0" },
                snippet: {
                    title: "PokeOne Hangouts",
                    thumbnails: { medium: { url: "https://i.ytimg.com/vi/T68lC9wbRr0/mqdefault.jpg" } },
                    publishedAt: "2026-06-01T03:17:41Z"
                }
            }
        ];
    } else {
        try {
            const res = await fetch(
                `${base}/search?part=snippet&channelId=${channelId}` +
                `&order=date&type=video&maxResults=2&key=${apiKey}`
            );
            const data = await res.json();
            return (data.items && data.items.length > 0)
                ? data.items : null;
        } catch (err) {
            console.error('YT Video check failed:', err);
            return null;
        }
    }    
}

function showYouTubeVideos(videos) {
    videoHtml = videos.map(v => {
        const id = v.id.videoId;
        const title = v.snippet.title;
        const thumb = v.snippet.thumbnails.medium.url;
        const date = formatDate(v.snippet.publishedAt);

        return `
            <a class="grid card__thumb" href="https://www.youtube.com/watch?v=${id}"
                target="_blank" rel="noopener noreferrer" aria-label="${title}">
                <img class="card__thumb--thumb" loading="lazy"
                    src="${thumb}" alt="${title}">
                <div class="grid card__thumb--info">
                    <h4 class="card__thumb--title">${title}</h4>
                    <h4 class="card__thumb--date">${date}</h4>
                </div>
            </a>
        `;
    }).join('');

    html = `<div class="grid grid--tight grid--2">${videoHtml}<div>`;
    return html;
}

async function loadYouTube() {
    const API_KEY = 'AIzaSyBLAdU6OWt4djsbPXZGITUlkl6FYePXZ-w';
    const CHANNEL_ID = 'UCewiYYWHvvmSqnxq5U9TNZg';

    const videoId = await isYouTubeLive(CHANNEL_ID, API_KEY);
    console.log(videoId);

    if (videoId) {
        container.innerHTML = `
            <iframe frameborder="0" modestbranding="1" allowfullscreen
                allow="autoplay; encrypted-media"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1">
            </iframe>
        `;
    } else {
        const ytVideos = await getYouTubeVideos(CHANNEL_ID, API_KEY);
        if (ytVideos) {
            videoData = showYouTubeVideos(ytVideos);
            container.innerHTML = `
                <h2 class="section__subheader">Latest Videos</h2>${videoData}
            `;
        } else {
            container.innerHTML = `
                <h2 class="section__subheader">Could not load channel info.</h2>
            `;
        }

    }

    twitchPlayer = null;
}

// ---------- STREAM SELECTOR ----------

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