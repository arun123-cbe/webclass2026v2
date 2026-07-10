/**
 * Utility to construct a Jitsi Meet URL with customized hash configurations.
 * This ensures users bypass the prejoin screen, join immediately, and
 * display their correct real names.
 */
export function getJitsiUrl(url: string, displayName?: string): string {
  if (!url) return "";

  // Extract base URL and existing hash parameters
  const hashIndex = url.indexOf("#");
  let baseUrl = url;
  let hashParams = "";
  if (hashIndex !== -1) {
    baseUrl = url.substring(0, hashIndex);
    hashParams = url.substring(hashIndex + 1);
  }

  const params: string[] = [];
  if (hashParams) {
    params.push(hashParams);
  }

  // Auto-disable prejoin page to make iframe connections instant and seamless
  if (!hashParams.includes("config.prejoinPageEnabled")) {
    params.push("config.prejoinPageEnabled=false");
  }

  // Ensure webcam/microphone are unmuted initially
  if (!hashParams.includes("config.startWithAudioMuted")) {
    params.push("config.startWithAudioMuted=false");
  }
  if (!hashParams.includes("config.startWithVideoMuted")) {
    params.push("config.startWithVideoMuted=false");
  }

  // Set Jitsi display name
  if (displayName && !hashParams.includes("userInfo.displayName")) {
    const escapedName = encodeURIComponent(displayName);
    params.push(`userInfo.displayName="${escapedName}"`);
  }

  return params.length > 0 ? `${baseUrl}#${params.join("&")}` : baseUrl;
}
