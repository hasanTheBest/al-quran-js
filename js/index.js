const API_URL = "https://api.alquran.cloud/v1/surah/";
let playerInstances = 0,
  player;

// ========== Player Class ==============
class Player {
  constructor(playlist) {
    this.playlist = playlist;
    this.index = 0;
  }

  // 1. Play Method
  play(id, stop) {
    const index = typeof id === "number" ? id : this.index;
    let audio;

    // if the file already added
    const sound = this.playlist[index];
    if (sound.listen) {
      audio = sound.listen;
    } else {
      audio = sound.listen = new Howl({
        src: sound.src,
        html5: true,
        onload: () => {
          select(".operation_btn-loading").classList.remove("d-none");
        },
        onplay: () => {
          select(".operation_btn-loading").classList.add("d-none");
          select(".operation_btn-pause").classList.remove("d-none");
          select(".operation_btn-play").classList.add("d-none");

          // hight playing ayah
          select(".list-ayahs").children[this.index].classList.add("bg-light");
          select(".playlist_tracks-listItem").children[
            this.index
          ].classList.add("active");

          // show pause button on specific ayah
          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-play_arrow`
          ).classList.add("d-none");
          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-pause`
          ).classList.remove("d-none");
        },
        onpause: () => {
          select(".operation_btn-pause").classList.add("d-none");
          select(".operation_btn-play").classList.remove("d-none");

          // show pause button on specific ayah
          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-play_arrow`
          ).classList.remove("d-none");

          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-pause`
          ).classList.add("d-none");
        },
        onend: () => {
          // show pause button on specific ayah
          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-play_arrow`
          ).classList.remove("d-none");

          select(
            `.list-ayahs li:nth-child(${this.index + 1}) .ayah-pause`
          ).classList.add("d-none");

          // remove highlighting bg
          select(".list-ayahs").children[this.index].classList.remove(
            "bg-light"
          );
          select(".playlist_tracks-listItem").children[
            this.index
          ].classList.remove("active");

          // there is no specific ayah stop
          !stop && this.skip("next");
        },
      });
    }

    // begin playing audio
    audio.play();

    // Show the pause button.
    if (audio.state() === "loaded") {
      select(".operation_btn-loading").classList.add("d-none");
    }

    // set currently playing index
    this.index = index;
  }

  // 2. skip Method
  skip(direction) {
    if (direction === "prev") {
      let index = this.index - 1;

      // first track
      if (index < 0) {
        index = this.playlist.length - 1;
      }

      this.skipTo(index);
    } else {
      let index = this.index + 1;

      // last track
      if (index >= this.playlist.length) {
        index = 0;
      }

      this.skipTo(index);
    }
  }

  // 3. skipTo Method
  skipTo(id, stop = false) {
    const currentPlaying = this.playlist[this.index].listen;

    if (currentPlaying) {
      currentPlaying.stop();

      // remove highlighting bg of ayah
      select(".list-ayahs").children[this.index].classList.remove("bg-light");
      select(".playlist_tracks-listItem").children[this.index].classList.remove(
        "active"
      );

      // stop specific ayah
      select(
        `.list-ayahs li:nth-child(${this.index + 1}) .ayah-pause`
      ).classList.add("d-none");

      select(
        `.list-ayahs li:nth-child(${this.index + 1}) .ayah-play_arrow`
      ).classList.remove("d-none");
    }

    // goto scroll
    scrollToElement(id);

    this.play(id, stop);
  }

  // 4. pause Method
  pause() {
    this.playlist[this.index].listen.pause();
  }

  // 5. stop method
  stop() {
    // stop current playing audio
    const current = this.playlist[this.index].listen;
    current && current.stop();
    select(".operation_btn-loading").classList.add("d-none");
    select(".operation_btn-pause").classList.add("d-none");
    select(".operation_btn-play").classList.remove("d-none");
  }
}

// =========== Event listener ============
document.addEventListener("DOMContentLoaded", () => {
  // set index
  displaySuraIndex(suraList);

  // display translation list
  displayTranslation(translationList);

  // display reciter list
  displayReciterList(reciterList);

  // load sura
  loadSura(1);
});

// ========== Displaying Index of sura, translation and recitation ===========
// Display sura Index
function displaySuraIndex(suraList) {
  const options = suraList
    .map(
      ({ englishName, number, name }, i) =>
        `<option class="h6" value="${number}" ${
          i === 0 ? "selected" : ""
        }>${number}. ${englishName} - ${name}</option>`
    )
    .join("");

  setValue(".select_sura-index", options);
}

// Display translation list
function displayTranslation(translations) {
  const transObj = translations
    .filter((item) => item.format !== "audio")
    .reduce((prev, current) => {
      if (!prev[current.language]) {
        prev[current.language] = [current];
      } else {
        prev[current.language] = [...prev[current.language], current];
      }

      return prev;
    }, {});

  const trans = Object.entries(transObj).map(([key, value], i) => {
    const options = value.map(
      ({ identifier, name, englishName, direction }) =>
        `<option value="${identifier}" ${
          i === 0 ? "selected" : ""
        }>${name} - ${englishName} ${
          direction === "rtl" ? "(" + direction + ")" : ""
        } </option>`
    );

    let languageNameEn = new Intl.DisplayNames(["en"], { type: "language" });
    let languageNameNative = new Intl.DisplayNames([key], {
      type: "language",
    });

    return `<optgroup label="${
      languageNameNative.of(key) + " - " + languageNameEn.of(key)
    }">${options}</optgroup>`;
  });

