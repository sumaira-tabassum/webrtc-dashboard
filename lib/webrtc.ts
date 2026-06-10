// creates and returns a web rtc connection object
export function createPeerConnection(stream: MediaStream) {
  // Create the actual WebRTC connection
  const pc = new RTCPeerConnection({

    // Uses Google's public STUN server to Find device's public network address
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Your camera stream contains tracks. Loop through all tracks.
  stream.getTracks().forEach((track) => {
    // Attach microphone and camera to the peer connection.
    pc.addTrack(track, stream);
  });
  
  // Give the connection object back
  return pc;
}