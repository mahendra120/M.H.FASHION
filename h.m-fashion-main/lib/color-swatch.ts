const COLOR_HEX: Record<string, string> = {
  Black: '#1a1a1a',
  White: '#f5f5f5',
  Navy: '#1e3a5f',
  'Storm Grey': '#6b7280',
  Sand: '#d4c4a8',
  Olive: '#556b2f',
  Forest: '#2d5016',
  Maroon: '#6b1d2a',
  Camel: '#c19a6b',
  Blush: '#e8b4b8',
  Grey: '#9ca3af',
  'Forest Green': '#2d5016',
};

export function colorToHex(name: string): string {
  return COLOR_HEX[name] ?? '#a8a29e';
}
