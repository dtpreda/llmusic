# LLMusic

`LLMusic` is an LLM-based playlist generator. It takes specific vibe or mood as input, along with other requirements and a given number of songs, and returns a playlist of songs that match the input.

It is integrated with the [Spotify Web API](https://developer.spotify.com/documentation/web-api/) so users can save playlists to their Spotify account.

## How it works

LLMusic takes the user input and inserts into an handcrafted prompt. The prompt is then fed into a Large Language Model (LLM) to generate a playlist. As the larger LLMs are trained on the whole internet, they are informed about music as a whole and Spotify's catalog. Thus, there is no need to fine-tune a model on the domain at hand.

## The LLM

The LLM is hosted at [you.com](you.com), so I don't have many details about it. The file `you.js` deconstructs the website's API to make it usable in this project (I essentialy exported to JS the Python code written by the people behind [gpt4free](https://github.com/xtekky/gpt4free)).

Therefore, since the LLM is hosted by a third party, this project may stop working at any time.

## How to use

You don't need much to get this project up and running. Set up a Spotify developer account and create an app. Then, in the `auth.js` file, replace the `client_id` and `redirect_uri` with your own. You can then run the app locally, for example, with VSCode's Live Server extension.

## DISCLAIMER

This project is for educational purposes only. I do not condone the use of this project for any malicious purposes. I am not responsible for any misuse of this project.

Before using this project, you should read the [gpt4free disclaimer](https://github.com/xtekky/gpt4free), as this project is based on it. Any use of this project is at your own risk.