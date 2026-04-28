async function loadRaiderIO() {
  const element = document.getElementById('fluke-raiderio');

  const GUILD = 'Fluke';
  const REALM = 'frostmane';
  const REGION = 'us';
  const FIELDS = 'guild_name,realm,region,raid_progression,raid_rankings';
  const URL = `https://raider.io/api/v1/guilds/profile?region=${REGION}&realm=${REALM}&name=${encodeURIComponent(GUILD)}&fields=${FIELDS}`;

  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (d.statusCode) throw new Error(d.message || 'Guild not found');

    const prog = d.raid_progression || {};
    const ranks = d.raid_rankings || {};
    const tiers = Object.entries(prog).slice(0, 3);

    const stats = tiers.map(([key, r]) => {
      const total = r.total_bosses;
      const hKills = r.heroic_bosses_killed;
      const nKills = r.normal_bosses_killed;
      const tierRanks = ranks[key] || null;
      const realmRank = tierRanks?.heroic?.realm ?? '—';
      const worldRank = tierRanks?.heroic?.world ?? '—';

      return `
                    <div class="card__stats">
                      <h4>Raid Progression</h4>
                      <p class="card__text"><span class="u-emphasis">${nKills}/${total}</span> Normal</p>
                      <p class="card__text"><span class="u-emphasis">${hKills}/${total}</span> Heroic</p>
                    </div>
                    <div class="card__stats">
                      <h4>Heroic Ranking</h4>
                      <p class="card__text"><span class="u-emphasis">#${realmRank}</span> Realm</p>
                      <p class="card__text"><span class="u-emphasis">#${worldRank}</span> World</p>
                    </div>
                    <p class="card__text--footnote">Data via Raider.IO</p>`;
    }).join('');

    element.innerHTML = stats;

  } catch (err) {
    grid.innerHTML = `<div class="error">Could not load guild data: ${err.message}</div>`;
  }
}

async function loadWCLRankings() {
  const element = document.getElementById('fluke-warcraftlogs');

  const WORKER_URL = 'https://warcraft-logs.flukegaming57.workers.dev';

  try {
    const res = await fetch(WORKER_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (d.error) throw new Error(d.error);

    const colorClass = (color) => `wcl-rank--${color}`;

    element.innerHTML = `
        <div class="card__stats">
            <h4>Progress Ranking</h4>
            <div class="grid grid--3">
                <p class="card__text">
                    <span class="u-emphasis ${colorClass(d.progress.server?.color)}">#${d.progress.server?.number ?? '—'}</span>
                    Realm
                </p>
                <p class="card__text">
                    <span class="u-emphasis ${colorClass(d.progress.region?.color)}">#${d.progress.region?.number ?? '—'}</span>
                    Region
                </p>
                <p class="card__text">
                    <span class="u-emphasis ${colorClass(d.progress.world?.color)}">#${d.progress.world?.number ?? '—'}</span>
                    World
                </p>
            </div>
        </div>
        <div class="card__stats">
            <h4>Speed Ranking</h4>
            <div class="grid grid--2">
                <p class="card__text">
                    <span class="u-emphasis ${colorClass(d.speed.server?.color)}">#${d.speed.server?.number ?? '—'}</span>
                    Realm
                </p>
                <p class="card__text">
                    <span class="u-emphasis ${colorClass(d.speed.world?.color)}">#${d.speed.world?.number ?? '—'}</span>
                    World
                </p>
            </div>
        </div>
        <p class="card__text--footnote">Data via Warcraft Logs</p>
    `;

  } catch (err) {
    element.innerHTML = `<p class="card__text">Could not load Warcraft Logs data: ${err.message}</p>
            <p class="card__text">Click this tile to visit WCL directly.</p>`;
  }
}

async function loadWCLLastRaid() {
  const element = document.getElementById('fluke-warcraftlogs');
  const WORKER_URL = 'https://warcraft-logs.flukegaming57.workers.dev/lastraid';

  try {
    let raidData;

    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      raidData = {
        code:       "baJPx6BmTt9Hq3Fw",
        title:      "Voidspire (H)",
        date:       "April 1",
        duration:   "3h 06m",
        kills:      4,
        total:      5,
        totalWipes: 18,
        bosses: [
          { name: "Imperator Averzian",         kill: true,  bestPull: null },
          { name: "Vorasius",                   kill: true,  bestPull: null },
          { name: "Fallen-King Salhadaar",      kill: true,  bestPull: null },
          { name: "Vaelgor & Ezzorak",          kill: false, bestPull: 1   },
          { name: "Chimaerus, the Undreamt God", kill: true,  bestPull: null },
        ]
      };

    } else {
      const res = await fetch(WORKER_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      raidData = await res.json();
      if (raidData.error) throw new Error(raidData.error);
    }

    const bossPills = raidData.bosses.map(b => {
      const label = b.kill
        ? `✓ ${b.name}`
        : b.bestPull !== null
          ? `✗ ${b.name} (${b.bestPull}%)`
          : `✗ ${b.name}`;
      const cls = b.kill ? 'boss-pill--kill' : 'boss-pill--wipe';
      return `<span class="boss-pill ${cls}">${label}</span>`;
    }).join('');

    element.innerHTML = `
      <div class="card__stats">
        <h4>Last Raid: ${raidData.date}</h4>
        <p class="card__text"><span class="u-emphasis">${raidData.kills}</span> Kills (H)</p>
        <p class="card__text"><span class="u-emphasis">${raidData.totalWipes}</span> Wipes (H)</p>
      </div>
      <div class="boss-pill-row">${bossPills}</div>
      <p class="card__text--footnote">Data via Warcraft Logs</p>
    `;

  } catch (err) {
    element.innerHTML = `
      <p class="card__text">Could not load Warcraft Logs data: ${err.message}</p>
      <p class="card__text">Click this tile to visit WCL directly.</p>
    `;
  }
}

loadWCLLastRaid();

loadRaiderIO();