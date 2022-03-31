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
  play(id) {
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
        },
        onpause: () => {
          select(".operation_btn-pause").classList.add("d-none");
          select(".operation_btn-play").classList.remove("d-none");
        },
        onend: () => {
          this.skip("next");
        },
      });
    }

    // begin playing audio
    audio.play();

    // Show the pause button.
    if (audio.state() === "loaded") {
      select(".operation_btn-loading").classList.add("d-none");
    }

    // console.log(audio.playing());
    // if (audio.playing) {
    //   audio.stop();
    // }

    // set currenty playing index
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
  skipTo(id) {
    const currentPlaying = this.playlist[this.index].listen;

    if (currentPlaying) {
      currentPlaying.stop();
    }

    this.play(id);
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
        `<option class="h4" value="${number}" ${
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
  // const player = new Player([]);
  loadAudios(select(".sura_number-en")["textContent"], value);

  // display audio bar
  select(".player_controls").classList.remove("d-none");
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
  displaySuraTranslation(data.ayahs, identifier);

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

  shouldDisplayBismillah(number);

  displaySuraInfo({
    number,
    name,
    englishName,
    englishNameTranslation,
    revelationType,
    numberOfAyahs,
  });

  // Omit bismill
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
    revelationType,
    numberOfAyahs,
  }) {
    setValue(".sura_number-en", number, "textContent");
    setValue(".sura_name-en", englishName, "textContent");
    setValue(".sura_name-tr_en", englishNameTranslation, "textContent");
    setValue(".sura_name-ar", name, "textContent");
    setValue(".sura_number-ar", number.toLocaleString("ar-EG"), "textContent");
    setValue(".sura_type", revelationType, "textContent");
    setValue(".sura_ayahs", numberOfAyahs, "textContent");
  }

  // display ayahs
  displayAyahs(sura.ayahs, number);
}

// Display Ayahs
function displayAyahs(ayahs, suraNo) {
  const verses = ayahs.map(({ text, numberInSurah }) => {
    return `
    <li class="list-group-item ayah d-flex justify-content-between pt-3" id=${
      suraNo + ":" + numberInSurah
    }>
      <div class="ayah_tools d-flex flex-column justify-content-center text-secondary">
        <div class="ayah_tools-play">
          <i class="material-icons">play_circle</i>
        </div>
      </div>

      <div class="ayah_text">
        <div class="text-end h2 mb-3">
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

// Display Sura Translation
function displaySuraTranslation(ayahs, identifier) {
  const [locale, author] = identifier.split(".");

  const verses = select(".list-ayahs").children;
  for (let i = 0; i < verses.length; i++) {
    verses[i].children[1].innerHTML += `<p class="ayah_tr-bn text_bn mb-0">
            <span class="ayah_number-bn">${ayahs[
              i
            ].numberInSurah.toLocaleString(locale)} </span>
            ${
              ayahs[i].text
            } <small class="text-secondary"><i>${author}</i></small>
          </p>`;
  }
}

// Attach Sura recitation
function attachRecitation(ayahs) {
  const verses = select(".list-ayahs").children;

  for (let i = 0; i < verses.length; i++) {
    const playButton = verses[i].firstElementChild.firstElementChild;

    if (playButton.childElementCount > 1) {
      playButton.children[1].src = ayahs[i]["audio"];
    } else {
      playButton.innerHTML += `<audio src="${ayahs[i]["audio"]}"></audio>`;
    }
  }
}

// ======== Play batch audio =========
select(".sura_tools-playlist").addEventListener("click", (e) => {
  if (e.target.textContent === "playlist_play") {
    // 1. display audio play container

    // 2. load audio suraID and reciterId
    loadAudios(
      select(".sura_number-en").textContent,
      select(".select_sura-recitation")["value"]
    );

    // 3. display bottom audio control bar
    select(".player_controls").classList.remove("d-none");

    // 4. display dowloading state
    select(".operation_btn-loading").classList.remove("d-none");
  }
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
  readyToplay(playlist);
}

// audio file is ready to play
function readyToplay(playlist) {
  if (playerInstances === 0) {
    player = new Player(playlist);
    playerInstances++;
  } else {
    player.stop();
    player.playlist = playlist;
  }

  // play the audio
  // player.play();

  // stop the prev play
  // player.stop();

  select(".operation_btn-loading").classList.add("d-none");
  select(".operation_btn-play").classList.remove("d-none");

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
  select(".playlist_tracks").addEventListener("click", (e) => {
    if (e.target.id) {
      player.skipTo(parseInt(e.target.id.split("-")[1]));
    }
  });
}

// adding track to playlist
function addTracksToPlaylist({ englishName, number, numberOfAyahs, ayahs }) {
  select(
    ".playlist_tracks-name"
  ).innerHTML = `${number}. ${englishName} (${numberOfAyahs})`;

  select(".playlist_tracks-listItem").innerHTML = ayahs
    .map(
      ({ number }, i) => `<li id="ayah-${i}">Ayah <small>${number}</small></li>`
    )
    .join(" ");
}

// Toggle playlist
select(".player_controls-playlist").addEventListener("click", (e) => {
  const tracks = select(".playlist_tracks");
  if (tracks.className.includes("d-none")) {
    tracks.classList.remove("d-none");
    tracks.classList.add("d-block");
  } else {
    tracks.classList.remove("d-block");
    tracks.classList.add("d-none");
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

// load next plalist
function prevNextPlaylist(id) {
  // 1. load sura to display
  loadSura(id);

  // 2. load audios
  loadAudios(id, "ar.alafasy");
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

/* let ai = 0;
function playAllAyahs(audios) {
  // highligth playing ahah bg dfds
  select(".list-ayahs").children[ai].style.backgroundColor =
    "rgba(0, 0, 0, .1)";
  window.scrollTo(0, select(".list-ayahs").children[ai].offsetTop);

  // play ayah
  audios[ai].play();
  playNow = audios[ai];

  if (ai < audios.length - 1) {
    audios[ai].addEventListener("ended", () => {
      select(".list-ayahs").children[ai].style.backgroundColor = "inherit";

      ai++;
      playAllAyahs(audios);
    });
  }

  if (ai === audios.length - 1) {
    audios[audios.length - 1].addEventListener("ended", () => {
      select(".list-ayahs").lastElementChild.style.backgroundColor = "inherit";
      ai = 0;
    });
  }
} */

/* let playNow = null;
// click to listen ayah
select(".list-ayahs").addEventListener("click", async (e) => {
  e.stopImmediatePropagation();

  if (e.target.textContent.includes("play_circle")) {
    const that = e.target;

    // stop prev play
    playNow !== null && playNow.pause();

    that.textContent = "pending";
    that.parentElement.parentElement.parentElement.classList.add("bg-light");

    const ayahInSurah = e.target.parentElement.parentElement.parentElement.id;

    const data = await fetchData(
      ayahInSurah,
      select(".select_sura-recitation")["value"]
    );

    if (data.hasOwnProperty("audio")) {
      const audio = new Audio(data.audio);

      audio.play();
      that.textContent = "pause";
      that.classList.add("text-success");

      audio.addEventListener("playing", () => {
        playNow = audio;

        that.addEventListener("click", () => {
          audio.pause();
          that.textContent = "play_arrow";
        });
      });

      audio.addEventListener("pause", () => {
        that.addEventListener("click", () => {
          audio.play();
          that.textContent = "pause";
        });
      });

      audio.addEventListener("ended", () => {
        that.textContent = "play_circle";
        that.classList.remove("text-success");
        that.parentElement.parentElement.parentElement.classList.remove(
          "bg-light"
        );
      });
    }
  }
}); */

// load reciation
/* function loadRecitation(identifier) {
  const sura = select(".sura_number-en").textContent;

  attachRecitation(fetchData(sura, identifier));

   // offline testing purposes
   // attachRecitation(sura114Recitation);
} */
