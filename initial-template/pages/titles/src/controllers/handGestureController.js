import { prepareRunChecker } from "../../../../lib/shared/util.js";

const { shouldRun: shouldRunScroll } = prepareRunChecker({ timerDelay: 200 });
const { shouldRun: shouldRunClick } = prepareRunChecker({ timerDelay: 200 });

export default class HandGestureController {
  #view;
  #service;
  #camera;
  #lastDirection = {
    direction: "",
    y: 0,
  };

  constructor({ view, service, camera }) {
    this.#view = view;
    this.#service = service;
    this.#camera = camera;
  }

  async init() {
    return this.#loop();
  }

  #scrollPage(direction) {
    if (!shouldRunScroll()) return;
    const pixelPerScroll = 100;

    if (this.#lastDirection.direction === direction) {
      this.#lastDirection.y =
        direction === "scroll-down"
          ? this.#lastDirection.y + pixelPerScroll
          : this.#lastDirection.y - pixelPerScroll;
    } else {
      this.#lastDirection.direction = direction;
    }

    this.#view.scrollPage(this.#lastDirection.y);
  }

  async #estimateHands() {
    try {
      const hands = await this.#service.estimateHands(this.#camera.video);
      this.#view.clearHands();

      if (hands?.length) this.#view.drawHands(hands);

      for await (const { event, x, y } of this.#service.detectGestures(hands)) {
        if (event === "click") {
          if (!shouldRunClick()) continue;
          this.#view.clickOnElement(x, y);
          continue;
        }

        if (event.includes("scroll")) {
          this.#scrollPage(event);
          continue;
        }
      }
    } catch (error) {
      console.error("Erro estimateHandsController", error);
    }
  }

  async #loop() {
    await this.#service.initializeDetector();
    await this.#estimateHands();
    this.#view.loop(this.#loop.bind(this));
  }

  static async initialize(deps) {
    const controller = new HandGestureController(deps);
    return await controller.init();
  }
}
