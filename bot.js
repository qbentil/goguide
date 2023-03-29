import { Telegraf } from "telegraf";
import { cities } from "./utils/cities.js";
import dotenv from "dotenv";
import { intents } from "./utils/intents.js";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);
console.log("Bot started 🚀");
let introMessage = `
Welcome! 👋

You're definitely here to find a resort, hotel or attraction site for your journey.😊✨
Well then, let's get started!

Respond to this message with /YES to continue.
`;

let awaitingLocation = false;
let awaitingDestination = false;
let awaitingRideOption = false;

let userData = {
  location: "",
  destination: "",
  rideOption: "",
};

// Start bot greetings
bot.start((ctx) => ctx.reply(introMessage));

// Handle incoming messages
bot.on("text", (ctx) => {
  const message = ctx.message.text.trim().toLowerCase();
  // console.log("message", message);

  // Check if bot is waiting for location input
  if (awaitingLocation) {
    // Check if user location is in the list of cities

    if (cities.find((city) => city.name.toLowerCase() == message)) {
      userData.location = message;
      awaitingLocation = false;
      awaitingDestination = true;
      ctx.reply(`Great! Your location is ${message}. What's your destination?`);
    } else {
      ctx.reply(
        `Sorry, we do not provide service in ${message}. Please provide a valid location from our list of cities: \n [${cities.join(
          ", "
        )}]`
      );
    }
  } else if (awaitingDestination) {
    // Check if user destination is in the list of cities
    if (cities.find((city) => city.name.toLowerCase() == message)) {
      userData.destination = message;
      awaitingDestination = false;
      awaitingRideOption = true;
      ctx.reply(
        `Awesome! Your destination is ${message}.  "What type of ride do you prefer? \n 1️⃣ - Uber \n 2️⃣ - Bus \n 3️⃣ - Private Car`
      );
    } else {
      ctx.reply(
        `Sorry, we do not provide service in ${message}. Please provide a valid location from our list of cities: \n [${cities.join(
          ", "
        )}]`
      );
    }
  } else if (awaitingRideOption) {
    // Save user's ride option
    const validOptions = ["1", "2", "3"];
    if (!validOptions.includes(message)) {
      ctx.reply("Please enter a valid option.");
    } else {
      userData.rideOption = message;
      awaitingRideOption = false;

      // Call function to make choice based on user data
      const response = makeChoice(userData);
      ctx.reply(response);
    }
  } else {
    // Search for a matching intent
    const intent = intents.find((i) => {
      if (i.patterns) {
        return i.patterns.some((p) => message.includes(p));
      }
    });
    // Send a response based on the intent
    if (intent) {
      const response =
        intent.responses[Math.floor(Math.random() * intent.responses.length)];
      ctx.reply(response);
      if (intent.name === "starter") {
        awaitingLocation = true;
        ctx.reply("Please tell me your current location");
      }
    } else {
      // Send a default response
      const defaultIntent = intents.find((i) => i.name === "unknown");
      const response =
        defaultIntent.responses[
          Math.floor(Math.random() * defaultIntent.responses.length)
        ];
      ctx.reply(response);
    }
  }
});

// Function to make choice based on user data
// Function to make choice based on user data
function makeChoice(userData) {
  const location = cities.find((city) =>
    city.name.toLowerCase().includes(userData.location.toLowerCase())
  );
  const destination = cities.find((city) =>
    city.name.toLowerCase().includes(userData.destination.toLowerCase())
  );

  if (!location || !destination) {
    return "Sorry, we couldn't find information about that location or destination.";
  }

  let options = [];

  // Check the ride option to suggest appropriate locations
  if (userData.rideOption == 2) {
    options = location.busStops;
  } else {
    options = [
      ...destination.restaurants,
      ...destination.hotels,
      ...destination.attractions,
    ];
  }

  // console.log("options1", options);

  // Filter options by checking any of the options is in hotels, restaurants or attractions of the destination
  // options = options.filter((option) => {
  //   return (
  //     destination.hotels.find((hotel) => hotel.name.toLowerCase() == option.name.toLowerCase()) ||
  //     destination.restaurants.find(
  //       (restaurant) => restaurant.name.toLowerCase() == option.name.toLowerCase()
  //     ) ||
  //     destination.attractions.find(
  //       (attraction) => attraction.name.toLowerCase() == option.name.toLowerCase()
  //     )
  //   );
  // });

  // Check if there are any options
  if (options.length == 0) {
    return "Sorry, we couldn't find any options for that destination.";
  }

  // Return numbered list of options and state wether it's a hotel, restaurant or attraction
  let response = "Here are your options: \n";
  let counter = 1;
  options.forEach((option) => {
    response += `\n${counter}. ${option.name} - ${
      destination.hotels.find(
        (hotel) => hotel.name.toLowerCase() == option.name.toLowerCase()
      )
        ? "Hotel"
        : destination.restaurants.find(
            (restaurant) =>
              restaurant.name.toLowerCase() == option.name.toLowerCase()
          )
        ? "Restaurant"
        : "Attraction"
    }`;
    counter++;
  });


  // Estimate the time and cost of the trip based on the ride option and distance between the two cities
  const distance = location.distanceTo[userData.destination.split(" ")[0]];
  console.log("distance", distance);
  let time = 0;
  let cost = 0;
  if (userData.rideOption == 1) {
    time = distance / 60;
    cost = distance * 0.5;
  } else if (userData.rideOption == 2) {
    time = distance / 30;
    cost = distance * 0.2;
  } else {
    time = distance / 100;
    cost = distance * 1;
  }
  
  response+=`\n\n============ ESTIMATIONS ==============`;
  response+= `\nLocation: ${userData.location}`;
  response+= `\n Destination: ${userData.destination}`;
  response+= `\n Ride Option: ${userData.rideOption == 1 ? "Uber" : userData.rideOption == 2 ? "Bus" : "Private Car"}`;
  response+= `\n Distance: ${distance} km`;
  response += `\nEstimated time: ${time.toFixed(2)} hours`;
  response += `\nEstimated cost: GHC${cost.toFixed(2)}`;
  response+=`\n\n=======================================`;
  
  
  return response;
}

// Start the bot
bot.start((ctx) => ctx.reply("Welcome!"));

bot.launch();
