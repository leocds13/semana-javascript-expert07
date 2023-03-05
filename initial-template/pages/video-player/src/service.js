import {
  prepareOverChecker,
  prepareRunChecker,
} from "../../../lib/shared/util.js";

const EAR_THRESHOLD = 0.27;

const { shouldRun: shouldRunAnalyze } = prepareRunChecker({ timerDelay: 250 });
// const { shouldRun: shouldPauseVideo } = prepareRunChecker({ timerDelay: 3000 })

export default class Service {
  #model = null;
  #faceLandmarksDetection;
  constructor({ faceLandmarksDetection }) {
    this.#faceLandmarksDetection = faceLandmarksDetection;
  }

  async loadModel() {
    this.#model = await this.#faceLandmarksDetection.load(
      this.#faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      {
        macFaces: 1,
      }
    );
  }

  #lastResult = false;
  async handleBlinked(video) {
    const predictions = await this.#estimateFaces(video);

    if (!predictions.length) return false;

    for (const prediction of predictions) {
      // Is a face in the video?
      if (prediction.faceInViewConfidence < 0.9) continue;
      if (!shouldRunAnalyze()) continue;

      // Right eye parameters
      const lowerRight = prediction.annotations.rightEyeUpper0;
      const upperRight = prediction.annotations.rightEyeLower0;
      const rightEAR = this.#getEAR(upperRight, lowerRight);
      // Left eye parameters
      const lowerLeft = prediction.annotations.leftEyeUpper0;
      const upperLeft = prediction.annotations.leftEyeLower0;
      const leftEAR = this.#getEAR(upperLeft, lowerLeft);

      const leftEyeClosed = leftEAR <= EAR_THRESHOLD;
      const rightEyeClosed = rightEAR <= EAR_THRESHOLD;

      this.#lastResult = this.#sholdPlayVideo({
        leftClosed: leftEyeClosed,
        rightClosed: rightEyeClosed,
      });
      return this.#lastResult;
    }

    return this.#lastResult;
  }

  // #lastEyeState = { leftClosed: false, rightClosed: false }
  // #tempEyeState = { leftClosed: false, rightClosed: false }
  #lastTimeWithOneEyeOpen;
  #sholdPlayVideo({ leftClosed, rightClosed }) {
    console.log({ leftClosed, rightClosed });
    // shold UnPauseVideo
    if (!leftClosed || !rightClosed) {
      this.#lastTimeWithOneEyeOpen = Date.now();
      return true;
    }
    // if(!shouldPauseVideo()) return true;

    return Date.now() - this.#lastTimeWithOneEyeOpen <= 3000;
  }

  #estimateFaces(video) {
    return this.#model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: true,
      predictIrises: true,
    });
  }

  // Calculate the position of eyelid to predict a blink
  #getEAR(upper, lower) {
    function getEucledianDistance(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    return (
      (getEucledianDistance(
        upper[5][0],
        upper[5][1],
        lower[4][0],
        lower[4][1]
      ) +
        getEucledianDistance(
          upper[3][0],
          upper[3][1],
          lower[2][0],
          lower[2][1]
        )) /
      (2 *
        getEucledianDistance(
          upper[0][0],
          upper[0][1],
          upper[8][0],
          upper[8][1]
        ))
    );
  }
}
