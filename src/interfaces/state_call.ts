enum CallState {
  Init = 'init',
  Wait = 'wait',
  Work = 'work',
  Leave = 'leave',
  Finish = 'finish',
}

const callStateArray = Object.keys(CallState)
  .filter((key) => !/^[0-9]+$/.test(key))
  .map((key) => CallState[key as any]);

export { CallState, callStateArray };