  setValue(".select_sura-translations", trans.join(""));
}

// Display reciter list
function displayReciterList(reciters) {
  select(".select_sura-recitation").innerHTML = reciters
    .map(({ identifier, name, englishName }) => {
      return `<option value="${identifier}" ${
        identifier === "ar.alafasy" && "selected"
      }>${englishName} - ${name}</option>`;
    })
    .join("");
}

// ========== Change Sura, Translation and recitation ===========
// change sura
select(".select_sura-index").addEventListener("change", (e) => {
  const { value } = e.target;

  // load sura
  loadSura(value);

  // hide audio bar
  select(".player_controls").classList.add("d-none");
});

// change translation
select(".select_sura-translations").addEventListener("change", (e) => {
  const { value } = e.target;

  // load sura
  loadTranslation(value);
});

// change recitation
select(".select_sura-recitation").addEventListener("change", (e) => {
  const { value } = e.target;

  // load sura
  loadAudios(select(".sura_number-en")["textContent"], value);

  // display audio control bar
  select(".player_controls").classList.remove("d-none");
  select(".operation_btn-loading").classList.remove("d-none");
});

// =========== Loading Sura, translation and Recitation ============
// load sura
async function loadSura(id) {
  // need to fetch new recitation
  playerInstances = 0;
  player && player.stop();

  const data = await fetchData(id);
  displaySura(data[0]);

  /*   // offline testing
  displaySura(sura114[0]); */
}

// load translation
async function loadTranslation(identifier) {
  const sura = select(".sura_number-en").textContent;

  const data = await fetchData(sura, identifier);
  displaySuraTranslation(data.ayahs, identifier, data.edition.direction);

  // offline testing purposes
  // displaySuraTranslation(transList, identifier.split(".")[0]);
}

