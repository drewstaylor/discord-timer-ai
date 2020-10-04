const dotenv = require('dotenv').config();
const Discord = require('discord.js');

import { Timezones } from './timezones';

const HOURS_TO_MILLISECONDS = 3600000;
const MINUTES_TO_MILLISECONDS = 60000;
const SECONDS_TO_MILLISECONDS = 1000;

// Config parser
let config;
if (dotenv.error) {
  throw dotenv.error
} else {
  config = dotenv.parsed;
}

const client = new Discord.Client();

function secondsToHMS(totalSeconds) {
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  return {h: hours, m: minutes, s: seconds};
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content.substring(0,6) === '!timer') {
    let msgPieces = msg.content.split(' ');
    let end,
        rawEnd,
        timer,
        seconds,
        minutes,
        hours,
        now = new Date(),
        timezone;
    if (msgPieces.length < 2) {
      return msg.reply('I don\'t understand, tell me more 🤔');
    }

    // Start worker
    try {
      // Parse user args
      if (msgPieces.length === 3) { 
        timezone = msgPieces[3];
        if (Timezones.indexOf(timezone) < 0) {
          let tzUrl = "https://gist.github.com/drewstaylor/ded816531ca8632062e1fb93b30a270b";
          return msg.reply('What a strange timezone you live in, I don\'t understand ' + timezone + ' 🤔. See ' + tzUrl + ' for a list of supported timezones.');
        }
      } else {
        timezone = false;
      }
      rawEnd = msgPieces[2];
      // Split arg entities
      let tmpEnd = rawEnd.split(':');
      switch (tmpEnd.length) {
        case 1:
          hours = 0;
          minutes = 0;
          seconds = parseInt(tmpEnd[0]);
          break;
        case 2:
          hours = 0;
          minutes = parseInt(tmpEnd[0]);
          seconds = parseInt(tmpEnd[1]);
          break;
        case 3:
          hours = arseInt(tmpEnd[0]);
          minutes = parseInt(tmpEnd[1]);
          seconds = parseInt(tmpEnd[2]);
          break;
        default:
          return msg.reply('I don\'t understand, tell me more 🤔');
      }
      // Calculate alarm end
      end = now.getTime();
      end += hours * HOURS_TO_MILLISECONDS;
      end += minutes * MINUTES_TO_MILLISECONDS;
      end += seconds * SECONDS_TO_MILLISECONDS;
      // Instance of timer object
      timer = {
        start: now,
        end: end,
        timezone: timezone
      };
    // Throw
    } catch(e) {
      console.log(JSON.stringify(e))
      return msg.reply('I don\'t understand, tell me more 🤔');
    // Parser callback
    } finally {
      let finished = (timer.end - timer.start);
      let asSeconds = finished / SECONDS_TO_MILLISECONDS;
      let HMS = secondsToHMS(asSeconds);
      let alarmMsg = 'Timer finished in ' + HMS.h + ' hours, ' + HMS.m + ' minutes and ' + HMS.s + ' seconds.';
      let alarmResolved;
      if (timezone) {
        alarmResolved = new Date().toLocaleString("en-US", {timeZone: timezone});;
      } else {
        alarmResolved = new Date().toString();
      }
      alarmMsg += ' Alarm finished time is ' + alarmResolved;
      // Create alarm
      setTimeout(() => {
        msg.reply(alarmMsg);
      }, finished);
      // Update channel with alarm start
      let alarmCreateMsg = 'New timer started at ' + new Date().toString() + ', finishing at ' + alarmResolved;
      msg.reply(alarmCreateMsg);
    }
  }
});

client.login(config.DISCORD_TOKEN);
