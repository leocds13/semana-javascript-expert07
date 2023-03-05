export default class Controller {
  #view;
  #camera;
  #worker;
  #blinkCounter = 0;

  constructor({ view, worker, camera, videoUrl }) {
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
    this.#view.setVideoSrc(videoUrl);
  }

  static async initialize(deps) {
    const controller = new Controller(deps);
    controller.log("not yet detecting eye blink! click in the button to start");
    return controller.init();
  }

  #configureWorker(worker) {
    let ready = false;
    worker.onmessage = ({ data }) => {
      if (data === "MODEL_READY") {
        console.log("worker ready");
        this.#view.enableButton();
        ready = true;
        return;
      }

      const watching = data;
      // this.#blinkCounter += leftEye || rightEye
      // if(leftEye) this.#view.togglePlayVideo(false)
      this.#view.togglePlayVideo(watching);
    };

    return {
      send(msg) {
        if (!ready) return;

        worker.postMessage(msg);
      },
    };
  }

  async init() {
    console.log("Controller init!");
  }

  loop() {
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);

    this.#worker.send(img);
    this.log(`detecting eye blink...`);

    setTimeout(() => this.loop(), 100);
  }

  log(text) {
    const time = `    - blinked times: ${this.#blinkCounter}`;
    this.#view.log(`status: ${text}`.concat(this.#blinkCounter ? time : ""));
  }

  onBtnStart() {
    this.log("initializing detection..");
    this.#blinkCounter = 0;
    this.loop();
  }
}
