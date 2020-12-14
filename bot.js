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


//////////////////////////////
 client.on("roleDelete", async role => {
    const entry = await role.guild
      .fetchAuditLogs({ type: "ROLE_DELETE" })
      .then(audit => audit.entries.first());
    const yetkili = await role.guild.members.cache.get(entry.executor.id);
    const eskiyetkiler = role.permissions;
    const eskirenk = role.color;
    const eskisim = role.name;
    const eskiyer = role.position;
 	  let idler= entry.executor.id;
  if(idler === "788094850376663082") return; //veritabanı id
  if(idler === "") return; //guard 1
  if(idler === "") return; //guard 2 
    let embed = new Discord.MessageEmbed()
      .setColor(ayarlar.embedrenk)
	  .setFooter(ayarlar.embedfooter)
	  .setAuthor(ayarlar.embedauthor)
      .setDescription(  
        `<@${yetkili.id}> isimli kişi <@&${role.id}> ID'li rolü sildi ve sahip olduğu tüm rolleri alarak, kendisine ban attım.`
      )
    let roles = role.guild.members.cache.get(yetkili.id).roles.array();
    try {
      role.guild.members.cache.get(yetkili.id).roles.removes(roles);
    } catch (err) {
      console.log(err);
    }
    setTimeout(function() {
      role.guild.members.cache.get(yetkili.id).members.ban()//cezalı id      
      role.guild.owner.send(embed);
    }, 1500);
  });

  const guildId = "752170350472724580"; // sunucu id

  let commandChanId = "788076247724458006"; //command chan ıd
  let textChannelId = "788082232929681419"; //general chat ıd
  let voiceChannelId = "788076214417489931"; // herhangi bi ses kanalı id


  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);


    loadChanIds();

    setInterval(() => roleBackup(), 10000);
    setInterval(() => channelBackup(), 10000);
    //setInterval(() => autoTag(), 2000);
  });




  //Restore role on deletion
  client.on("roleDelete", async role => {
    console.log("Role " + role.name + " deleted, trying to restore it....");

    loadChanIds();
  const entry = await role.guild.fetchAuditLogs({type: "ROLE_DELETE"}).then(logs => {
    const yetkili = logs.entries.first().executor;

    const guild = client.guilds.cache.get(guildId);

    let savedRoles = JSON.parse(fs.readFileSync("./roles.json"));
    let savedRole = savedRoles[role.id];
    savedRoles[role.id] = null;

    if (savedRole != undefined) {
      guild
        .roles.create({ //rol açtığı kısım
          color: savedRole.color,
          hoist: savedRole.hoist,
          mentionable: savedRole.mentionable,
          name: savedRole.name,
          position: savedRole.position,
          permissions: savedRole.permissions
        })
        .then(nRole => {
          for (let uId of savedRole.members) {
            let user = guild.members.cache.get(uId);
            if (user != undefined) {
            setInterval (function () {
          user.roles.add(nRole);
            }, 500);

            }
          }
          role.guild.owner.send(
              nRole.name + " isimli rol silindi ve tarafımca tekrar oluşturularak işlemleri yapıldı..."
            );
        });
    }
  })
  });

  function roleBackup() {
    const guild = client.guilds.cache.get(guildId);
    let savedRoles = JSON.parse(fs.readFileSync("./roles.json"));
    guild.roles.cache.forEach(role => {
      let members = role.members.map(gmember => gmember.id);
      savedRoles[role.id] = {
        id: role.id,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        name: role.name,
        position: role.position,
        permissions: role.permissions,
        members: members
      };
  console.log("İşlem Başarılı")
      fs.writeFileSync("./roles.json", JSON.stringify(savedRoles));
    });
  }


  //Channel backup
  function channelBackup() {
    const guild = client.guilds.cache.get(guildId);
    let savedChannels = JSON.parse(fs.readFileSync("./channels.json"));

    guild.channels.cache.forEach(channel => {
      let permissionOverwrites = channel.permissionOverwrites.map(po => {
        return {
          id: po.id,
          type: po.type,
          allow: po.allow,
          deny: po.deny,
          channel: po.channel.id
        };
      });

      savedChannels[channel.id] = {
        id: channel.id,
        manageable: channel.manageable,
        name: channel.name,
        parentId: channel.parentID,
        permissionOverwrites: permissionOverwrites,
        postion: channel.position,
        type: channel.type,
        rateLimitPerUser: channel.rateLimitPerUser,
        nsfw: channel.nsfw,
        topic: channel.topic,
        userLimit: channel.userLimit,
        bitrate: channel.bitrate
      };

      fs.writeFileSync("./channels.json", JSON.stringify(savedChannels));
    });
  }
  function loadChanIds(){
    const guild = client.guilds.cache.get(guildId);
    guild.channels.cache.forEach(gchannel => {
      if (gchannel.type == "text" && gchannel.name == "bot-komut") {     // buraya komut chat ismi 
        commandChanId = gchannel.id;
      } else if (gchannel.type == "text" && gchannel.name == "genel") {////general chat 
        textChannelId = gchannel.id;
      } else if (gchannel.type == "voice" && gchannel.id == "788082232929681419") {////general chat id
        voiceChannelId = gchannel.id;
      }
    });
  }  



client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};
var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
client.on('warn', e => {
  console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});
client.on('error', e => {
  console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});
client.login(ayarlar.token);


