import { Telegraf } from 'telegraf';
import dialogflow from '@google-cloud/dialogflow';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome! Please tell me your name.'));

bot.on('text', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const message = ctx.message.text.trim();

  const sessionClient = new dialogflow.SessionsClient();
  const sessionId = `${chatId}-${Date.now()}`; // generate a unique session ID
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, chatId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'en-US',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    if (result.intent.displayName === 'question1') {
      // Ask the next question
      ctx.session = { question: 2 };
      ctx.reply('What is your favorite color?');
    } else if (result.intent.displayName === 'question2') {
      // Ask the final question
      ctx.session.question = 3;
      ctx.session.color = result.parameters.fields.color.stringValue;
      ctx.reply('What is your favorite food?');
    } else if (result.intent.displayName === 'question3') {
      // Generate a recommendation based on the user's input
      const color = ctx.session.color;
      const food = result.parameters.fields.food.stringValue;
      const recommendation = generateRecommendation(color, food);

      ctx.reply(recommendation);
    } else {
      // Handle unknown intents
      ctx.reply('I didn\'t understand what you said. Can you please try again?');
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
});

// Define a custom function to generate recommendations
function generateRecommendation(color, food) {
  // Your recommendation logic here
  return `You should try the ${color} ${food}!`;
}

bot.launch();
