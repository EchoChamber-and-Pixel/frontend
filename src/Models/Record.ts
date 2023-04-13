export default interface Record {
  id: number;
  steamID64: string;
  playerName: string;
  mapName: string;
  time: number;
  course: number;
  style: number;
  modeId: number;
  mode: string;
  teleports: number;
  isPro: boolean;
  source: string;
  created: Date;
}