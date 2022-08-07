import SpotifyWebApi from "spotify-web-api-node";

const clientId = process.env.SPOTIFY_API_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_API_CLIENT_SECRET;

export const spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret,
});

export const SpotifyInit = () => {
  const setToken = () => {
    spotifyApi.clientCredentialsGrant().then(
      (data) => {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        spotifyApi.setAccessToken(data.body['access_token']);//
      },
      (err) => {
        console.log('Something went wrong when retrieving an access token', err);
      }
    );
  };

  if (!spotifyApi.getAccessToken()) {
    setToken();
  } 

  setInterval(() => {
    setToken();
  }, 1000 * 3400);
};



