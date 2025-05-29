const streamerbot = (function(){
	const client = new StreamerbotClient({
    host: '127.0.0.1',
    port: 6968,
    endpoint: '/',
		onConnect: (data) => {
			console.log("Streamer.bot connected");
		}
  });

	const sendMessageActionId = "796ecdc6-99a5-4144-a208-ed7bd46cb635";
	const workStartedActionId = "7c87a646-508c-4888-9719-6b7c6e9c6d94";
	const breakStartedActionId = "8e013464-201d-4038-acec-80723cdaac35";
	const finishedActionId = "1ab000a3-03bb-4383-a411-5f7dfbc65b8b";

	return {
		client,
		sendMessageActionId
	}
})();