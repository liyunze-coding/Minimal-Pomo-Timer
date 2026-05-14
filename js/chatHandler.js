const chatHandler = (function () {
  'use strict';

  const module = {};

  const user = configs.user;
  const responses = configs.responses;
  const isTesting = configs.settings.runTests;

  const client = streamerbot.client;

  // client.on('Twitch.ChatMessage', onTwitchChatHandler);
  client.on("Command.Triggered", onCommandTriggered);
  client.on('WebsocketClient.Open', onConnect);

  function onCommandTriggered(data) {
    const payload = data.data;

    const command = payload.command;

    const message = payload.message;

    const firstParam = message.split(" ")[0];
    const secondParam = message.split(" ")[1];

    const msg = {
      command,
      firstParam,
      secondParam,
    };

    messageHandler(msg);
  }

  /**
   * Messages from chat pass through this function to detect when the timer command is used.
   * @summary Only executes the given commands if the user is a mod or the broadcaster
   * @param target - the channel were the message came from
   * @param {String} msg - The message sent in chat
   * @note This function was taken from twitch documentation: https://dev.twitch.tv/docs/irc
   */
  function messageHandler(msg) {
    if (!msg) return;

    const { command, firstParam, secondParam } = msg;

    if (command !== '!timer' && command !== '!start') return;

    // using streamerbot, commands are restricted to Mods only

    if (command === '!start') {
      let startingSuccess = logic.starting();
      if (startingSuccess) chatItalicMessage(responses.streamStarting);
      else chatItalicMessage(responses.alreadyStarting);
      return;
    }

    let parsedTime;

    switch (firstParam) {
      case 'start':
        logic.startTimer();
        break;
      case 'pause':
        timerNotRunning(logic.pauseTimer(true));
        break;
      case 'add':
        parsedTime = parseTime(secondParam);
        timerNotRunning(logic.addTime(parsedTime));
        break;
      case 'sub':
        parsedTime = parseTime(secondParam);
        timerNotRunning(logic.subTime(parsedTime));
        break;
      case 'skip':
        timerNotRunning(logic.skipCycle());
        break;
      case 'resume':
      case 'unpause': // two cases in a row is the same as an or operator
        timerNotRunning(logic.pauseTimer(false));
        break;
      case 'cycle':
        let cycleSuccess = logic.updateCycle(secondParam);
        if (cycleSuccess) chatItalicMessage(responses.commandSuccess);
        else chatItalicMessage(responses.cycleWrong);
        break;
      case 'goal':
        let goalSuccess = logic.updateGoal(secondParam);
        if (goalSuccess) chatItalicMessage(responses.commandSuccess);
        else if (logic.isValidGoal(secondParam)) timerNotRunning(false);
        else chatItalicMessage(responses.goalWrong);
        break;
      case 'eta':
        logic.estimateTime();
        break;
      case 'finish':
      case 'reset':
      case 'clear':
        let finishSuccess = logic.finishTimer();
        if (!finishSuccess) chatItalicMessage(responses.notRunning);
        break;
      default:
        parsedTime = parseTime(firstParam);

        if (parsedTime) timerNotRunning(logic.updateTime(parsedTime));
        else chatItalicMessage(responses.wrongCommand);
    }
  }

  /**
   * Parses given user input of time in digital format
   * @param time - in the format of HH:MM:SS or XhYmZs entered by the user
   * @return time in seconds
   */
  function parseTime(time) {
    let hours = 0, minutes = 0, seconds = 0;

    const colonMatch = time.match(/^(\d+)(?::(\d+))?(?::(\d+))?$/);
    if (colonMatch) {
      const [, hh, mm, ss] = colonMatch;
      [hours, minutes, seconds] = ss ? [+hh, +mm, +ss] : mm ? [0, +hh, +mm] : [0, 0, +hh];
    }

    const hmsMatch = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
    if (hmsMatch) {
      hours = +(hmsMatch[1] ?? 0);
      minutes = +(hmsMatch[2] ?? 0);
      seconds = +(hmsMatch[3] ?? 0);
    }

    let timeInSeconds = hours * 3600 + minutes * 60 + seconds;
    return timeInSeconds;
  }

  function timerNotRunning(success) {
    if (success) chatItalicMessage(responses.commandSuccess);
    else chatItalicMessage(responses.notRunning);
  }

  /**
   * Sends a message in chat in italics (/me command)
   * @param {string} message
   */
  function chatItalicMessage(message) {
    if (!message) return;
    if (message === null || message == undefined) return;
    if (message === 'null' || message == 'undefined') return;
    message = message.replace(constants.channelStr, user.channel);
    streamerbot.sendMessage(`/me ${message}`);
  }

  /**
   * Console logs when the timer connects to the channel
   * @note taken from twitch documentation: https://dev.twitch.tv/docs/irc
   */
  function onConnect(data) {
    console.log('Streamer.bot is connected');
    if (isTesting) window.addEventListener('load', testRunner.runTests());
  }

  /**
   * Used for testing of the bot
   * @param {string} message
   */
  function chatCommand(message) {
    streamerbot.sendMessage(message);
  }

  module.chatItalicMessage = chatItalicMessage;
  module.chatCommand = chatCommand;

  return module;
})();
