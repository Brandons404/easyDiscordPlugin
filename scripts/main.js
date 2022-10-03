const utils = require('helper');
importPackage(Packages.arc.util);

// for testing locally
// const ip = 'localhost';
const ip = '45.79.202.111';

const discordPrefix = '';
let channelId = '';
let serverCommands;

const sendMessage = (msg) => {
  const postBody = {
    channel: channelId,
    msg: msg,
  };

  const stringPostBody = JSON.stringify(postBody);

  const req = Http.post(`http://` + ip + `:5000/api/chat`, stringPostBody)
    .header('Content-Type', 'application/json')
    .header('Accept', '*/*');
  req.timeout = 10000;

  try {
    req.submit((response, exception) => {
      if (exception || !response) {
        Log.info(
          '\n\nDiscord bot encountered an error while trying to send a message to discord.\n\n'
        );
      }
      return;
    });
  } catch (e) {
    Log.info('\n\nDiscord bot encountered an error while trying to send a message to discord.\n\n');
  }
};

Events.on(PlayerJoin, (e) => {
  const player = e.player;
  const formattedName = Strings.stripColors(player.name);
  const msg = '**' + formattedName + ' Joined.' + '**';

  sendMessage(msg);
});

Events.on(PlayerLeave, (e) => {
  const player = e.player;
  const formattedName = Strings.stripColors(player.name);
  const msg = '**' + formattedName + ' Left.' + '**';

  sendMessage(msg);
});

Events.on(PlayerChatEvent, (e) => {
  const player = e.player;
  const text = e.message;

  if (text[0] === '/') return;

  const formattedName = Strings.stripColors(player.name);
  const lastChar1 = formattedMessage[formattedMessage.length - 1];

  if (lastChar1 >= 0xf80 && lastChar1 <= 0x107f) {
    formattedMessage = formattedMessage.slice(0, -2);
  }

  const msg = '**' + formattedName + '**' + ': ' + formattedMessage;

  sendMessage(msg);
});

Events.on(ServerLoadEvent, (e) => {
  serverCommands = Core.app.listeners.find(
    (l) => l instanceof Packages.mindustry.server.ServerControl
  ).handler;

  const runner = (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });

  const savedChannelId = Core.settings.get('discordChatBot', '');

  if (savedChannelId === '') {
    Log.info(
      '\n\nDiscord Bot: No discord channel was found. Please use "setchannel <channelId> to set it!\n\n'
    );
  }

  if (savedChannelId !== '') {
    channelId = savedChannelId;
  }

  // setChannel
  serverCommands.register(
    'setchannel',
    '<channelId>',
    'set the discord channel id to sync with.',
    runner((args) => {
      channelId = args[0];

      Core.settings.put('discordChatBot', channelId);
      Core.settings.manualSave();
      Log.info('Discord channel id set to: ' + channelId);
      return;
    })
  );
});

Timer.schedule(
  () => {
    if (!channelId) return;

    const postBody = {
      channelId: channelId,
    };

    const stringPostBody = JSON.stringify(postBody);

    const req = Http.post(`http://` + ip + `:5000/api/discord`, stringPostBody)
      .header('Content-Type', 'application/json')
      .header('Accept', '*/*');
    req.timeout = 10000;

    try {
      req.submit((response, exception) => {
        if (exception || !response) return;
        let messages = response.getResultAsString();
        messages = JSON.parse(messages).messages;
        if (messages.length > 0) Call.sendMessage(messages);
      });
    } catch (e) {
      Log.info('\n\nDiscord Bot: There was a problem getting discord messages.\n\n');
    }
  },
  10,
  3
);
