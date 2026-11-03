// CROWD CONTROL (Majority Rules + Most Likely To) — prompt bank. No right or wrong answers, just the room.
//
// rather:  { a, b, flip? }  Would-you-rather. Everyone picks A or B. The majority scores 100.
//          flip:true makes it an UNDERDOG round: the minority scores 200 instead.
// likely:  "…" finish the sentence "Who here is most likely to ___?" The group points at someone on 3;
//          the host taps whoever got the most fingers and they get crowned (+100).
window.BANKS = window.BANKS || {};
window.BANKS.crowdcontrol = {
  perGame: 14,
  rather: [
    { a: 'Never use social media again', b: 'Never watch another movie or TV show' },
    { a: 'Always be 10 minutes late', b: 'Always be 20 minutes early' },
    { a: 'Have a rewind button for your life', b: 'Have a pause button for your life' },
    { a: 'Fight one horse-sized duck', b: 'Fight a hundred duck-sized horses' },
    { a: 'Never eat pizza again', b: 'Never eat tacos again' },
    { a: 'Know the date you will die', b: 'Know how you will die' },
    { a: 'Have your Google search history read aloud to this group', b: 'Have your camera roll scrolled through by this group' },
    { a: 'Be able to talk to animals', b: 'Speak every human language' },
    { a: 'Have a personal chef', b: 'Have a personal driver' },
    { a: 'Wear socks with sandals forever', b: 'Wear a suit every day', flip: true },
    { a: 'Listen to only one album forever', b: 'Watch only one movie forever' },
    { a: 'Be famous but broke', b: 'Be rich but totally anonymous' },
    { a: 'Lose your phone for a week', b: 'Lose your wallet for a week' },
    { a: 'Be the funniest person in the room', b: 'Be the smartest person in the room' },
    { a: 'Have to sing instead of talk', b: 'Have to dance instead of walk', flip: true },
    { a: 'Eat breakfast for every meal', b: 'Never eat breakfast again' },
    { a: 'Live somewhere that is always 95°F', b: 'Live somewhere that is always 20°F' },
    { a: 'Be stuck in an elevator with your boss', b: 'Be stuck in an elevator with your ex', flip: true },
    { a: 'Have a free flight every month', b: 'Have free groceries for life' },
    { a: 'Be able to teleport but only to places you have already been', b: 'Fly but only as fast as you can run' },
    { a: 'Only text in emojis', b: 'Only speak in questions' },
  ],
  likely: [
    'cry at a commercial',
    'survive a zombie apocalypse',
    'get lost with the GPS on',
    'become famous',
    'text back three days later',
    'start a group-chat argument',
    'adopt too many pets',
    'be the last to leave a party',
    'win a hot-dog eating contest',
    'forget their own birthday',
    'talk their way out of a speeding ticket',
    'become a millionaire',
    'laugh at the worst possible moment',
    'set off the smoke alarm while cooking',
    'show up in a costume to a party that is not a costume party',
    'watch an entire season of a show in one night',
    'spend all their savings on a spontaneous trip',
    'make a best friend out of a stranger in a waiting room',
    'fall asleep during a movie',
    'win a reality TV show',
    'get voted off a reality show first',
    'have 10,000 unread notifications',
  ],
};
