export function lighten(hex) {
  return adjust(hex, 60);
}
export function darken(hex) {
  return adjust(hex, -60);
}
function adjust(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}
function clamp(v) {
  return Math.max(0, Math.min(255, v));
}
