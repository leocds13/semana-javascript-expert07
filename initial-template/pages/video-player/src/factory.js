import Camera from "../../../lib/shared/camera.js";
import { supportWorkerType } from "../../../lib/shared/util.js";
import Controller from "./controller.js";
import Service from "./service.js";
import View from "./view.js";

async function getWorker() {
  if (supportWorkerType()) {
    const worker = new Worker(`./src/worker.js`, { type: "module" });
    return worker;
  }

  console.warn(`Your browser doesn't support esm modules on webworkers!`);
  console.warn(`Importing libraries...`);
  await import("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js");
  await import(
    "https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js"
  );
  await import(
    "https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js"
  );
  await import(
    "https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js"
  );

  console.warn(`Using mockWorker instead!`);
  const service = new Service({
    faceLandmarksDetection: window.faceLandmarksDetection,
  });

  const workerMock = {
    async postMessage(video) {
      const blinked = await service.handleBlinked(video);
      if (!blinked) return;
      workerMock.onmessage({ data: { blinked } });
    },
    // vai ser sobreescrito pela controller
    onmessage(msg) {},
  };

  await service.loadModel();

  setTimeout(() => workerMock.onmessage({ data: "MODEL_READY" }), 500);

  return workerMock;
}
// debugger

const camera = await Camera.init();
const worker = await getWorker();

const [rootPath] = window.location.href.split("/pages/");
console.log({ rootPath });
const factory = {
  async initialize() {
    return Controller.initialize({
      view: new View(),
      worker,
      camera,
      videoUrl: `${rootPath}/assets/video.mp4`,
    });
  },
};

export default factory;
