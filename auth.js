import { replaceSpotifyWrapper } from './playlist.js';

const clientId = 'YOUR_CLIENT_SECRET';
const redirectUri = 'YOUR_REDIRECT_URI';

function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    function base64encode(string) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
  
    return base64encode(digest);
  }

function spotifyLogin() {
    const scope =  "playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public";
    
    let codeVerifier = generateRandomString(128);
    
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
      let state = generateRandomString(16);
    
      localStorage.setItem('code_verifier', codeVerifier);
    
      let args = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        sameSite: 'none',
      });
    
      window.location = 'https://accounts.spotify.com/authorize?' + args;
    });
}

async function spotifyLoginCallback(code) {
  let codeVerifier = localStorage.getItem('code_verifier');

  let body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  })
    .then(response => {
      if (!response.ok) {
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('refresh_token');
        throw new Error('HTTP status ' + response.status);
      } 
      return response.json();
    })
    .then(data => {
      localStorage.setItem('spotify_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      replaceSpotifyWrapper();
    }).catch(error => {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('refresh_token');
      console.error('Error:', error);
    });
}

async function refreshToken() {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: localStorage.getItem('refresh_token'),
    client_id: clientId,
  });

  await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  }).then(response => {
    if (!response.ok) {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('refresh_token');
      throw new Error('HTTP status ' + response.status);
    } 
    return response.json();
  }).then(data => {
    localStorage.setItem('spotify_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    replaceSpotifyWrapper();
  }).catch(error => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('refresh_token');
    console.error('Error:', error);
  });
}

async function postAuthUpdate() {
  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get('code');
  if (!localStorage.getItem('spotify_token')) {
    if (code) {
      await spotifyLoginCallback(code);
    }
  } else {
    await refreshToken();
  }
}

document.getElementById("login").addEventListener("click", spotifyLogin);

postAuthUpdate();


