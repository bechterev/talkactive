enum CallState {
  Leave = 'leave',
  Init = 'init',
  Wait = 'wait',
  Work = 'work',
  Finish = 'finish',
  Timeout = 'timeout',
}

const callStateArray = Object.keys(CallState)
  .map((key) => CallState[key as any]);

export { CallState, callStateArray };
