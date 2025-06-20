const chatHandler = (function () {
  'use strict';

  const module = {};

  const user = configs.user;
  const responses = configs.responses;
  const isTesting = configs.settings.runTests;

  const client = streamerbot.client;

  client.on('Twitch.ChatMessage', onTwitchChatHandler);
  client.on('WebsocketClient.Open', onConnect);

  function onTwitchChatHandler(data) {
    const payload = data.data;

		const command = payload.message.message.split(" ")[0];
		const chatterName = payload.message.displayName;
		const message = payload.message.message.split(" ").slice(1).join(" ");

    const firstParam = message.split(" ")[0];
    const secondParam = message.split(" ")[1];

    // get is broadcaster (streamer) or moderator
		const badges = payload.message.badges;

    let isBroadCaster = false;
    let isMod = false;

		badges.forEach((badge) => {
			if (badge.name === "broadcaster") {
				isBroadCaster = true;
			} else if (badge.name === "moderator") {
				isMod = true;
			}
		});

    const msg = {
      command,
      firstParam,
      secondParam
    };

    const context = {
      isMod,
      isBroadCaster,
      chatterName
    }

    console.log(msg, context);

    messageHandler(context, msg);
  }

  /**
   * Messages from chat pass through this function to detect when the timer command is used.
   * @summary Only executes the given commands if the user is a mod or the broadcaster
   * @param target - the channel were the message came from
   * @param {JSON} context - Additional information about the message and its sender
   * @param {String} msg - The message sent in chat
   * @note This function was taken from twitch documentation: https://dev.twitch.tv/docs/irc
   */
  function messageHandler(context, msg) {
    if (!msg) return;

    const { command, firstParam, secondParam } = msg;

    if (command !== '!timer' && command !== '!start') return;

    const { isMod, isBroadCaster, chatterName } = context;
    console.log(isBroadCaster, isMod, chatterName);

    if (!(isMod || isBroadCaster)) {
      chatItalicMessage(responses.notMod, chatterName);
      return;
    }

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
   * @param time - in the format of HH:MM:SS entered by the user
   * @return time in seconds or null if invalid
   */
  function parseTime(time) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (/[hms]/i.test(time)) {
      let hourMatch = time.match(/(\d+)h/i);
      let minuteMatch = time.match(/(\d+)m/i);
      let secondMatch = time.match(/(\d+)s/i);

      if (hourMatch) hours = parseInt(hourMatch[1], 10) * 3600;
      if (minuteMatch) minutes = parseInt(minuteMatch[1], 10) * 60;
      if (secondMatch) seconds = parseInt(secondMatch[1], 10);

    } else {
      const match = time.match(/^((\d+):)?((\d+):)?(\d+)$/);

      if (match) {
        hours = parseInt(match[2], 10) * 3600;
        minutes = parseInt(match[4], 10) * 60;
        seconds = parseInt(match[5], 10);
      }
    }

    let timeInSeconds = hours + minutes + seconds;
    if (isNaN(timeInSeconds)) return null;
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
    streamerbot.sendMessage(`/me ${message}`)
  }

  /**
   * Console logs when the timer connects to the channel
   * @note taken from twitch documentation: https://dev.twitch.tv/docs/irc
   */
  function onConnect(data) {
    console.log("Streamer.bot is connected");
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
