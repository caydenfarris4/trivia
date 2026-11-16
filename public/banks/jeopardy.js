// THE BIG BOARD (Jeopardy-style) — question bank. Eight full boards, each with its own Final round: four from the owner's CSV, then two trivia-heavy and two family boards for Thanksgiving.
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
 },
 {
  "name": "World Tour: History & Geography",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Ancient Worlds",
    "clues": [
     {
      "v": 200,
      "q": "The tomb of this young Egyptian pharaoh, found almost intact in 1922, held a famous gold funeral mask.",
      "a": "Tutankhamun (King Tut)"
     },
     {
      "v": 400,
      "q": "This Greek city-state, famous for its disciplined warriors, fought Athens in the Peloponnesian War.",
      "a": "Sparta"
     },
     {
      "v": 600,
      "q": "This Carthaginian general marched war elephants across the Alps to attack Rome.",
      "a": "Hannibal"
     },
     {
      "v": 800,
      "q": "Found in 1799, this slab with the same text in three scripts let Champollion decode Egyptian hieroglyphs.",
      "a": "The Rosetta Stone"
     },
     {
      "v": 1000,
      "q": "Pressed into clay with a reed stylus, this wedge-shaped writing system came from ancient Mesopotamia.",
      "a": "Cuneiform"
     }
    ]
   },
   {
    "name": "U.S. History",
    "clues": [
     {
      "v": 200,
      "q": "He was the first President of the United States.",
      "a": "George Washington"
     },
     {
      "v": 400,
      "q": "This 1803 deal with France roughly doubled the size of the United States.",
      "a": "The Louisiana Purchase"
     },
     {
      "v": 600,
      "q": "\"Four score and seven years ago\" begins this famous 1863 speech by Abraham Lincoln.",
      "a": "The Gettysburg Address"
     },
     {
      "v": 800,
      "q": "In 1869 the first transcontinental railroad was finished at Promontory Summit in this present-day state.",
      "a": "Utah"
     },
     {
      "v": 1000,
      "q": "This 1848 treaty ended the Mexican-American War and gave the U.S. California and much of the Southwest.",
      "a": "The Treaty of Guadalupe Hidalgo"
     }
    ]
   },
   {
    "name": "Capitals & Rivers",
    "clues": [
     {
      "v": 200,
      "q": "This city is the capital of Canada.",
      "a": "Ottawa"
     },
     {
      "v": 400,
      "q": "The Nile flows north and empties into this sea.",
      "a": "The Mediterranean Sea"
     },
     {
      "v": 600,
      "q": "Not Sydney or Melbourne: this city is the capital of Australia.",
      "a": "Canberra"
     },
     {
      "v": 800,
      "q": "Flowing through Russia to the Caspian Sea, this is the longest river in Europe.",
      "a": "The Volga"
     },
     {
      "v": 1000,
      "q": "Renamed Nur-Sultan in 2019, this Kazakh capital got its original name back in 2022.",
      "a": "Astana"
     }
    ]
   },
   {
    "name": "Explorers & Expeditions",
    "clues": [
     {
      "v": 200,
      "q": "Columbus first reached the Americas in this year.",
      "a": "1492"
     },
     {
      "v": 400,
      "q": "This president sent Lewis and Clark west to explore the Louisiana Territory.",
      "a": "Thomas Jefferson"
     },
     {
      "v": 600,
      "q": "With Sherpa Tenzing Norgay, this New Zealander was first to summit Mount Everest in 1953.",
      "a": "Sir Edmund Hillary"
     },
     {
      "v": 800,
      "q": "Ferdinand Magellan's expedition circled the globe, but he was killed in 1521 in this present-day country.",
      "a": "The Philippines"
     },
     {
      "v": 1000,
      "q": "Ernest Shackleton's ship Endurance was trapped and crushed by ice in this Antarctic sea.",
      "a": "The Weddell Sea"
     }
    ]
   },
   {
    "name": "Wonders & Landmarks",
    "clues": [
     {
      "v": 200,
      "q": "The Statue of Liberty was a gift to the United States from this country.",
      "a": "France"
     },
     {
      "v": 400,
      "q": "The mountaintop city of Machu Picchu was built by this empire.",
      "a": "The Inca"
     },
     {
      "v": 600,
      "q": "The \"Rose-Red City\" of Petra, carved into sandstone cliffs, is in this country.",
      "a": "Jordan"
     },
     {
      "v": 800,
      "q": "Once the center of the Khmer Empire, the temple complex Angkor Wat is in this country.",
      "a": "Cambodia"
     },
     {
      "v": 1000,
      "q": "More than 11,000 years old, the carved stone pillars of Gobekli Tepe are among the oldest monumental structures known and are in this country.",
      "a": "Turkey"
     }
    ]
   }
  ],
  "final": {
   "category": "Geography",
   "q": "The only sea in the world with no coastline, it is bounded by ocean currents and named for its floating seaweed.",
   "a": "The Sargasso Sea"
  }
 },
 {
  "name": "The Sports Page",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Baseball",
    "clues": [
     {
      "v": 200,
      "q": "A regulation baseball game is scheduled for this many innings.",
      "a": "Nine"
     },
     {
      "v": 400,
      "q": "The bases on a regulation baseball diamond are this many feet apart.",
      "a": "90 feet"
     },
     {
      "v": 600,
      "q": "Babe Ruth began his major-league career as a pitcher for this Boston team.",
      "a": "The Red Sox"
     },
     {
      "v": 800,
      "q": "In 1947 this player broke baseball's color barrier with the Brooklyn Dodgers.",
      "a": "Jackie Robinson"
     },
     {
      "v": 1000,
      "q": "Lou Gehrig played 2,130 consecutive games for the Yankees, which earned him this durable nickname.",
      "a": "The Iron Horse"
     }
    ]
   },
   {
    "name": "Volleyball",
    "clues": [
     {
      "v": 200,
      "q": "In indoor volleyball, each team has this many players on the court at a time.",
      "a": "Six"
     },
     {
      "v": 400,
      "q": "This specialist wears a different color jersey, plays only in the back row and cannot spike the ball.",
      "a": "The libero"
     },
     {
      "v": 600,
      "q": "Beach volleyball is played with this many players per team.",
      "a": "Two"
     },
     {
      "v": 800,
      "q": "William G. Morgan invented volleyball in 1895 as a gentler alternative to this sport.",
      "a": "Basketball"
     },
     {
      "v": 1000,
      "q": "Volleyball's original name in 1895, which sounded like the racket sport badminton, was this.",
      "a": "Mintonette"
     }
    ]
   },
   {
    "name": "Olympics",
    "clues": [
     {
      "v": 200,
      "q": "The Olympic flag shows this many interlocking rings.",
      "a": "Five"
     },
     {
      "v": 400,
      "q": "The ancient Olympic Games began in this country.",
      "a": "Greece"
     },
     {
      "v": 600,
      "q": "In 2009 this Jamaican sprinter set the 100-meter world record of 9.58 seconds.",
      "a": "Usain Bolt"
     },
     {
      "v": 800,
      "q": "The 1980 U.S. hockey team's upset of the Soviet Union is known as the \"Miracle on\" this.",
      "a": "Ice"
     },
     {
      "v": 1000,
      "q": "In 1976 gymnast Nadia Comaneci scored the first perfect 10 in Olympic history in this Canadian city.",
      "a": "Montreal"
     }
    ]
   },
   {
    "name": "Football",
    "clues": [
     {
      "v": 200,
      "q": "A touchdown is worth this many points.",
      "a": "Six"
     },
     {
      "v": 400,
      "q": "The Super Bowl trophy is named for this legendary Green Bay Packers coach.",
      "a": "Vince Lombardi"
     },
     {
      "v": 600,
      "q": "In 1984 this school's football team finished a perfect season and was named national champion.",
      "a": "BYU (Brigham Young University)"
     },
     {
      "v": 800,
      "q": "In 1972 this team became the only NFL team to go undefeated and win the Super Bowl.",
      "a": "The Miami Dolphins"
     },
     {
      "v": 1000,
      "q": "A BYU alumnus and Hall of Fame quarterback, he threw a record six touchdowns in Super Bowl XXIX.",
      "a": "Steve Young"
     }
    ]
   },
   {
    "name": "Basketball",
    "clues": [
     {
      "v": 200,
      "q": "A regulation basketball hoop is this many feet above the floor.",
      "a": "10 feet"
     },
     {
      "v": 400,
      "q": "This Chicago Bulls guard won six NBA championships in the 1990s.",
      "a": "Michael Jordan"
     },
     {
      "v": 600,
      "q": "James Naismith first used these fruit containers as the goals when he invented basketball in 1891.",
      "a": "Peach baskets"
     },
     {
      "v": 800,
      "q": "This power forward, nicknamed \"The Mailman,\" teamed with John Stockton to lead the Utah Jazz.",
      "a": "Karl Malone"
     },
     {
      "v": 1000,
      "q": "In 1962, Wilt Chamberlain scored 100 points in a game against this team.",
      "a": "The New York Knicks"
     }
    ]
   }
  ],
  "final": {
   "category": "Sports Nicknames",
   "q": "Called \"The Great One,\" this hockey legend wore No. 99, which the NHL retired for every team.",
   "a": "Wayne Gretzky"
  }
 },
 {
  "name": "Thanksgiving Table",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "The First Thanksgiving",
    "clues": [
     {
      "v": 200,
      "q": "In 1620 the Pilgrims sailed to America aboard this ship.",
      "a": "The Mayflower"
     },
     {
      "v": 400,
      "q": "The Wampanoag taught the Pilgrims to plant this grain, which they grew with fish as fertilizer.",
      "a": "Corn"
     },
     {
      "v": 600,
      "q": "In 1863 this president proclaimed a national day of Thanksgiving.",
      "a": "Abraham Lincoln"
     },
     {
      "v": 800,
      "q": "In 1939 Franklin Roosevelt moved Thanksgiving a week earlier, and critics gave it this nickname.",
      "a": "Franksgiving"
     },
     {
      "v": 1000,
      "q": "This magazine editor, who also wrote \"Mary Had a Little Lamb,\" campaigned for years for a national Thanksgiving holiday.",
      "a": "Sarah Josepha Hale"
     }
    ]
   },
   {
    "name": "Turkey Talk",
    "clues": [
     {
      "v": 200,
      "q": "A male turkey makes this sound.",
      "a": "Gobble"
     },
     {
      "v": 400,
      "q": "A male turkey is a tom; a female turkey is called this.",
      "a": "A hen"
     },
     {
      "v": 600,
      "q": "The loose red skin hanging from a turkey's neck is called this.",
      "a": "The wattle"
     },
     {
      "v": 800,
      "q": "The fleshy flap that hangs over a turkey's beak is called this.",
      "a": "The snood"
     },
     {
      "v": 1000,
      "q": "Baby turkeys are called this.",
      "a": "Poults"
     }
    ]
   },
   {
    "name": "Pies & Sides",
    "clues": [
     {
      "v": 200,
      "q": "This orange gourd is the star of the most popular Thanksgiving pie.",
      "a": "Pumpkin"
     },
     {
      "v": 400,
      "q": "Candied sweet potatoes are often topped with these puffy white treats.",
      "a": "Marshmallows"
     },
     {
      "v": 600,
      "q": "Cranberries grow on low vines in wet fields called these.",
      "a": "Bogs"
     },
     {
      "v": 800,
      "q": "Green bean casserole was invented in 1955 in the test kitchen of this soup company.",
      "a": "Campbell's"
     },
     {
      "v": 1000,
      "q": "Pumpkin pie spice usually includes cinnamon, ginger, cloves and this spice, grated from a seed.",
      "a": "Nutmeg"
     }
    ]
   },
   {
    "name": "Parades & Football",
    "clues": [
     {
      "v": 200,
      "q": "The famous Macy's Thanksgiving Day Parade marches through this city.",
      "a": "New York City"
     },
     {
      "v": 400,
      "q": "Charlie Brown's pet beagle is a favorite giant balloon in the Macy's parade.",
      "a": "Snoopy"
     },
     {
      "v": 600,
      "q": "The Detroit Lions and this Texas team traditionally host the NFL's Thanksgiving games.",
      "a": "The Dallas Cowboys"
     },
     {
      "v": 800,
      "q": "The first Macy's parade in 1924 featured live animals borrowed from the zoo in this New York park.",
      "a": "Central Park"
     },
     {
      "v": 1000,
      "q": "In 1927 this cartoon cat became the first character balloon in the Macy's parade.",
      "a": "Felix the Cat"
     }
    ]
   },
   {
    "name": "Fall & Harvest",
    "clues": [
     {
      "v": 200,
      "q": "Leaves change color in this season, also called autumn.",
      "a": "Fall"
     },
     {
      "v": 400,
      "q": "This green pigment in leaves breaks down in the fall, revealing the oranges and yellows underneath.",
      "a": "Chlorophyll"
     },
     {
      "v": 600,
      "q": "The first day of fall, when day and night are about equal, is called the autumn this.",
      "a": "Equinox"
     },
     {
      "v": 800,
      "q": "When daylight saving time ends in the fall, clocks move in this direction.",
      "a": "Back (one hour)"
     },
     {
      "v": 1000,
      "q": "In Greek myth, the original \"horn of plenty,\" or cornucopia, was the horn of this animal.",
      "a": "A goat"
     }
    ]
   }
  ],
  "final": {
   "category": "White House Traditions",
   "q": "In 1989 this president formally \"pardoned\" a Thanksgiving turkey, the first official pardon of the now-annual tradition.",
   "a": "George H. W. Bush"
  }
 },
 {
  "name": "Family Movie & Music Night",
  "dailyDoubles": 1,
  "categories": [
   {
    "name": "Disney & Pixar",
    "clues": [
     {
      "v": 200,
      "q": "In Frozen, this goofy snowman loves warm hugs.",
      "a": "Olaf"
     },
     {
      "v": 400,
      "q": "This pull-string cowboy sheriff is Andy's favorite toy in Toy Story.",
      "a": "Woody"
     },
     {
      "v": 600,
      "q": "In this Pixar film, a rat named Remy dreams of being a Paris chef.",
      "a": "Ratatouille"
     },
     {
      "v": 800,
      "q": "Simba's journey, set to \"Circle of Life,\" is told in this 1994 Disney film.",
      "a": "The Lion King"
     },
     {
      "v": 1000,
      "q": "In Inside Out, the emotions are Joy, Sadness, Anger, Fear and this one.",
      "a": "Disgust"
     }
    ]
   },
   {
    "name": "Family Favorites",
    "clues": [
     {
      "v": 200,
      "q": "A boy named Harry discovers he is a wizard and attends Hogwarts.",
      "a": "Harry Potter"
     },
     {
      "v": 400,
      "q": "Eight-year-old Kevin McCallister defends his house from burglars when his family accidentally leaves him behind.",
      "a": "Home Alone"
     },
     {
      "v": 600,
      "q": "Neighborhood kids fear \"The Beast\" behind the fence in this 1993 baseball movie.",
      "a": "The Sandlot"
     },
     {
      "v": 800,
      "q": "In this 1992 film about a women's baseball league, Tom Hanks says, \"There's no crying in baseball!\"",
      "a": "A League of Their Own"
     },
     {
      "v": 1000,
      "q": "Elliott lures E.T. out of hiding with this candy.",
      "a": "Reese's Pieces"
     }
    ]
   },
   {
    "name": "Songs & Singers",
    "clues": [
     {
      "v": 200,
      "q": "Michael Jackson was known by this royal nickname.",
      "a": "The King of Pop"
     },
     {
      "v": 400,
      "q": "John, Paul, George and Ringo made up this band.",
      "a": "The Beatles"
     },
     {
      "v": 600,
      "q": "This singer-songwriter's Eras Tour became one of the biggest concert tours ever.",
      "a": "Taylor Swift"
     },
     {
      "v": 800,
      "q": "\"Don't Stop Believin'\" is the signature song of this rock band.",
      "a": "Journey"
     },
     {
      "v": 1000,
      "q": "This 1971 John Lennon song imagines a world with no possessions and no countries.",
      "a": "Imagine"
     }
    ]
   },
   {
    "name": "TV & Cartoons",
    "clues": [
     {
      "v": 200,
      "q": "This square yellow sea sponge lives in a pineapple under the sea.",
      "a": "SpongeBob SquarePants"
     },
     {
      "v": 400,
      "q": "This Australian cartoon follows a blue heeler pup and her family.",
      "a": "Bluey"
     },
     {
      "v": 600,
      "q": "Ross, Rachel, Monica, Chandler, Joey and Phoebe are the six friends in this sitcom.",
      "a": "Friends"
     },
     {
      "v": 800,
      "q": "The sitcom The Office is set at a paper company in Scranton, Pennsylvania, called this.",
      "a": "Dunder Mifflin"
     },
     {
      "v": 1000,
      "q": "Sheriff Andy Taylor kept the peace in this fictional North Carolina town.",
      "a": "Mayberry"
     }
    ]
   },
   {
    "name": "Who Said It?",
    "clues": [
     {
      "v": 200,
      "q": "\"To infinity and beyond!\" is the catchphrase of this space ranger toy.",
      "a": "Buzz Lightyear"
     },
     {
      "v": 400,
      "q": "\"May the Force be with you\" is a line from this space-adventure series.",
      "a": "Star Wars"
     },
     {
      "v": 600,
      "q": "\"Just keep swimming\" is the motto of this forgetful blue fish.",
      "a": "Dory"
     },
     {
      "v": 800,
      "q": "In The Wizard of Oz, this girl says, \"There's no place like home.\"",
      "a": "Dorothy"
     },
     {
      "v": 1000,
      "q": "\"Life is like a box of chocolates\" is a line from this 1994 film.",
      "a": "Forrest Gump"
     }
    ]
   }
  ],
  "final": {
   "category": "Disney Songs",
   "q": "The song \"Be Our Guest\" is from this 1991 Disney film, whose heroine, Belle, loves to read.",
   "a": "Beauty and the Beast"
  }
 }
] };
