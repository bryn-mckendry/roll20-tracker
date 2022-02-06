/**
 * // Tracks 'Greater Invisibility' for 10 rounds, decrementing.
 * !tracker -r 10 -n Greater Invisibility
 * !tracker --rounds 10 --name Greater Invisibility
 * 
 * // Tracks Greater Invisibility, starting at 0 and incrementing.
 * !tracker --name Greater Invisibility
 * 
 * Macro:
 * !tracker --name ?{What to Track} --rounds ?{Duration in rounds}
 */

(() => {


  /* --- Utility Functions --- */

  const getTurnOrder = () => {
    let turnOrder = Campaign().get('turnorder');
    turnOrder === '' ? turnOrder = [] : turnOrder = JSON.parse(turnOrder);
    return turnOrder;
  }

  const getRoundsFromInput = input => {
    let roundsMatch = input.match(/(-r|--rounds)\s\d+/);
    if (!roundsMatch) {
      return null;
    }
    return +roundsMatch[0].split(' ')[1];
  }

  const getNameFromInput = input => {
    let nameMatch = input.match(/(-n|--name)\s[\w\s]+/);
    if (!nameMatch) {
      return null;
    }
    return nameMatch[0].split(' ').slice(1).join(' ');
  }

  /* --- Tracker Bot --- */

  const Tracker = {

    botName: 'TrackerBot',

    removeCompletedTrackers: function() {
      let turnOrder = getTurnOrder();
      const isComplete = turn => +turn.pr === 0 && turn.custom.startsWith('[TrackerBot]');
      let completed = turnOrder.filter(isComplete);
      if (completed.length > 0) {
        let valid = turnOrder.filter(t => +t.pr > 0 || !t.custom.startsWith('[TrackerBot]'))
        Campaign().set('turnorder', JSON.stringify(valid));
      }
    },

    sendChat: function(msg) {
      sendChat(this.botName, msg);
    },

    sendWhisper: function(to, msg) {
      let recipient = to.endsWith(' (GM)') ? to.slice(0, to.length-5) : to;
      this.sendChat(`/w "${recipient}" ${msg}`);
    },

    processHelpCommand: function(requester) {
      let res = '<div>'
      + '<h2>Tracker Bot Help</h2>'
      + '<h3>Tracking Duration of an Effect</h3>'
      + '<p>To track a duration of an effect, you need to provide a name for what you are '
      + 'tracking, and optionally a number of rounds equal to the effect\'s '
      + 'duration. The format for the command is</p>'
      + '<p><code>!tracker --name <name> --rounds <rounds></code></p>'
      + '<p>For example, to specify "Greater Invisibility" for 10 rounds, the '
      + 'command should be either</p>'
      + '<p><code>!tracker --name Greater Invisibility --rounds 10</code></p>'
      + '<p>or</p>'
      + '<p><code>!tracker -n Greater Invisibility -r 10</code></p>'
      + '<p>Once added, the resource will appear on the turn order and will'
      + 'auto-decrement from the specified rounds.</p>'
      + '<h3>Counting Rounds</h3>'
      + '<p>Alternatively, you can track an effect starting at 0, and '
      + 'incrementing by one every round. Useful for keeping track of total'
      + 'rounds in combat for example.</p>'
      + '<p>To track in this manner, simply do not specify any rounds.</p>'
      + '<p><code>!tracker --name Total Combat Rounds</code></p>'
      + '<h3>Removing from the Tracker</h3>'
      + '<p>If you have specified the number of rounds when adding a new '
      + 'tracker, then once the duration reaches 0 it will automatically '
      + 'get removed from the turn order.</p>'
      + '<p>If you need anything removed manually, currently only the GM can '
      + 'do so. So please ask them nicely :)</p>'
      + '</div>';
      this.sendWhisper(requester, res);
    },

    processAddNewTrackerCommand: function(requester, command) {
      let name = getNameFromInput(command);
      if (!name) {
        this.sendWhisper(
          requester,
            '<h3>Invalid Command</h3>'
          + '<p>You must provide a name for the tracker using <code>-n <name></code>'
          + 'or <code>--name <name></code></p>'
          + '<p>Type <code>!tracker --help</code> for more info.'
        );
        return;
      }

      const rounds = getRoundsFromInput(command);

      let turnOrder = getTurnOrder();
      if (turnOrder.filter(t => t.custom === `[TrackerBot] ${name}`).length !== 0) {
        Tracker.sendWhisper(requester, 'This name already exists!');
        return;
      }
      turnOrder.unshift({
        id: '-1',
        pr: `${rounds || 0}`,
        custom: `[TrackerBot] ${name}`,
        formula: `${rounds ? -1 : 1}`
      }) 
      Campaign().set('turnorder', JSON.stringify(turnOrder));
      Tracker.sendChat(`${name} is now being tracked for ${requester}.${rounds ? `${rounds} rounds remaining.` : '' }`);
    },

    processCommand: function(requester, command) {
      if (command.match(/!tracker --help/)) {
        this.processHelpCommand(requester);
      } else {
        this.processAddNewTrackerCommand(requester, command);
      }
    }
  }


  /* --- Event listeners --- */

  on('ready', () => {
    on('chat:message', msg => {
      if (msg.playerid === 'API') return;
      let command = msg.content;
      if (!command.match(/!tracker\s.*/)) return; // No a command, no feedback.

      Tracker.processCommand(msg.who, command);
    });

    on('change:campaign:turnorder', () => {
      Tracker.removeCompletedTrackers();
    })
  });
})();