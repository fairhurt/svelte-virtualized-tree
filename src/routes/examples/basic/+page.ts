// The demo builds its tree with Math.random, so render it in the browser only;
// otherwise the server and client trees differ and hydration breaks.
export const ssr = false;
