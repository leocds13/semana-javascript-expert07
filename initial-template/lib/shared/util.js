function supportWorkerType() {
  let supports = false

  const tester = {
    get type() { supports = true }
  }

  try {
    new Worker('blob://', tester ).terminate()
  } finally {
    return supports
  }
}

function prepareRunChecker({ timerDelay }) {
  let lastEvent = Date.now()
  return {
    shouldRun() {
      const result = (Date.now() - lastEvent) > timerDelay
      if(result) lastEvent = Date.now()

      return result
    }
  }
}

function prepareOverChecker({ timerDelay }) {
  let lastEvent = Date.now()
  return {
    didOverPassed() {
      return (Date.now() - lastEvent) > timerDelay
    },
    resetOverCheker() {
      lastEvent = Date.now()
    }
  }
}

export {
  supportWorkerType,
  prepareRunChecker,
  prepareOverChecker
}