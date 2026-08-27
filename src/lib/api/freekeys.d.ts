declare module "freekeys" {
  interface Freekeys {
    tmdb_key?: string;
    imdb_key?: string;
  }
  export default function freekeys(): Promise<Freekeys>;
}
