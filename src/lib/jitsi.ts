/**
 * Utility to construct a Jitsi Meet URL with customized hash configurations.
 * This ensures users bypass the prejoin screen, join immediately, and
 * display their correct real names.
 */
export function getJitsiUrl(url: string, displayName?: string): string {
  if (!url) return "";

  // Automatically map meet.ffmuc.net to meet.senf.im for excellent iframe embedding compatibility
  let normalizedUrl = url;
  if (normalizedUrl.includes("meet.ffmuc.net")) {
    normalizedUrl = normalizedUrl.replace("meet.ffmuc.net", "meet.senf.im");
  }

  // Extract base URL and existing hash parameters
  const hashIndex = normalizedUrl.indexOf("#");
  let baseUrl = normalizedUrl;
  let hashParams = "";
  if (hashIndex !== -1) {
    baseUrl = normalizedUrl.substring(0, hashIndex);
    hashParams = normalizedUrl.substring(hashIndex + 1);
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
