import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { PoseLandmark } from '../types/rehab';

let landmarkerInstance: PoseLandmarker | null = null;
let isLoadingInstance = false;

export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (isLoadingInstance) {
    // Wait for in-progress initialization
    let attempts = 0;
    while (isLoadingInstance && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    return landmarkerInstance;
  }

  try {
    isLoadingInstance = true;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    isLoadingInstance = false;
    return landmarkerInstance;
  } catch (err) {
    console.warn('Failed to load MediaPipe PoseLandmarker from GPU/WASM CDN. Falling back to Pose Simulator.', err);
    isLoadingInstance = false;
    return null;
  }
}

export function detectPoseInVideo(
  landmarker: PoseLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): PoseLandmark[] | null {
  try {
    if (!video || video.readyState < 2) {
      return null;
    }

    const result = landmarker.detectForVideo(video, timestampMs);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const pose = result.landmarks[0];
      return pose.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));
    }
  } catch (err) {
    // Gracefully handle single-frame tracking glitches
  }
  return null;
}
