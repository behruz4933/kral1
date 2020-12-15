const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const moment = require("moment");
var Jimp = require("jimp");
const { Client, Util } = require("discord.js");
const fs = require("fs");
const db = require("quick.db");
const http = require("http");
const express = require("express");
require("./util/eventLoader.js")(client);
const path = require("path");
const snekfetch = require("snekfetch");
const app = express();

app.get("/", (request, response) => {
  response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`Lrows V12 Guard Aktif`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   lrowsconsole.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });lrows

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.login(ayarlar.token);

//------------------------KANAL KORUMA-----------------------------\\

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
      .get(ayarlar.korumakanal)
      .send(embed)
      .then(channel.clone().then(x => x.setPosition(channel.position)));
  }
});

//---------------------------ROL KORUMA------------------------------\\

client.on("roleDelete", async role => {
  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id) return;
  if (entry.executor.id === role.guild.owner.id) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle("Bir Rol Silindi!");
    embed.addField("Rolü Silen", "`" + entry.executor.tag + "`");
    embed.addField("Rolü Silen İD", "`" + entry.executor.id + "`");
    embed.addField("Silinen Rol", "`" + role.name + "`");
    embed.addField("Sonuç;", "Rol Tekrar Açıldı");
    embed.setThumbnail(entry.executor.avatarURL());
    embed.setFooter(role.guild.name, role.guild.iconURL());
    embed.setColor("RED");
    embed.setTimestamp();
    client.channels.cache
      .get(ayarlar.korumakanal)
      .send(embed)
      .then(
        role.guild.roles.create({
          data: {
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions,
            mentionable: role.mentionable,
            position: role.position
          },
          reason: "Silinen Rol Açıldı."
        })
      );
  }
});

//-----------------------LOG------------------------\\

client.on("messageDelete", function(msg) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ dynamic: true }))
    .setDescription(
      "**Message sent by <@" +
        msg.author.id +
        "> deleted in <#" +
        msg.channel.id +
        ">**\n**Message**:\n" +
        msg.content
    )
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + msg.author.id + " | Guild: " + msg.guild.id);
  client.channels.cache.get("781188179586711593").send(Embed);
});
client.on("messageUpdate", function(oldMsg, newMsg) {
  if (
    !newMsg.partial ||
    oldMsg.content == newMsg.content ||
    !newMsg.content ||
    !oldMsg.content ||
    oldMsg.author.bot ||
    oldMsg.guild == null
  )
    return;
  let Embed = new Discord.MessageEmbed()
    .setAuthor(
      newMsg.author.tag,
      newMsg.author.displayAvatarURL({ dynamic: true })
    )
    .setDescription(
      "**Message sent by <@" +
        newMsg.author.id +
        "> edited in <#" +
        newMsg.channel.id +
        ">**\n**Before**:\n" +
        oldMsg.content +
        "\n\n**After**:\n" +
        newMsg.content +
        "\n\n[Message Link](" +
        newMsg.url +
        ")"
    )
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + newMsg.author.id + " | Guild: " + newMsg.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("channelCreate", function(channel) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(
      channel.guild.name,
      "https://cdn.discordapp.com/avatars/" +
        channel.guild.id +
        "/" +
        channel.guild.icon
    )
    .setDescription("**New Channel Created**:\n<#" + channel.id + ">")
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + channel.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("channelDelete", function(channel) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(channel.guild.name, channel.guild.iconURL({ dynamic: true }))
    .setDescription("**Channel Deleted**:\n" + channel.name)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + channel.guild.id);
  client.channels.cache.get("781188179586711593").send(Embed);
});
client.on("guildBanAdd", function(guild, member) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
    .setDescription("**Member Banned:**:\n" + member.tag)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + member.id + " | Guild: " + guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("guildBanRemove", function(guild, member) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
    .setDescription("**Member Unbanned:**:\n" + member.tag)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("User: " + member.id + " | Guild: " + guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("inviteCreate", function(invite) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(invite.guild.name, invite.guild.iconURL({ dynamic: true }))
    .setDescription("**Invite Created:** " + invite.url)
    .addField("By:", "```" + invite.inviter.tag + "```", true)
    .addField("Channel:", "```" + invite.channel.name + "```", true)
    .addField("Member Count:", "```" + invite.memberCount + "```", true)
    .addField("Uses:", "```" + invite.uses + "```", true)
    .addField("Max Age:", "```" + invite.maxAge + "```", true)
    .addField("Temporary?", "```" + invite.temporary + "```", true)
    .addField("Expires At:", "```" + invite.expiresAt + "```")
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter(
      "By: " + invite.inviter.tag + " | Guild: " + invite.guild.id,
      invite.inviter.displayAvatarURL({ dynamic: true })
    );
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("roleCreate", function(role) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(role.guild.name, role.guild.iconURL({ dynamic: true }))
    .setDescription("**Role Created:**:\n" + role.name)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + role.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
client.on("roleUpdate", function(oldRole, newRole) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(newRole.guild.name, newRole.guild.iconURL({ dynamic: true }))
    .setDescription("**Role Updated:**:\n" + oldRole.name)
    .addField("Changes:", "Will be done soon")
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + newRole.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});

client.on("roleDelete", function(role) {
  let Embed = new Discord.MessageEmbed()
    .setAuthor(role.guild.name, role.guild.iconURL({ dynamic: true }))
    .setDescription("**Role Deleted:**:\n" + role.name)
    .setTimestamp()
    .setColor(ayarlar.embed_color)
    .setFooter("Guild: " + role.guild.id);
  client.channels.cache.get(ayarlar.kanal).send(Embed);
});
