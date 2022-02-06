/**
 * // Tracks 'Greater Invisibility' for 10 rounds, decrementing.
 * !tracker -r 10 -n Greater Invisibility
 * !tracker --rounds 10 --name Greater Invisibility
 * 
 * // Tracks Greater Invisibility, starting at 0 and incrementing.
 * !tracker Greater Invisibility
 * !tracker --name Greater Invisibility
 */

(() => {


  /* --- Utility Functions --- */

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

    botName: 'Tracker Bot',

    helpHtml: '<p>Help placeholder</p>',

    sendChat: function(msg) {
      sendChat(this.botName, msg);
    },

    sendWhisper: function(to, msg) {
      this.sendChat(`/w "${to}" ${msg}`);
    },

    processHelpCommand: function(requester, command) {

    },

    processAddNewTrackerCommand: function(requester, command) {
      const name = getNameFromInput(command);
      if (!name) {
        this.sendWhisper(
          requester,
          '<p>You must provide a name for the tracker using <code>-n <name></code> or <code>--name <name></code></p>'
        );
        return;
      }

      const rounds = getRoundsFromInput(command);

      let turnOrder = Campaign().get('turnorder');
      turnOrder === '' ? turnOrder = [] : turnOrder = JSON.parse(turnOrder);
      /**
       * TODO: Validate that an identical indicator isn't already in the turn
       * order. if it is, append an integer to the end to differentiate. Reply
       * to the user what the name is in the chat at the end.
       *
      */ 
      turnOrder.unshift({
        id: '-1',
        pr: `${rounds || 0}`,
        custom: `[Tracker] ${name}`,
        formula: `${rounds ? -1 : 1}`
      }) 
      Campaign().set('turnorder', JSON.stringify(turnOrder));
      /**
       * TODO: Send a chat message indicating that it was successful, the name
       * of the tracked item, and its starting duration. Send this to the 
       * entire chat.
       */
    },

    processCommand: function(requester, command) {
      if (command.match(/!tracker --help/)) {
        this.sendWhisper(requester, this.helpHtml);
        return;
      }
      // If remove command, process removal.

      // otherwise, process add command.
      this.processAddNewTrackerCommand(requester, command);
    }
  }


  /* --- Event listeners --- */

  on('ready', () => {
    on('chat:message', msg => {
      if (msg.playerid === 'API') return;
      // let requester = msg.who;
      let command = msg.content;
      if (!command.match(/!tracker\s.*/)) return; // No a command, no feedback.

      Tracker.processCommand(msg.who, command);
    });
  });
})();