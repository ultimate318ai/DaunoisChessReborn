import type { Writable } from "svelte/store";
import { writable } from "svelte/store";


export const fenStore: Writable<string> = writable('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

export const gameType: Writable<string> = writable('chess');

export const startGame: Writable<boolean> = writable(false);