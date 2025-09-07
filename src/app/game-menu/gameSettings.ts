export const GAME_TYPES = ['Chess'] as const;

export const PLAYER_COLORS = ['White', 'Black'] as const;

export const SKILL_LEVEL = [...Array(20).keys()];

export type GameType = typeof GAME_TYPES[number]

export type PlayerColor = typeof PLAYER_COLORS[number];

export type SkillLevel = typeof SKILL_LEVEL[number];