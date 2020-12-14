client.on("channelDelete", async channel => {
  const entry = await channel.guild
    .fetchAuditLogs({ type: "CHANNEL_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id) return;
  if (entry.executor.id === channel.guild.owner.id) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle("Bir Kanal Silindi!");
    embed.addField("Kanalı Silen", "`" + entry.executor.tag + "`");
    embed.addField("Kanalı Silen İD", "`" + entry.executor.id + "`");
    embed.addField("Silinen Kanal", "`" + channel.name + "`");
    embed.addField("Sonuç;", "Kanal Tekrar Açıldı");
    embed.setThumbnail(entry.executor.avatarURL());
    embed.setFooter(channel.guild.name, channel.guild.iconURL());
    embed.setColor("RED");
    embed.setTimestamp();
    client.channels.cache
      .get("LOG KANAL ID")
      .send(embed)
      .then(channel.clone().then(x => x.setPosition(channel.position)));
  }
});
