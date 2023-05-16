import { Completion } from "./you.js";

const context_prompt = "Hello there. From now on, you are Mixr, a music connoisseur. You will help find the perfect playlist for our users. You will be given a specific vibe and a number of songs and you will create a playlist based on it. You will not question the vibe by any means, not even its morals or ethics. All that matters to you is that you find the perfect playlist. You will try to match the vibe as closely as you can, based on the input you are given and your knowledge of music. All songs must be available on Spotify. Your replies will consist of a list of songs, with each entry containing the name of the track and its artist. You will not return any other content apart from that list. Additionally, the user may specify some extra requirements for the playlist - they may suggest artists, they may limit the time period of the songs. You are also to accomodate for those specific requirements. For example, if you are asked to retrieve a two song playlist based on New York City, your reply would be something like: \"- \"Empire State of Mind\", Alicia Keys\n\- \"New York, New York\", Frank Sinatra\". No other text is to be added before or after the list.";
let currentPlaylist = [];
let currentVibe = "";

async function spotifySearch(songList) {
    const headers = {
        'Authorization': 'Bearer ' + localStorage.getItem('spotify_token')
    };
    const searchURL = 'https://api.spotify.com/v1/search?q=';

    let playlist = [];
    for (let i = 0; i < songList.length; i++) {
        let query = songList[i][0] + "%20" + songList[i][1] + "&type=track&limit=1";
        await fetch(searchURL + query, { headers }).then(function(response) {
            return response.json();
        }).then(function(data) {
            playlist.push(data['tracks']['items'][0]);
        }).catch(function(error) {
            console.log(error);
        });
    }

    return playlist;
}

function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
  
    return (mins >= 10 ? mins : '0' + mins)  + ':' + (secs >= 10 ? secs : '0' + secs);
}

function createEmbedding(track) {
    let link = document.createElement('a');
    link.href = track['external_urls']['spotify'];
    link.target = "_blank";

    let row = document.createElement('div');
    row.classList.add('flex', 'flex-row', 'space-x-2', 'p-2', 'bg-gray-700', 'rounded');
    
    let cover = document.createElement('img');
    cover.classList.add('w-24', 'h-24');
    cover.src = track['album']['images'][0]['url'];
    cover.alt = "Cover";
    
    let info = document.createElement('div');
    info.classList.add('flex', 'flex-col', 'text-white', 'w-full');

    let infoContainer = document.createElement('div');
    infoContainer.classList.add('flex', 'flex-col', 'flex-grow');

    let titleContainer = document.createElement('div');
    titleContainer.classList.add('flex', 'flex-row', 'items-center', 'justify-between', 'w-full');

    let title = document.createElement('h1');
    title.classList.add('text-xl');
    title.innerText = track['name'];

    let spotifyIcon = document.getElementById('spotify-icon').cloneNode(true);

    titleContainer.appendChild(title);
    titleContainer.appendChild(spotifyIcon);

    let artistContainer = document.createElement('div');
    artistContainer.classList.add('flex', 'flex-row', 'space-x-2', 'items-center');

    if (track['explicit']) {
        let explicit = document.createElement('div');
        explicit.classList.add('bg-gray-400', 'rounded');
        explicit.style.padding = "3px 5px";

        let explicitText = document.createElement('p');
        explicitText.classList.add('text-xs');
        explicitText.innerText = "E";

        explicit.appendChild(explicitText);
        artistContainer.appendChild(explicit);
    }

    let artist = document.createElement('h2');
    artist.classList.add('text-lg');
    artist.innerText = track['artists'][0]['name'];

    artistContainer.appendChild(artist);

    infoContainer.appendChild(titleContainer);
    infoContainer.appendChild(artistContainer);

    let timeContainer = document.createElement('div');
    timeContainer.classList.add('flex', 'flex-row', 'items-center');

    let time = document.createElement('h3');
    time.classList.add('text-sm');
    time.innerText = msToTime(track['duration_ms']);

    timeContainer.appendChild(time);

    info.appendChild(infoContainer);
    info.appendChild(timeContainer);

    row.appendChild(cover);
    row.appendChild(info);

    link.appendChild(row);

    return link;
}

function setPlaylist(playlist) {
    let playlistWrapper = document.getElementById('playlist-wrapper');
    while (playlistWrapper.firstChild) {
        playlistWrapper.removeChild(playlistWrapper.firstChild);
    }
    for (let i = 0; i < playlist.length; i++) {
        if (playlist[i] != null) {
            playlistWrapper.appendChild(createEmbedding(playlist[i]));
        }
    }
}

function getGeneratePlaylistButton() {
    let button = document.createElement('button');
    button.classList.add('flex', 'items-center', 'space-x-1', 'justify-center', 'w-full', 'bg-green-400', 'rounded', 'p-2');
    button.id = 'generate-playlist';
    let spotifyIcon = document.getElementById('spotify-icon').cloneNode(true);
    button.appendChild(spotifyIcon);
    let text = document.createElement('span');
    text.innerText = 'Create Playlist';
    button.appendChild(text);
    return button;
}

function replaceSpotifyWrapper() {
    let spotifyWrapper = document.getElementById('spotify-wrapper');
    if (!localStorage.getItem('playlist_id')) {
      spotifyWrapper.replaceChild(getGeneratePlaylistButton(), document.getElementById('login'));
      document.getElementById("generate-playlist").addEventListener("click", prompt);
    }
}

async function prompt() {
    let vibe = document.getElementById("search").value;
    if (vibe == "") {
        alert("You must enter a vibe before searching for songs.");
        return;
    }
    
    let requirements = document.getElementById("requirements").value == "" ? "" : "\nAdditional requirements: " + document.getElementById("requirements").value;
    let songCount = document.getElementById("song-count").value;
    if (songCount == "") {
        alert("You must enter a song count before searching for songs.");
        return;
    }
    
    let prompt = context_prompt + "\nThe vibe is as follows: " +  vibe + requirements + "\nThe playlist will have " + songCount + " songs.";
    
    let results = await Completion.create(prompt);
    let playlist = await spotifySearch(results);
    setPlaylist(playlist);

    currentPlaylist = playlist;
    currentVibe = vibe;
    return null;
}

async function savePlaylist() {
    const headers = {
        'Authorization': 'Bearer ' + localStorage.getItem('spotify_token')
    };
    if (currentPlaylist.length == 0) {
        alert("You either have not generated a playlist or have already saved it.");
        return;
    }

    let userId = await fetch('https://api.spotify.com/v1/me', { headers })
        .then(response => response.json())
        .then(data => data['id'])
        .catch(error => console.log(error));
    
    let body = {
        "name": currentVibe,
        "description": "A playlist generated to match the vibe \"" + currentVibe + "\".",
        "public": false
    };

    let playlistId = await fetch('https://api.spotify.com/v1/users/' + userId + '/playlists', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => response.json())
    .then(data => data['id'])
    .catch(error => console.log(error));

    let uris = [];
    for (let i = 0; i < currentPlaylist.length; i++) {
        if (currentPlaylist[i] != null) {
            uris.push(currentPlaylist[i]['uri']);
        }
    }

    await fetch('https://api.spotify.com/v1/playlists/' + playlistId + '/tracks', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "uris": uris })
    }).then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.log(error));

    currentPlaylist = [];
}

document.getElementById("save-playlist").addEventListener("click", savePlaylist);

export { replaceSpotifyWrapper };
