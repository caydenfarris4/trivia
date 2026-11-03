// THE BIG BOARD (Jeopardy-style) — question bank. Four full boards, each with its own Final round.
// Source: jeopardy_bank (1).csv. To add a board, copy one of the objects below and edit it.
//
// Format:
//   board:      { name, dailyDoubles (how many are hidden, default 1), categories:[...], final }
//   category:   { name, clues:[ { v: dollar value, q: clue text, a: answer }, ... ] } easiest -> hardest
//   final:      { category, q, a }
window.BANKS = window.BANKS || {};
window.BANKS.jeopardy = { boards: [
 {
  "name": "Game 1",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Flags & Symbols",
    "clues": [
     {
      "v": 200,
      "q": "This Himalayan country has the only national flag that isn't a rectangle or square, basically two stacked triangles.",
      "a": "Nepal"
     },
     {
      "v": 400,
      "q": "Every other U.S. state flag is a rectangle, but this Midwestern state flies a swallowtail pennant.",
      "a": "Ohio"
     },
     {
      "v": 600,
      "q": "Chad's flag is nearly identical to this European country's, which complained to the UN like a kid yelling \"he's copying me!\"",
      "a": "Romania"
     },
     {
      "v": 800,
      "q": "This fire-breathing creature is the star of Wales' flag, which is the coolest flag in the UK and I won't take questions.",
      "a": "A red dragon"
     },
     {
      "v": 1000,
      "q": "Mozambique's flag features a book, a hoe, and this Soviet-designed rifle, making it one of the few flags with a firearm.",
      "a": "AK-47"
     }
    ]
   },
   {
    "name": "Movie Quotes",
    "clues": [
     {
      "v": 200,
      "q": "\"I'm the king of the world!\" (name the film)",
      "a": "Titanic"
     },
     {
      "v": 400,
      "q": "\"You can't sit with us!\" (name the film)",
      "a": "Mean Girls"
     },
     {
      "v": 600,
      "q": "\"Why so serious?\" (name the film)",
      "a": "The Dark Knight"
     },
     {
      "v": 800,
      "q": "\"I volunteer as tribute!\" (name the film)",
      "a": "The Hunger Games"
     },
     {
      "v": 1000,
      "q": "\"There's no crying in baseball!\" (name the film)",
      "a": "A League of Their Own"
     }
    ]
   },
   {
    "name": "Wild History",
    "clues": [
     {
      "v": 200,
      "q": "In the 1630s, Dutch people went broke over the price of this flower.",
      "a": "Tulips"
     },
     {
      "v": 400,
      "q": "In 1932, Australia sent soldiers with machine guns to fight these giant flightless birds, and the birds basically won.",
      "a": "Emus"
     },
     {
      "v": 600,
      "q": "This 1859 U.S.-Britain standoff over the San Juan Islands had exactly one casualty: a pig shot for eating potatoes.",
      "a": "The Pig War"
     },
     {
      "v": 800,
      "q": "In 1919, a tank burst and sent a wave of this sticky stuff through the streets of Boston.",
      "a": "Molasses"
     },
     {
      "v": 1000,
      "q": "In 1518, hundreds of people in Strasbourg couldn't stop doing this, in what's known as a \"plague.\"",
      "a": "Dancing"
     }
    ]
   },
   {
    "name": "Before & After",
    "clues": [
     {
      "v": 200,
      "q": "New York City's nickname and the dessert at your Fourth of July cookout.",
      "a": "Big Apple Pie"
     },
     {
      "v": 400,
      "q": "Tony Stark's Marvel alter ego and Superman's 2013 film.",
      "a": "Iron Man of Steel"
     },
     {
      "v": 600,
      "q": "Simba's Disney movie and the giant ape who climbs the Empire State Building.",
      "a": "Lion King Kong"
     },
     {
      "v": 800,
      "q": "The princess who pricked her finger on a spindle and the tale of an enchanted rose.",
      "a": "Sleeping Beauty and the Beast"
     },
     {
      "v": 1000,
      "q": "Gal Gadot's Amazonian hero and Viola Davis' 2022 warrior epic.",
      "a": "Wonder Woman King"
     }
    ]
   },
   {
    "name": "Food & Drink",
    "clues": [
     {
      "v": 200,
      "q": "This cheese is the white, melty blob on a Margherita pizza.",
      "a": "Mozzarella"
     },
     {
      "v": 400,
      "q": "This spice, made from crocus flowers, costs more than your rent per ounce.",
      "a": "Saffron"
     },
     {
      "v": 600,
      "q": "Tequila can only be made from this spiky plant.",
      "a": "Blue agave"
     },
     {
      "v": 800,
      "q": "Most \"wasabi\" at American sushi spots is really dyed green paste made from this root.",
      "a": "Horseradish"
     },
     {
      "v": 1000,
      "q": "The Scoville scale measures how painfully hot a chili is, and it's named after this pharmacist.",
      "a": "Wilbur Scoville"
     }
    ]
   }
  ],
  "final": {
   "category": "Presidents",
   "q": "This sixth president reportedly kept a pet alligator, a gift from Lafayette, in the unfinished East Room of the White House.",
   "a": "John Quincy Adams"
  }
 },
 {
  "name": "Game 2",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Capitals & Cities",
    "clues": [
     {
      "v": 200,
      "q": "Everyone assumes Sydney, but Australia's capital is this city, built from scratch partly because Sydney and Melbourne couldn't stop arguing.",
      "a": "Canberra"
     },
     {
      "v": 400,
      "q": "It's not Istanbul, and Turkey's capital would like you to stop guessing wrong.",
      "a": "Ankara"
     },
     {
      "v": 600,
      "q": "This chilly city is the world's northernmost capital of a sovereign state.",
      "a": "Reykjavik"
     },
     {
      "v": 800,
      "q": "Burkina Faso's capital has a name that's a nightmare to spell and a joy to say.",
      "a": "Ouagadougou"
     },
     {
      "v": 1000,
      "q": "Bolivia can't pick just one: La Paz runs the government, but this city is the constitutional capital.",
      "a": "Sucre"
     }
    ]
   },
   {
    "name": "Brand Name Origins",
    "clues": [
     {
      "v": 200,
      "q": "This search giant is named after a misspelling of \"googol,\" a 1 followed by this many zeros.",
      "a": "100"
     },
     {
      "v": 400,
      "q": "Starbucks is named after the first mate in this whale-hunting classic novel.",
      "a": "Moby-Dick"
     },
     {
      "v": 600,
      "q": "Nike is named for the Greek goddess of this.",
      "a": "Victory"
     },
     {
      "v": 800,
      "q": "Lego comes from a Danish phrase that means this.",
      "a": "\"Play well\""
     },
     {
      "v": 1000,
      "q": "Adidas combines founder Adi's nickname with the first three letters of this last name.",
      "a": "Dassler"
     }
    ]
   },
   {
    "name": "TV Characters",
    "clues": [
     {
      "v": 200,
      "q": "He is Dunder Mifflin's Scranton branch manager and the world's best boss, according to his mug.",
      "a": "Michael Scott"
     },
     {
      "v": 400,
      "q": "On Friends, Ross has a pet monkey with this name.",
      "a": "Marcel"
     },
     {
      "v": 600,
      "q": "Walter White's drug-kingpin alias in Breaking Bad is this scientist's name.",
      "a": "Heisenberg"
     },
     {
      "v": 800,
      "q": "Leslie Knope fights for the parks department in this fictional Indiana town.",
      "a": "Pawnee"
     },
     {
      "v": 1000,
      "q": "In Game of Thrones, this is the name of Jon Snow's quiet, white direwolf.",
      "a": "Ghost"
     }
    ]
   },
   {
    "name": "Gross but True",
    "clues": [
     {
      "v": 200,
      "q": "The average person does this about a dozen or more times a day, and most of us pretend we don't.",
      "a": "Passes gas"
     },
     {
      "v": 400,
      "q": "Poop is roughly three-quarters this very ordinary liquid.",
      "a": "Water"
     },
     {
      "v": 600,
      "q": "Your stomach is full of this acid, which helps break down food.",
      "a": "Hydrochloric acid"
     },
     {
      "v": 800,
      "q": "Nearly every adult has microscopic mites living in their pores and on these facial hairs.",
      "a": "Eyelashes"
     },
     {
      "v": 1000,
      "q": "Earwax has a fancy scientific name, and it's this.",
      "a": "Cerumen"
     }
    ]
   },
   {
    "name": "Animals & Nature",
    "clues": [
     {
      "v": 200,
      "q": "This is the biggest animal on Earth, with a heart the size of a small car.",
      "a": "The blue whale"
     },
     {
      "v": 400,
      "q": "A group of crows is called this dramatic, slightly threatening word.",
      "a": "A murder"
     },
     {
      "v": 600,
      "q": "This is the only mammal capable of true, sustained flight.",
      "a": "The bat"
     },
     {
      "v": 800,
      "q": "An octopus has this many hearts, and it still can't get over its ex.",
      "a": "Three"
     },
     {
      "v": 1000,
      "q": "This Australian marsupial is the only animal known to produce cube-shaped poop.",
      "a": "The wombat"
     }
    ]
   }
  ],
  "final": {
   "category": "Mayors",
   "q": "For about 20 years, a cat named this was the honorary mayor of Talkeetna, Alaska.",
   "a": "Stubbs"
  }
 },
 {
  "name": "Game 3",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Fast Food & Snack Wars",
    "clues": [
     {
      "v": 200,
      "q": "The white-suited Colonel Sanders is the face of this fried chicken chain.",
      "a": "KFC"
     },
     {
      "v": 400,
      "q": "Two all-beef patties, special sauce, lettuce, cheese, pickles, onions, sesame seed bun.",
      "a": "The Big Mac"
     },
     {
      "v": 600,
      "q": "Pringles' mascot, Julius, is famous for having this facial feature.",
      "a": "A mustache"
     },
     {
      "v": 800,
      "q": "Chick-fil-A's billboard cows beg you to \"Eat Mor\" this misspelled word.",
      "a": "\"Chikin\""
     },
     {
      "v": 1000,
      "q": "Taco Bell pulled it in 2020, fans lost their minds, and it came back in 2022: the Mexican version of this food.",
      "a": "Pizza"
     }
    ]
   },
   {
    "name": "Name That Decade",
    "clues": [
     {
      "v": 200,
      "q": "Tamagotchis, Furbies, and the Macarena.",
      "a": "The 1990s"
     },
     {
      "v": 400,
      "q": "Sourdough starters, Tiger King, ChatGPT, and the Barbenheimer double feature.",
      "a": "The 2020s"
     },
     {
      "v": 600,
      "q": "Elvis on TV, the opening of Disneyland, and the debut of Barbie.",
      "a": "The 1950s"
     },
     {
      "v": 800,
      "q": "Flappers, the Charleston, Prohibition, and the publication of The Great Gatsby.",
      "a": "The 1920s"
     },
     {
      "v": 1000,
      "q": "The Pony Express launches, the Civil War is fought, and the first transcontinental railroad is finished.",
      "a": "The 1860s"
     }
    ]
   },
   {
    "name": "Reality TV & Celebrity Drama",
    "clues": [
     {
      "v": 200,
      "q": "In The Traitors: New Blood, this player got the most votes at the roundtable to be banished, but a last-second pardon saved them, and Tomica went home instead.",
      "a": "Victor (Vollbrechthausen)"
     },
     {
      "v": 400,
      "q": "Early in The Traitors: New Blood, two accomplices raced for a spot in the turret, and this player was the one recruited as the season's third Traitor.",
      "a": "Katie (Fites)"
     },
     {
      "v": 600,
      "q": "On The Bachelor, contestants fight for one of these before every ceremony.",
      "a": "A rose"
     },
     {
      "v": 800,
      "q": "On Survivor 51, Lewis tried to convince Sharonda that his Irish wedding ring was actually this, magically tying her fate to his.",
      "a": "A \"blood ring\""
     },
     {
      "v": 1000,
      "q": "This Love Island breakout star went on to win Season 4 of The Traitors.",
      "a": "Rob Rausch"
     }
    ]
   },
   {
    "name": "Memes & TikTok",
    "clues": [
     {
      "v": 200,
      "q": "The \"Doge\" meme stars this breed of dog.",
      "a": "Shiba Inu"
     },
     {
      "v": 400,
      "q": "The 2014 Ice Bucket Challenge raised money for research on this disease, abbreviated ALS.",
      "a": "Amyotrophic lateral sclerosis (Lou Gehrig's disease)"
     },
     {
      "v": 600,
      "q": "\"Rizz,\" Oxford's 2023 Word of the Year, is short for this word.",
      "a": "Charisma"
     },
     {
      "v": 800,
      "q": "TikTok is owned by this company.",
      "a": "ByteDance"
     },
     {
      "v": 1000,
      "q": "Vine videos were limited to this many seconds.",
      "a": "Six"
     }
    ]
   },
   {
    "name": "Sports Records",
    "clues": [
     {
      "v": 200,
      "q": "He holds the record for the most Olympic gold medals with 23, and he's basically a fish.",
      "a": "Michael Phelps"
     },
     {
      "v": 400,
      "q": "Usain Bolt's 100-meter world record is this time in seconds.",
      "a": "9.58"
     },
     {
      "v": 600,
      "q": "This quarterback won a record seven Super Bowls.",
      "a": "Tom Brady"
     },
     {
      "v": 800,
      "q": "He is the all-time leading scorer in men's international soccer.",
      "a": "Cristiano Ronaldo"
     },
     {
      "v": 1000,
      "q": "In 1962, this NBA legend scored 100 points in a single game.",
      "a": "Wilt Chamberlain"
     }
    ]
   }
  ],
  "final": {
   "category": "Happy Accidents",
   "q": "In 1968, 3M scientist Spencer Silver tried to invent a super-strong glue, failed, and accidentally created a weak one that became this office staple.",
   "a": "Post-it Notes"
  }
 },
 {
  "name": "Game 4",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Borders & Oddities",
    "clues": [
     {
      "v": 200,
      "q": "Vatican City is completely surrounded by this country.",
      "a": "Italy"
     },
     {
      "v": 400,
      "q": "The kingdom of Lesotho is entirely surrounded by this country.",
      "a": "South Africa"
     },
     {
      "v": 600,
      "q": "Uzbekistan and this tiny European country are the world's only doubly landlocked nations.",
      "a": "Liechtenstein"
     },
     {
      "v": 800,
      "q": "This Russian exclave is wedged between Poland and Lithuania, with no land connection to the rest of Russia.",
      "a": "Kaliningrad"
     },
     {
      "v": 1000,
      "q": "Some houses in this Dutch-Belgian border town are split by the national border.",
      "a": "Baarle (Baarle-Hertog / Baarle-Nassau)"
     }
    ]
   },
   {
    "name": "Video Games & Internet Culture",
    "clues": [
     {
      "v": 200,
      "q": "He is Mario's younger twin brother and the eternal sidekick.",
      "a": "Luigi"
     },
     {
      "v": 400,
      "q": "Rickrolling uses this Rick Astley song.",
      "a": "\"Never Gonna Give You Up\""
     },
     {
      "v": 600,
      "q": "This Pokémon is #25 in the Pokédex.",
      "a": "Pikachu"
     },
     {
      "v": 800,
      "q": "This block-building sandbox game is the best-selling video game of all time.",
      "a": "Minecraft"
     },
     {
      "v": 1000,
      "q": "In Japan, Pac-Man's original name was this.",
      "a": "Puck-Man"
     }
    ]
   },
   {
    "name": "Emoji Decoder",
    "clues": [
     {
      "v": 200,
      "q": "❄️👸⛄",
      "a": "Frozen"
     },
     {
      "v": 400,
      "q": "🦈🌊🚤",
      "a": "Jaws"
     },
     {
      "v": 600,
      "q": "🏝️✈️🔥",
      "a": "Lost"
     },
     {
      "v": 800,
      "q": "🧪🚐👨‍🦲",
      "a": "Breaking Bad"
     },
     {
      "v": 1000,
      "q": "🐝🎞️",
      "a": "Bee Movie"
     }
    ]
   },
   {
    "name": "Famous Scientists & Inventors",
    "clues": [
     {
      "v": 200,
      "q": "He developed the theory of relativity and had very famous hair.",
      "a": "Albert Einstein"
     },
     {
      "v": 400,
      "q": "In 1928, he left a petri dish out, came back from vacation, and discovered penicillin.",
      "a": "Alexander Fleming"
     },
     {
      "v": 600,
      "q": "She won Nobel Prizes in both physics and chemistry.",
      "a": "Marie Curie"
     },
     {
      "v": 800,
      "q": "This Serbian-American inventor championed alternating current and has a car company named after him.",
      "a": "Nikola Tesla"
     },
     {
      "v": 1000,
      "q": "She wrote what's considered the first computer program, for Babbage's Analytical Engine.",
      "a": "Ada Lovelace"
     }
    ]
   },
   {
    "name": "Conspiracy Theories",
    "clues": [
     {
      "v": 200,
      "q": "The satirical \"Birds Aren't Real\" movement claims birds are actually these government devices.",
      "a": "Surveillance drones"
     },
     {
      "v": 400,
      "q": "The Monopoly Man never wore this piece of eyewear, but many people swear he did, a classic \"Mandela Effect.\"",
      "a": "A monocle"
     },
     {
      "v": 600,
      "q": "A 1969 rumor claimed this Beatle had died and been replaced by a lookalike.",
      "a": "Paul McCartney"
     },
     {
      "v": 800,
      "q": "In the real, declassified CIA program MKUltra, subjects were secretly dosed with this hallucinogen.",
      "a": "LSD"
     },
     {
      "v": 1000,
      "q": "This real 1962 Pentagon proposal, rejected by JFK, suggested staging fake attacks to justify war with Cuba.",
      "a": "Operation Northwoods"
     }
    ]
   }
  ],
  "final": {
   "category": "Fake News",
   "q": "This 1938 Orson Welles radio broadcast was reported to have caused mass panic, though historians say that was exaggerated.",
   "a": "The War of the Worlds"
  }
 }
] };
