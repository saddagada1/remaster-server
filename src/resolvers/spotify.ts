import { spotifyApi } from "../spotify/init";
import {
  Resolver,
  Field,
  ObjectType,
  Query,
  Arg,
} from "type-graphql";

@ObjectType()
class SpotifyTrack {
  @Field()
  id!: string;
  @Field()
  name!: string;
  @Field(() => [String])
  artists!: string[];
  @Field()
  albumArt!: string;
}

@ObjectType()
class SpotifyAlbum {
  @Field()
  id!: string;
  @Field()
  name!: string;
  @Field(() => [String])
  artists!: string[];
  @Field()
  albumArt!: string;
}

@ObjectType()
class SpotifyArtist {
  @Field()
  id!: string;
  @Field()
  name!: string;
  @Field()
  profileArt!: string;
}

@ObjectType()
class SpotifySearchResponse {
  @Field()
  id!: string;
  @Field(() => [SpotifyTrack], {nullable: true})
  tracks?: SpotifyTrack[];
  @Field(() => [SpotifyAlbum], {nullable: true})
  albums?: SpotifyAlbum[];
  @Field(() => [SpotifyArtist], {nullable: true})
  artists?: SpotifyArtist[];
}

@ObjectType()
class SpotifyTrackAnalysisResponse {
  @Field()
  id!: string;
  @Field()
  name!: string;
  @Field(() => [String])
  artists!: string[];
  @Field()
  albumArt!: string;
  @Field()
  duration!: number;
  @Field()
  key!: number;
  @Field()
  mode!: number;
  @Field()
  tempo!: number;
  @Field()
  time_sig!: number;
}

const mapTracks = (tracks: SpotifyApi.TrackObjectFull[]): SpotifyTrack[] => {
  let mappedTracks: SpotifyTrack[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const trackId = tracks[i].id;
    const trackName = tracks[i].name;
    const trackArtists = tracks[i].artists.map((artist) => artist.name);
    const trackAlbumArt = tracks[i].album.images[0].url;
    mappedTracks.push({id: trackId, name: trackName, artists: trackArtists, albumArt: trackAlbumArt})
  }
  return mappedTracks;
}

const mapAlbums = (albums: SpotifyApi.AlbumObjectSimplified[]): SpotifyAlbum[] => {
  let mappedAlbums: SpotifyAlbum[] = [];
  for (let i = 0; i < albums.length; i++) {
    const albumId = albums[i].id;
    const albumName = albums[i].name;
    const albumArtists = albums[i].artists.map((artist) => artist.name);
    const albumAlbumArt = albums[i].images[0].url;
    mappedAlbums.push({id: albumId, name: albumName, artists: albumArtists, albumArt: albumAlbumArt})
  }
  return mappedAlbums;
}

const mapArtists = (artists: SpotifyApi.ArtistObjectFull[]): SpotifyArtist[] => {
  let mappedArtists: SpotifyArtist[] = [];
  for (let i = 0; i < artists.length; i++) {
    const artistId = artists[i].id;
    const artistName = artists[i].name;
    const artistProfileArt = artists[i].images[0].url;
    mappedArtists.push({id: artistId, name: artistName, profileArt: artistProfileArt})
  }
  return mappedArtists;
}

@Resolver()
export class SpotifyResolver {
  @Query(() => SpotifySearchResponse)
  async spotifySearch(@Arg("query") query: string): Promise<SpotifySearchResponse> {
    const searchResponse = await spotifyApi.search(query, ["track", "album", "artist"], {limit: 50});
    const tracks = searchResponse.body.tracks && mapTracks(searchResponse.body.tracks.items);
    const albums = searchResponse.body.albums && mapAlbums(searchResponse.body.albums.items);
    // const artists = searchResponse.body.artists && mapArtists(searchResponse.body.artists.items)
    return {
      id: query, tracks, albums
    };
  }
  @Query(() => SpotifyTrackAnalysisResponse)
  async spotifyTrackAnalysis(@Arg("id") id: string): Promise<SpotifyTrackAnalysisResponse> {
    const trackResponse = await spotifyApi.getTrack(id);
    const analysisResponse = await spotifyApi.getAudioFeaturesForTrack(id);
    const artists = trackResponse.body.artists.map((artist) => artist.name);
    return {
      id: id,
      name: trackResponse.body.name,
      artists: artists,
      albumArt: trackResponse.body.album.images[0].url,
      duration: trackResponse.body.duration_ms,
      key: analysisResponse.body.key,
      mode: analysisResponse.body.mode,
      tempo: analysisResponse.body.tempo,//
      time_sig: analysisResponse.body.time_signature,
    };
  }
}
