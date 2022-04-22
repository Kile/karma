const karmaKv = new pylon.KVNamespace('karma');

const Commands = new discord.command.CommandGroup();

async function getBalance(userId: discord.Snowflake): Promise<number> {
  const bal = await karmaKv.get<number>(userId);
  return bal || 0;
}

discord.on('MESSAGE_CREATE', async (message) => {
  const user = await discord.getUser(message.mentions[0].id);

  if (message.mentions[0] == null) {
    return;
  }

  if (
    (message.content.toLowerCase().includes('thanks') ||
      message.content.toLowerCase().includes('thx') ||
      message.content.toLowerCase().includes('thank you') ||
	    message.content.toLowerCase().match(/\bty\b/)) &&
    message.author.id != message.mentions[0].id
  ) {
    if (
      ((await karmaKv.get<any>(`timeOut.${message.mentions[0].id}`)) ?? 0) +
        3600000 <=
      new Date().getTime()
    ) {
      await karmaKv.put(
        `timeOut.${message.mentions[0].id}`,
        new Date().getTime()
      );

      const karma = await karmaKv.get<number>(
        `karma.${message.mentions[0].id}` ?? 0
      );
      await karmaKv.cas(
        `karma.${message.mentions[0].id}`,
        karma,
        (karma ?? 0) + 1
      );

      await message.reply(
        user.toMention() +
          ' got +1 karma! (The user has now: ' +
          (await karmaKv.get<number>(`karma.${message.mentions[0].id}`)) +
          ' karma!)'
      );
    } else {
      await message.reply(
        'The user: ' +
          user.toMention() +
          ' was thank last time in less than one hour! Please wait to rethank them.'
      );
    }
  }
});

Commands.on(
  {
    name: 'karma',
    description: 'Displays your karma'
  },
  (args) => ({
    target: args.guildMemberOptional()
  }),
  async (message, { target }) => {
    target = target || message.member;

    const karmabalance = await karmaKv.get<number>(`karma.${target.user.id}`);

    await message.reply({
      content: `🙏 ${target.toMention()} has ${karmabalance} karma`,
      allowedMentions: {
        users: [message.author]
      }
    });
  }
);