// loading audio file
async function loadAudios(suraID, reciter = "ar.alafasy") {
  const url = `https://api.alquran.cloud/v1/surah/${suraID}/${reciter}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    // construct palylist
    data.status === "OK" && constructPlaylist(data.data);
  } catch (err) {
    console.error(err);
  }
}

// fetch data
async function fetchData(id, identifier = "editions/quran-uthmani") {
  const url = id.toString().includes(":")
    ? API_URL.replace("surah", "ayah")
    : API_URL;

  try {
    const resPromise = await fetch(url + id + "/" + identifier);
    let res = await resPromise.json();

    if (res.code === 200 && res.status === "OK") {
      return res.data;
    }
  } catch (err) {
    return err.message;
  }
}

// Display sura
function displaySura(sura) {
  // display sura info
  const {
    number,
    name,
    englishName,
    englishNameTranslation,
    revelationType,
    numberOfAyahs,
  } = sura;

  // adding options to goto ayah select element
  addAyahNoOptions(numberOfAyahs);

  shouldDisplayBismillah(number);

  displaySuraInfo({
    number,
    name,
    englishName,
    englishNameTranslation,
    revelationType,
    numberOfAyahs,
  });

  // add options to goto ayahs select
  function addAyahNoOptions(count) {
    const ayahs = new Array(count).fill(0).map((_, i) => i + 1);
    const content = ayahs
      .map((ayah, i) => `<option ${i === 0 && "selected"}>${ayah}</option>`)
      .join(" ");
    setValue(".sura_nav-gotoAyah", content);
  }

  // Omit bismillah
  function shouldDisplayBismillah(suraNo) {
    const bismillah = select(".heading-bismillah");
    if (suraNo === 1 || suraNo === 9) bismillah.classList.add("d-none");
    else bismillah.classList.remove("d-none");
  }

  // Display sura info
  function displaySuraInfo({
    number,
    name,
    englishName,
    englishNameTranslation,
  }) {
    setValue(".sura_number-en", number, "textContent");
    setValue(".sura_name-en", englishName, "textContent");
    setValue(".sura_name-tr_en", englishNameTranslation, "textContent");
    setValue(".sura_name-ar", name, "textContent");
    setValue(".sura_number-ar", number.toLocaleString("ar-EG"), "textContent");
  }

  // display ayahs
  displayAyahs(sura.ayahs, number);
}

// Display Ayahs
function displayAyahs(ayahs, suraNo) {
  const verses = ayahs.map(({ text, numberInSurah }, i) => {
    return `
    <li class="list-group-item ayah d-flex justify-content-between pt-4 pe-4" id=${
      suraNo + ":" + numberInSurah
    }>
      <div class="ayah_tools d-flex flex-column text-secondary">
        <div class="ayah_tools-play d-flex align-items-center flex-column">
        <span class="h6 mb-0 text-black-50"> ${suraNo}:${numberInSurah} </span>
          <button class="btn btn-small ayah-play-btn" id="ayah-play-${i}">
            <i class="material-icons ayah-play_arrow">play_arrow</i>
            <i class="material-icons d-none ayah-pause">pause</i>
          </button>
        </div>
      </div>

      <div class="ayah_text flex-grow-1">
        <div class="text-end h2 mb-4">
          <b class="ayah_text-ar text_ar">
          ${
            numberInSurah === 1 && suraNo !== 1 && suraNo !== 9
              ? text.slice(39)
              : text
          } 
          <span class="ayah_number-ar">${numberInSurah.toLocaleString(
            "ar-EG"
          )} </span>
          </b>
        </div>
      </div>
      </li>
    `;
  });

  // add markup to the list
  select(".list-ayahs").innerHTML = verses.join("");
}

// handle specific ayah play icon click
select(".list-ayahs").addEventListener("click", async (e) => {
  const [{ className }, index] = [
    e.target,
    parseInt(e.target.parentElement.id.split("-")[2]),
  ];

  if (className.includes("ayah-play_arrow")) {
    // load audio files if there is no player
    !player &&
      (await loadAudios(
        select(".sura_number-en").textContent,
        select(".select_sura-recitation")["value"]
      ));

    // play audio and next ayah play must stop
    player.skipTo(index, true);
  }

  if (className.includes("ayah-pause")) {
    player.playlist[index].listen && player.playlist[index].listen.pause();
  }
});

// Display Sura Translation
function displaySuraTranslation(ayahs, identifier, direction) {
  const [locale, author] = identifier.split(".");
  const rtl = direction === "rtl" ? "text-end" : "text-start";
  const flexReverse = direction === "rtl" ? "flex-row-reverse" : "";

  const verses = select(".list-ayahs").children;
  for (let i = 0; i < verses.length; i++) {
    verses[i].children[1].innerHTML += `
          <p class="ayah_text mb-1 gap-2 d-flex flex-wrap ${flexReverse}">
            <span class="border rounded-circle px-1">${ayahs[
              i
            ].numberInSurah.toLocaleString(locale)} </span>
            <span class="${rtl}">
            ${ayahs[i].text} 
            </span>
            <small class="text-secondary"><i>${author}</i></small>
          </p>`;
  }
}

// ======== Play batch audio =========
// open audio play bar
select(".sura_header-start_listen").addEventListener("click", (e) => {
  // 2. load audio suraID and reciterId
  loadAudios(
    select(".sura_number-en").textContent,
    select(".select_sura-recitation")["value"]
  );

  // 3. display bottom audio control bar
  select(".player_controls").classList.remove("d-none");

  // 4. display downloading state
  select(".operation_btn-pause").classList.add("d-none");
  select(".operation_btn-loading").classList.remove("d-none");
});

// close
select(".close_audio-playBar").addEventListener("click", () => {
  // stop the player
  player.stop();

  // stop specific ayah
  select(
    `.list-ayahs li:nth-child(${player.index + 1}) .ayah-pause`
  ).classList.add("d-none");

  select(
    `.list-ayahs li:nth-child(${player.index + 1}) .ayah-play_arrow`
  ).classList.remove("d-none");

  // remove highlighting bg of ayah
  select(".list-ayahs").children[this.index].classList.remove("bg-light");
  select(".playlist_tracks-listItem").children[this.index].classList.remove(
    "active"
  );

  // hide the audio play bar
  select(".player_controls").classList.add("d-none");
});

// making playlist
function constructPlaylist(data) {
  const playlist = data.ayahs.map(({ audio, number }) => {
    return {
      src: audio,
      title: number,
      listen: null,
    };
  });

  // add track to playlist
  addTracksToPlaylist(data);
  readyToPlay(playlist);
}

// audio file is ready to play
function readyToPlay(playlist) {
  if (playerInstances === 0) {
    player = new Player(playlist);
    playerInstances++;
  } else {
    player.stop();
    player.playlist = playlist;
  }

  // play the audio
  // player.play();

  select(".operation_btn-loading").classList.add("d-none");
  select(".operation_btn-play").classList.remove("d-none");
}

// play the audio
select(".operation_btn-play").addEventListener("click", () => {
  player.play();
});

// pause the audio
select(".operation_btn-pause").addEventListener("click", () => {
  player.pause();
});

// next track
select(".control_operations-next").addEventListener("click", () => {
  player.skip("next");
});

// previous track
select(".control_operations-prev").addEventListener("click", () => {
  player.skip("prev");
});

// skip to
select(".playlist_tracks").addEventListener(
  "click",
  (e) => {
    if (e.target.id) {
      player.skipTo(parseInt(e.target.id.split("-")[1]));
    }
  },
  true
);

// adding track to playlist
function addTracksToPlaylist({ englishName, number, numberOfAyahs, ayahs }) {
  select(
    ".playlist_tracks-name"
  ).innerHTML = `${number}. ${englishName} (${numberOfAyahs})`;

  select(".playlist_tracks-listItem").innerHTML = ayahs
    .map(
      ({ number }, i) =>
        `<li class="list-group-item list-group-item-light d-flex align-items-center"><span>${
          i + 1
        }</span>. <button class="btn flex-grow-1 text-start" id="ayah-${i}" > Ayah <small>${number}</small></button></li>`
    )
    .join(" ");
}

// Toggle playlist
select(".playlist_control-togglePlaylist").addEventListener("click", (e) => {
  const tracks = select(".playlist_tracks");
  const icon = select(".playlist_control-togglePlaylist > .material-icons");

  if (tracks.className.includes("d-none")) {
    tracks.classList.remove("d-none");
    tracks.classList.add("d-block");
    icon.innerHTML = "playlist_remove";
  } else {
    tracks.classList.remove("d-block");
    tracks.classList.add("d-none");
    icon.innerHTML = "queue_music";
  }
});

// handle next sura button click
select(".control_operations-nextSura").addEventListener("click", () => {
  const id = parseInt(select(".sura_number-en")["innerText"]);
  const index = id === 114 ? 1 : id + 1;

  prevNextPlaylist(index);
});

// handle prev  sura button click
select(".control_operations-prevSura").addEventListener("click", () => {
  const id = parseInt(select(".sura_number-en")["innerText"]);
  const index = id === 1 ? 114 : id - 1;

  prevNextPlaylist(index);
});

// load next playlist
function prevNextPlaylist(id) {
  // 1. load sura to display
  loadSura(id);

  // 2. load audios
  loadAudios(id, select(".select_sura-recitation").value);
}

select(".sura_nav-gotoAyah").addEventListener("change", (e) => {
  const index = parseInt(e.target.value);
  // scrollToElement(index === 1 ? index : index - 1);
  scrollToElement(index === 1 ? index : index - 1);
});

// scrollToElement
function scrollToElement(id) {
  const offset = select(`.list-ayahs li:nth-child(${id})`).offsetTop;

  window.scrollTo({
    top: offset,
    behavior: "smooth",
  });
}

// ======== Utilities =======
// set value
function setValue(selector, content, method = "innerHTML") {
  select(selector)[method] = content;
}

// create element
function create(element) {
  return document.createElement(element);
}

// select
function select(selector) {
  return document.querySelector(selector);
}
