module.exports = {
  name: 'roll',
  description: 'roll dice',
  execute(message, args) {
    console.log(args);
    if (!args.length || args[0] === "") {
      message.channel.send("Rolling 1d20");
      return roll20(message);
    }

    else if (args[0].toLowerCase() === "help") {
      return message.channel.send("Roll what, friend? Say something like 1d20 or 2d6 + 3.");
    }


    let arg = args[0].toLowerCase();
    if (arg === "d20" || arg === "1d20") {
      return roll20(message);
    }
    else if (arg === "a" || arg === "adv" || arg === "advantage") {
      return roll20(message, true);
    }
    else if (arg == "d" || arg === "dis" || arg === "disadv" || arg === "disadvantage") {
      return roll20(message, false);
    }

    // it's a string of terms to roll and add
    else {
      return rollSum(message, args);
    }
  },
};

function rollDie(sides) {
  return Math.ceil(Math.random() * sides);
}

function rollSum(message, args) {
  let add = true;
  // evaulate each arg and store terms to sum up here
  let terms = args.flatMap(term => {
    // is a number
    if (!isNaN(term)) {
      return add ? parseInt(term) : -parseInt(term);
    }

    // is an operator which affects the sign of the next term
    else if (term.startsWith("+")) {
      // it's an operator, we should add the next term 
      if (term === "+") {
        add = true;
      }
      // it's a modifier, we should add this term
      else {
        return parseInt(term);
      }
    }
    else if (term.startsWith("-")) {
      // it's an operator, we should subtract the next term 
      if (term === "-") {
        add = false;
      }
      // it's a modifier, we should subtract this term
      else {
        return parseInt(term);
      }
    }

    // is a dice roll. Expect a string in a form like "1d20"
    else {
      const numbers = term.toLowerCase().split("d");
      console.log(numbers);
      let diceNumber = parseInt(numbers[0])
      if (isNaN(diceNumber)) { diceNumber = 1; }
      const sides = parseInt(numbers[1]);
      if (isNaN(sides)) { // abort
        message.channel.send("What kind of die was that?");
        return
      }
      let rolls = [];
      for (let i = 0; i < diceNumber; i++) { // roll and add
        const roll = rollDie(sides);
        rolls.push(add ? roll : -roll);
      }
      return rolls;
    }
    // if nothing to be added, return an empty array which will be flattened out
    return [];
  });
  const sum = terms.reduce((sum, term) => sum + term);
  return output(message, sum, terms, " + ");
}

function roll20(message, advantage) {
  let roll, terms, nat20, nat1;
  // straight roll, no adv or disadv
  if ((typeof advantage === 'undefined')) {
    roll = rollDie(20);
  }
  // rolling with advantage or disadvantage
  else {
    terms = [rollDie(20), rollDie(20)];
    roll = (advantage ? Math.max(terms[0], terms[1]) : Math.min(terms[0], terms[1]));
  }
  if (roll === 20) {
    nat20 = true;
  }
  else if (roll === 1) {
    nat1 = true;
  }
  return output(message, roll, terms, ", ", nat20, nat1);
}

function output(message, roll, terms, separator, nat20, nat1) {
  let output = `You rolled ${roll}`;

  if (nat20) {
    output += ". Natural 20!";
  }
  else if (nat1) {
    output += ". Natural 1 :frowning:";
  }

  if (terms && terms.length > 1) {
    output += `\n${terms.join(separator)} = ${roll}`;
  }

  return message.channel.send(output);
}
