// helper functions
function formatHour(date) {
  let hour = date.getHours();
  const ampm = hour >= 12 ? 'pm' : 'am';

  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return { hour, ampm };
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const MAX_EVENTS = 3;

// call schedule worker & display agenda
async function loadEvents() {
  const gameIcons = {
    mtg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 86">
            <path d="M23.8 17.7c-2 17.9-2.4 19.5-4.7 19.1-1.9-.4-3.8-9.8-4-19.7-.1-3.5-.3-6.2-.5-6-.3.3-1 4.5-1.6 9.4-1.6 12.8-2.9 18.3-4.6 18.9-1.9.7-3.1-2.5-4.6-12.3l-1.2-7.6-.7 8C1.5 31.9.9 37.6.6 40.1c-.5 4.6-.4 4.7 3.3 6.4 5.2 2.3 12.4 9.8 15.6 16.4 1.5 2.9 3.5 9.2 4.4 13.9l1.8 8.5.6-6c1.4-13.3 7.8-24.5 17.5-30.8l6.2-4-.6-10c-.8-13-1.9-15.9-2.7-7.4-.7 7-2.4 12.9-3.8 12.9-.4 0-1.2-.8-1.8-1.8-1.1-2-4.1-19.1-4.2-24.1-.1-2-.7 1.3-1.4 7.3-1.8 14.2-2.2 15.8-4.2 15.4-2.2-.4-3-4.6-4.6-21.8L25.5 1.6l-1.7 16.1z"/>
          </svg>`,
    wow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path d="m10.992 11.219.711 2.398 4.766 21.203L16 37.227h6.914l-.477-2.32 1.57-5.953 1.891 6.031-.672 2.242 7.789.016-.957-2.543 3.58-20.532 1.392-2.953-6.78.004.393 2.386-2.646 15.083-4.121-15.906-3.938 15.625-3.312-14.875.374-2.313z"/>
            <path d="M24 1.157c-12.593 0-22.812 10.233-22.812 22.844S11.407 46.844 24 46.844c12.594 0 22.812-10.233 22.812-22.844S36.594 1.157 24 1.157zm-.094 3.937c10.329 0 18.688 8.379 18.688 18.75s-8.359 18.781-18.688 18.781-18.719-8.41-18.719-18.781c.001-10.371 8.39-18.75 18.719-18.75z"/>
          </svg>`,
    rust:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="none" d="M48 0H0v48h48V0Z"/>
              <path d="M15.721 21.642 5.52 19.969v10.169l10.202-1.673v-6.823ZM20.839 21.642h-3.412v6.79h3.412v-6.79ZM28.465 15.721 30.138 5.52H19.969l1.672 10.202h6.824ZM28.432 17.427h-6.79v3.412h6.79v-3.412ZM25.053 22.642l-2.413 2.412 2.413 2.413 2.412-2.413-2.412-2.412ZM29.269 34.052l5.987 8.429 7.225-7.225-8.43-5.988-4.782 4.784ZM30.455 25.662l-4.801 4.801 2.412 2.413 4.802-4.802-2.413-2.412Z"/>
            </svg>`,
    pokemon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M450.46 256.09c-1.11-80.92-50.65-153.38-126.46-182.3-76.41-29.12-166.51-4.79-218.18 58.34C54.4 195 46.61 285.58 88.49 355.68c41.8 69.95 123.74 106 203.55 91.63 91-16.37 156.14-98.12 158.35-189.14a20 20 0 0 0 .07-2.08m-331.41-81.71C152.76 118 220.23 87 285 99.43c69.4 13.29 120.43 70.47 128.83 139h-95.42c-8.26-27.36-32-48-62.62-48-29.65 0-55.15 20.65-63.11 48H97.74a158 158 0 0 1 21.31-64.05m167.08 81.72c-2 38.75-60.67 39.4-60.67 0s58.71-38.77 60.67 0m24 149.79c-63.28 22.69-135.13 2.85-177.83-49.07a157.53 157.53 0 0 1-34.57-83h94.87c7.91 27.39 33.7 48 63.19 48 30.67 0 54.36-20.68 62.62-48h95.45c-7.25 59.18-46.32 111.5-103.72 132.07Z"/>
              </svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88">
                <path fill-rule="evenodd" d="M81.61 4.73c0-2.61 2.58-4.73 5.77-4.73s5.77 2.12 5.77 4.73v20.72c0 2.61-2.58 4.73-5.77 4.73s-5.77-2.12-5.77-4.73V4.73zm-52 0c0-2.61 2.58-4.73 5.77-4.73s5.77 2.12 5.77 4.73v20.72c0 2.61-2.58 4.73-5.77 4.73s-5.77-2.12-5.77-4.73V4.73zM6.4 45.32h110.08V21.47c0-.8-.33-1.53-.86-2.07-.53-.53-1.26-.86-2.07-.86H103c-1.77 0-3.2-1.43-3.2-3.2 0-1.77 1.43-3.2 3.2-3.2h10.55c2.57 0 4.9 1.05 6.59 2.74a9.297 9.297 0 0 1 2.74 6.59v92.09c0 2.57-1.05 4.9-2.74 6.59a9.297 9.297 0 0 1-6.59 2.74H9.33c-2.57 0-4.9-1.05-6.59-2.74a9.339 9.339 0 0 1-2.74-6.6V21.47c0-2.57 1.05-4.9 2.74-6.59a9.297 9.297 0 0 1 6.59-2.74H20.6c1.77 0 3.2 1.43 3.2 3.2 0 1.77-1.43 3.2-3.2 3.2H9.33c-.8 0-1.53.33-2.07.86-.53.53-.86 1.26-.86 2.07v23.85zm110.08 6.41H6.4v61.82c0 .8.33 1.53.86 2.07.53.53 1.26.86 2.07.86h104.22c.8 0 1.53-.33 2.07-.86.53-.53.86-1.26.86-2.07V51.73zM50.43 18.54c-1.77 0-3.2-1.43-3.2-3.2 0-1.77 1.43-3.2 3.2-3.2h21.49c1.77 0 3.2 1.43 3.2 3.2 0 1.77-1.43 3.2-3.2 3.2H50.43z"/>
              </svg>`
  };

  try {
    let events;

    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      events = [
        {
          title: "Friday Night Magic",
          start: "2026-02-27T17:00:00-07:00",
          end: "2026-02-27T21:00:00-07:00",
          description: "Virtual MTG hosted on <a href=\"https://spelltable.com\" target=\"_blank\">Spelltable</a> or <a href=\"https://www.tabletopsimulator.com\" target=\"_blank\">Tabletop Simulator</a>"
        },
        {
          title: "Weekend Rust Wipe",
          start: "2026-03-05",
          end: "2026-03-09",
          description: "Selecting a community server together with increased farm"
        },
        {
          title: "PokeMonday Adventures",
          start: "2026-03-18T18:00:00-06:00",
          end: "2026-03-18T21:00:00-06:00",
          description: "Nostalgia-free PokéOne playthrough and <a href=\"https://www.twitch.tv/flukegamingttv\" target=\"_blank\"><u>streaming</u></a>"
        }
      ];
    } else {
      const res = await fetch('https://google-calendar.flukegaming57.workers.dev');
      events = await res.json();
    }

    const container = document.getElementById('calendar');
    if (!container) return;
    container.innerHTML = '';

    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };

    const limitedEvents = MAX_EVENTS
      ? events.slice(0, MAX_EVENTS)
      : events;

    limitedEvents.forEach(event => {
      const isAllDay = !event.start.includes('T');
      const startDate = isAllDay
        ? parseLocalDate(event.start)
        : new Date(event.start);
      const endDate = event.end
        ? (isAllDay ? parseLocalDate(event.end) : new Date(event.end))
        : null;

      const description = event.description
        .replaceAll('&nbsp;', ' ')
        .replaceAll(/\u00A0/g, ' ')
        .replaceAll('<u>', '')
        .replaceAll('</u>', '');

      const game = event.title.toLowerCase().includes('magic') ? 'mtg'
        : event.title.toLowerCase().includes('raiding') ? 'wow'
        : event.title.toLowerCase().includes('rust') ? 'rust'
        : event.title.toLowerCase().includes('pokemon') ? 'pokemon'
        : 'default';

      let displayDate;

      if (isAllDay) {
        const startStr = startDate.toLocaleDateString(undefined, dateOptions);

        let endStr = null;

        if (endDate) {
          const correctedEnd = new Date(endDate);
          correctedEnd.setDate(correctedEnd.getDate() - 1);

          endStr = correctedEnd.toLocaleDateString(undefined, dateOptions);
        }

        displayDate = endStr && startStr !== endStr
          ? `${startStr} - <span class="card__text--date-break">${endStr}</span>`
          : startStr;

      } else {
        const startStr = startDate.toLocaleDateString(undefined, dateOptions);

        if (endDate) {
          const startTime = formatHour(startDate);
          const endTime = formatHour(endDate);

          if (startTime.ampm === endTime.ampm) {
            displayDate = `${startStr}<span class="card__text--date-join"></span>${startTime.hour} - ${endTime.hour} ${endTime.ampm}`;
          } else {
            displayDate = `${startStr}<span class="card__text--date-join"></span>${startTime.hour} ${startTime.ampm} - ${endTime.hour} ${endTime.ampm}`;
          }
        } else {
          const startTime = formatHour(startDate);
          displayDate = `${startStr} ${startTime.hour} ${startTime.ampm}`;
        }
      }

      const div = document.createElement('article');
      div.className = 'grid card grid__event';

      div.innerHTML = `
        <div class="card__icon card__icon--event">${gameIcons[game]}</div>
        <h3 class="card__title--event">${event.title}</h3>
        <p class="card__text card__text--event">${description || ''}</p>
        <p class="card__text card__text--date">${displayDate}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error('Error loading events:', err);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', loadEvents);

// Normalize all event description links to target _blank
const eventDescriptions = document.querySelectorAll('.card__text--event');
eventDescriptions.forEach(description => {
  description.querySelectorAll('a').forEach(a => {
    a.target = '_blank';
  });
});