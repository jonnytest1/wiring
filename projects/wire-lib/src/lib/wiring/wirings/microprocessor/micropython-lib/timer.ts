export class TimerContext {


  private readonly intervals: Array<NodeJS.Timeout> = []

  boundModule() {
    const self = this;
    function Timer() {
      return {
        init(freq: number, mode, callback) {


          if (mode === Timer.PERIODIC) {
            self.intervals.push(setInterval(callback, freq * 1000))
          } else {
            debugger
          }
        }
      }

    }

    Timer.PERIODIC = "PERIODIC"

    return Timer
  }
  stop() {
    for (const timer of this.intervals) {
      clearInterval(timer)
    }
  }
}




