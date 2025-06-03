const streamerbot = (function(){
	const client = new StreamerbotClient({
    host: configs.sb.address,
    port: configs.sb.port,
    endpoint: configs.sb.endpoint
  });

	/**
   * Sends message via StreamerBot action (importing download)
   * @param {string} message 
   */
  async function sendMessage(message) {
    // for debugging, use
    // const response = await client.doAction(...)
    await client.doAction(
      "796ecdc6-99a5-4144-a208-ed7bd46cb635",
      {
        message: message
      }
    )
  }

	async function workTimerStarted() {
		await client.doAction(
      "7c87a646-508c-4888-9719-6b7c6e9c6d94",
    )
	}

	async function breakTimerStarted() {
		await client.doAction(
      "8e013464-201d-4038-acec-80723cdaac35",
    )
	}

	async function finishedTimer() {
		await client.doAction(
      "1ab000a3-03bb-4383-a411-5f7dfbc65b8b",
    )
	}

  async function runAd() {
    await client.doAction(
      "b18f768c-3747-462d-acca-2d7c6728e3f5"
    )
  }

	return {
		client,
		sendMessage,
		workTimerStarted,
		breakTimerStarted,
		finishedTimer,
    runAd
	}
})();