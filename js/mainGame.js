const gameStartButton = document.querySelector('#gameStartButton');
const newHandButton = document.querySelector('#newHandButton');
const hitButton = document.querySelector('#hitButton');
const standButton = document.querySelector('#standButton');
const getNewDecksURL = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=' //add the # of decks you want to the end (1-6)
const wagerButtons = document.querySelector('#wagerOptions');
const moneyDiv = document.querySelector('#cash');
const gamesPlayedCounterDiv = document.querySelector('#gamesPlayed');
const scoreDiv = document.querySelector('#score');
const betDiv = document.querySelector('#currentBet');
const gameButtons = document.querySelector('#gameOptions');
const dealer = document.querySelector('#dealerCards');
const player = document.querySelector('#playerCards');
const playerTotal = document.querySelector('#playerTotal');
const dealerTotal = document.querySelector('#dealerTotal');
const totalWrapper = document.querySelector('#totalWrapper');
const message = document.querySelector('#message');

let deckId;
let deck; // store the full 52 card deck here. (array of card objects)
let gameState;
let gamesPlayedCounter;
let money;
let score;
let currentBet;
let dealerHand;
let playerHand;
//BACK OF CARD IMAGE = 226px x 314px


async function gameInit() {
  // await newDeck();
  gamesPlayedCounter = 0;
  money = 100;
  score = 0;
  currentBet = 0;
  dealerHand = [];
  playerHand = [];
  message.innerHTML = ' ';
  gameStartButton.style.visibility = 'hidden';
  betDiv.innerText = currentBet;
  moneyDiv.innerText = money;
  scoreDiv.innerText = score;
  gamesPlayedCounterDiv.innerText = gamesPlayedCounter;
  let decksIdObj = await axios.get(`${getNewDecksURL}6`);
  deckId = decksIdObj.data.deck_id;
  console.log(`Six new decks created! The deckId = ${deckId}`);
  deck = await drawCards(312);//Fills the global deck array up with the full 6 decks, and they are ALREADY SHUFFLED, not necessary to follow up with shuffleDeck.
  startBetting();
}

//All payouts are 1:1, unless player gets a blackjack, then payout is 3:2.  negative payouts accepted for losses. 0 accepted for even money/push?
function payout(ratio) { //ratio should be either 2(for win) or 2.75(for blackjack) or 1(for even money). If you lose money has already been properly subtracted during betting phase.
  let total = 0;
  total = currentBet * ratio;
  money += total;
  moneyDiv.innerText = money;
}

function startBetting() {
  //do some screen resetting as startBetting is basically the first step of a new game.
  message.innerHTML = 'PLACE YOUR BETS';
  // newHandButton.style.visibility = 'hidden';
  newHandButton.style.display = 'none';
  currentBet = 0;
  dealer.innerHTML = ' ';
  player.innerHTML = ' ';
  dealerTotal.style.visibility = 'hidden';
  dealerTotal.innerHTML = getDealerTotal();
  dealerTotal.style.margin = `0`;
  setTotalVisual(0, true);
  playerTotal.innerHTML = '';
  betDiv.innerText = currentBet;

  // wagerButtons.style.visibility = 'visible';
  wagerButtons.style.display = 'flex';
  console.log('***PLACE YOUR BETS***');
}

  
// I think this is where payout will be called, somehow in here.
async function newHand() {
  console.log('-----------------------NEW HAND---------------------------');
  console.log('----------------------------------------------------------');
  dealer.innerHTML = ' ';
  player.innerHTML = ' ';
  let flushHand = [];
  flushHand = playerHand.concat(dealerHand);
  deck = deck.concat(flushHand);
  deck = await localShuffleDeck(); // shuffle after every hand.
  gamesPlayedCounter++;
  playerHand = deal(2, player, true);
  dealerHand = deal(2, dealer, false);
  setTotalVisual(0, true);
  console.log('Player, your hand is:');
  console.log(`The ${playerHand[0].value} of ${playerHand[0].suit}  &  ${playerHand[1].value} of ${playerHand[1].suit}`);
  console.log(`Your total is: ${getPlayerTotal()}`);
  console.log(' ');
  console.log(`The dealer is showing a ${dealerHand[1].value} of ${dealerHand[1].suit}`);
  console.log(' ');
  checkIfNatural();
}

function moneyCheck() {
  if (money <= 0) {
    message.innerHTML = "YOU'RE OUT OF MONEY! COME BACK AGAIN SOON!"
    gameStartButton.style.visibility = 'visible';
    // newHandButton.style.visibility = 'hidden';
    newHandButton.style.display = 'none';
  }
  else {
    startBetting();
  }
}

function setTotalVisual(indentBy, toPlayer) {
  let totalMarginIndent = 61 * indentBy; 
  if (toPlayer) {
    playerTotal.innerHTML = getPlayerTotal();
    playerTotal.style.margin = `0 0 0 ${totalMarginIndent}px`;
  } else {
    dealerTotal.style.visibility = 'visible';
    dealerTotal.innerHTML = getDealerTotal();
    dealerTotal.style.margin = `0 0 0 ${totalMarginIndent}px`;
  }
}

function checkIfNatural() {
  //checking if dealer has natural 21, automatically winning before players get the chance to play unless they too have natural blackjacks.
  gameState = 'player';
  if (checkDealerNatural() === true && checkPlayerNatural() === false) {
    flipDealersCard();
    console.log(`Dealer has Blackjack! Better luck next game.`);
    conclusion("dbj");
    playGame();
  } else if (checkDealerNatural() === true && checkPlayerNatural() === true) {
    console.log('You AND the dealer both have Blackjack! No payouts.');
    conclusion('both');
    payout(1);
    playGame();
  } else if (checkDealerNatural() === false && checkPlayerNatural() === true) {
    console.log('You have Blackjack!, You win!'); 
    flipDealersCard();
    conclusion('pbj');
    payout(2.75);
    playGame();
  } else {
    playGame();
  }
}

//checks if dealer has a nautral 21 indicating auto-win blackjack state, this is ace + any 10 value.
function checkDealerNatural() { //gets called from newHand()
  if (dealerHand.length === 2 && getDealerTotal() === 21) {
    return true;
  } else {
    return false;
  }
}
function checkPlayerNatural() { // does the same but for the player, called from newHand only if dealer has natural
  if (playerHand.length === 2 && getPlayerTotal() === 21) {
    return true;
  } else {
    return false;
  }
}

//This is the function that actually fills the global deck variable with the cards. Not to be confused with dealCards()
//Takes argument that dictates how many cards to fill the deck array with, almost always this will be the full reset of 312 cards, however if we only wanted a single deck of 52 for example, that can be passed in and the deck array will only be 1 full deck large.
async function drawCards(numOfCards) {
  let decksObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${numOfCards}`);
  return decksObj.data.cards;
}

//USES THE API
//Shuffles the deck without having to create a new one, and then refills the deck array with newly shuffled cards.
async function shuffleDeck() { //try to switch this to a local function instead.
  let shuffleObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`); //Shuffles the deck on the API side.
  deck = await drawCards(312); //re-draws all the cards and refills the deck array with the now shuffled 312 cards.
}

//Does shuffling locally to minimize api calls to once per browser refresh.
function localShuffleDeck() { // Same shuffle from hi-lo week1
  let currentIndex = deck.length;
  let shuffledDeck = deck.slice();
  let temporaryValue;
  let randomIndex;

  while (currentIndex !== 0) { //while there are cards left in the array to shuffle
    randomIndex = Math.floor(Math.random() * (currentIndex - 1)); //using rng to pick a number between 0 and the remaining un-shuffled cards, and then storing the value.  Subtracting one from currentIndex, because that is the total amount and that count starts at 1 aka the length. However when we're applying the randomIndex, we want an index value for the array which starts at 0 so we shift it down one otherwise we end up with 53 elements instead of 52, with one being undefined.
    currentIndex--; //lower the number of cards left to be shuffled
    temporaryValue = shuffledDeck[currentIndex]; //grab the last card that has yet to be randomly placed in the deck
    shuffledDeck[currentIndex] = shuffledDeck[randomIndex];  //take the bottom unshuffled card, and set it equal to a random un-shuffled card. so now we have two elements in the array that are set to the same randomly chosen value
    shuffledDeck[randomIndex] = temporaryValue; // We need to complete the 'swap', so set where the randomly chosen card came from to the bottom of the pile card
  }
  return shuffledDeck;
}

function setCardImage(card, toWho, faceUp) { //when only one
  let cardDiv = document.createElement('div');
  cardDiv.classList.add('card');
  if (faceUp) {
    cardDiv.style.backgroundImage = `url(${card.image})`;
  } 
  toWho.appendChild(cardDiv);
}

function flipDealersCard() {
  dealer.firstElementChild.style.backgroundImage = `url(${dealerHand[0].image})`;
}

function deal(numOfCards, toWho, faceUp) {
  let cards = [];
  if (numOfCards === 1) { //check if you are only requesting one card so that you return the object and not another array.
    // cards.push(deck.shift());
    let card = deck.shift();
    setCardImage(card, toWho, true); //always true if 1
    return card;
  } else {
    cards = deck.splice(0, numOfCards);// splice returns cards starting at the first variable, number of cards to return. So if first arg is 0, returning starting at the start of the array.  If I wanted to return the final 2 cards I would use splice(-numofcards, numofcards) (negative2, 2)
    if (faceUp === false) { // it must be for the dealers 2 card opener where one must be face down, always the first delt.
      setCardImage(cards[0], toWho, false);
      setCardImage(cards[1], toWho, true);
    } else {
      setCardImage(cards[0], toWho, true);
      setCardImage(cards[1], toWho, true);
    }
    return cards.slice();// because just saying array1 = array2 just creates a reference and doesnt copy it over, we need to use slice() with an empty argument instead to slice the entire array and return those values.
  }
}

function calculateValue(value) { // grabs the 'value' value from the card object, which could be 2-9 or ACE, JACK, QUEEN or KING and assigns a number value.
  switch (value) {
    case 'KING':
    case 'QUEEN':
    case 'JACK':
      value = 10;
      break;
    case 'ACE':
      value = 11; //Ace's are always seen as 11's, later in the getPlayerTotal and getDealerTotal functions, the aces are passed through logic that changes them later if player is busting with an ace in their hand. Basically with an ace counter and -10 the value if over 21.
      break;
    default:
      value = parseInt(value); // just incase the 2-9 values are strings, I think it would still work but just to be safe.
  }
  return value;
}

//returns the total value of the cards in the player's hand
function getPlayerTotal() { // get highest total without busting
  let total = 0; //sum
  let aceCounter = 0; //To see if we need to lower an ace's value from 11 to 1 if total is over 21
  for (let i = 0; i < playerHand.length; i++) { //iterate through the hand
    let value = calculateValue(playerHand[i].value); //grab and bind each cards value, pass it through the calculateValue because some of the innate values are KING/JACK/ACE/QUEEN and we want straight # values 
    if (value === 11) { //if we have an ace, up the counter incase we need to lower the value of one of them to 1
      aceCounter++;
    }
    if ((value + total > 21) && (aceCounter > 0)) {//If we're busting and happen to have an ace that hasnt had its value lowered yet, set that 11 to a 1!
      total -= 10; //subtract the difference
      aceCounter--; //ace is counted, no more 11-value-aces
    }
    total += value; //add up the total
  }
  return total;
}

//returns the total value of the cards in the dealer's hand
function getDealerTotal() {
  let total = 0; //sum
  let aceCounter = 0; //To see if we need to lower an ace's value from 11 to 1 if total is over 21
  for (let i = 0; i < dealerHand.length; i++) { //iterate through the hand
    let value = calculateValue(dealerHand[i].value); //grab and bind each cards value, pass it through the calculateValue because some of the innate values are KING/JACK/ACE/QUEEN and we want straight # values 
    if (value === 11) { //if we have an ace, up the counter incase we need to lower the value of one of them to 1
      aceCounter++;
    }
    if ((value + total > 21) && (aceCounter > 0)) {//If we're busting and happen to have an ace that hasnt had its value lowered yet, set that 11 to a 1!
      total -= 10; //subtract the difference
      aceCounter--; //ace is counted, no more 11-value-aces
    }
    total += value; //add up the total
  }
  return total;
}

//if hit button is pressed
function hit() {
  playerHand.push(deal(1, player, true));
  setTotalVisual(playerHand.length - 2, true);
  console.log(`Your new card is ${playerHand[playerHand.length - 1].value} of ${playerHand[playerHand.length - 1].suit}`);
  console.log(`Your new total is ${getPlayerTotal()}`);
  gameState = 'player';
  playGame();
}

//if stand button is pressed
function stand() {  //This is a workaround function I use for a few reasons. Sometimes I call this from within playGame, how can I call playGame from within playGame? So I use this boom-a-rang function with a gameState variable to jump to where I need to in playGame().
  gameState = "dealer";
  playGame();
}

function conclusion(endCase) {
  switch (endCase) {
    case 'dbj':
      message.innerHTML = 'DEALER HAS BLACKJACK. TRY AGAIN.';
      break;
    case 'push':
      message.innerHTML = 'PUSH! EVEN MONEY.';
      break;
    case 'pbj':
      message.innerHTML = 'YOU HAVE BLACKJACK!!';
      break;
    case 'dbust':
      message.innerHTML = 'DEALER BUSTS! YOU WIN!';
      break;
    case 'pbust':
      message.innerHTML = 'YOU BUST, BETTER LUCK NEXT GAME.'
      break;
    case 'both':
      message.innerHTML = 'YOU BOTH HAVE BLACKJACK! NO MONEY WON.'
      break;
    case 'dstandlose':
      message.innerHTML = 'DEALER WINS, TRY AGAIN!'
      break;
    case 'dstandwin':
      message.innerHTML = 'DEALER STANDS, YOU WIN!'
      break;
  }
  // newHandButton.style.visibility = 'visible';
  newHandButton.style.display = 'block';
}

//returns natural for 2-card blackjack, 21 or bust.  hit() and stand() do the rest of the player logic.
function playerTurn() {
  let playerTotal = getPlayerTotal();
  if (playerTotal > 21) { 
    return "bust";
  } else if (playerTotal === 21) {
    return "21";
  } else {
    return "choice";
  }
}

//playGame()
//where most game logic will take place
//just a series of if elses given the current gameState string, run that code.
//all gameState variable changes will occur in other functions, then recall playGame() and playGame will jump to the appropriate
//part due to it checking the gameState
async function playGame() {
  if (gameState === "player") { // if its the players turn
    // gameButtons.style.visibility = 'visible';
    gameButtons.style.display = 'flex';
    let playerOutcome = playerTurn(); // natural, 21, bust  -- if stand it automatically goes to the dealers turn and never enters this loop.
    switch (playerOutcome) {
      case '21': // if the player has a non-natural 21, immediately end the turn by calling stand() for the player, because why would they hit?
        console.log("You have a 21! You stand. Dealer's turn:");
        gameButtons.style.display = 'none';
        setTimeout(function () { //giving a 1 second pause before jumping to the dealers turn (which happens so instantaneously) so the player can realize what happened before its over.
          stand();
        }, 750);
        break;
      case 'bust': // if player busts, money has already been subtracted no need to do negative payout
        console.log(`You've busted. Better luck next game!`);
        conclusion('pbust');
        // gameButtons.style.visibility = 'hidden';
        gameButtons.style.display = 'none';
        // newHandButton.style.visibility = 'visible';
        newHandButton.style.visibility = 'block';
        break;
      case 'choice': // if player neither gets a 21 or bust, they must still make a decision: hit or stand?
        console.log('Do you choose to Hit or Stand?');
        message.innerHTML = 'HIT OR STAND?';
        break;
      default:
        console.log("You should never see this message - From playGame() player section.");
    }
  } else if (gameState === "dealer") { // if dealers turn
      console.log(`Alright your final total is: ${getPlayerTotal()}`);
      console.log(' ');
      console.log(`Dealer's cards are ${dealerHand[0].value} of ${dealerHand[0].suit}  &  ${dealerHand[1].value} of ${dealerHand[1].suit}`);
      flipDealersCard();
      setTotalVisual(0, false);
    // gameButtons.style.visibility = 'hidden';
    gameButtons.style.display = 'none';
      
      let dealerTotal = getDealerTotal();
      console.log(`Dealer's total is: ${dealerTotal}`);
      let dealResult = "";

      let promise = new Promise(function (resolve) { // if we dont use a promise here the game will keep going without the dealers turn being finished and the result will be undefined.
        let dealerThink = setInterval(function () { // use setInterval to give the dealer a second delaye between each move so it doesn't all happen at once.
        if (dealerTotal > 21) {//if dealer bust
          dealResult = 'bust'; 
          resolve(dealResult); //resolve is what is "returned" to the promise.then, so we are giving it the result that takes a second or more so that the promise knows to wait for this before using the value later on before its undefined.
          clearInterval(dealerThink);
        } else if (dealerTotal >= 17) { //dealer always stands on 17 or higher.
          console.log('Dealer Stands');
          dealResult = 'stand'; 
          resolve(dealResult);
          clearInterval(dealerThink);
        } else {
          dealerHand.push(deal(1, dealer, true));
          setTotalVisual(dealerHand.length - 2, false);
          console.log('Dealer chooses to hit.');
          console.log(`Dealer's new card is ${dealerHand[dealerHand.length - 1].value} of ${dealerHand[dealerHand.length - 1].suit}`);
          dealerTotal = getDealerTotal();
          console.log(`Dealer's new total is ${dealerTotal}`);
        }
      }, 1000);
      });

    promise.then(function (dealResult) {
      switch (dealResult) {
        case "bust":
          console.log('Dealer has busted! You win!');
          // newHandButton.style.visibility = 'visible';
          newHandButton.style.display = 'block';
          conclusion('dbust');
          payout(2);
          break;
        case "blackjack":
          console.log('Dealer has blackjack!');
          // newHandButton.style.visibility = 'visible';
          newHandButton.style.display = 'block';
          break;
        case "stand":
          if (getPlayerTotal() > getDealerTotal()) {
            console.log('You win!');
            conclusion('dstandwin');
            payout(2);
          } else if (getPlayerTotal() < getDealerTotal()) {
            console.log('Sorry, you lose this round. Better luck next game!');
            conclusion('dstandlose');
          } else {
            console.log('Push! No money won or lost.');
            conclusion('push');
            payout(1);
          }
          // newHandButton.style.visibility = 'visible';
          newHandButton.style.display = 'block';
          break;
        default:
          console.log("Not sure what happened here! HELP! - from playGame() default result for dealerOutcome switch.");
      } 
    }); 
  }  
}


window.onload = function () {
  
  gameStartButton.addEventListener('click', gameInit);
  newHandButton.addEventListener('click', moneyCheck);
  hitButton.addEventListener('click', hit);
  standButton.addEventListener('click', stand);

  //wagering
  wagerButtons.addEventListener('click', async function (e) {
    const betAmount = e.target.id;
    let currentAmountClicked = 0;
    switch (betAmount) {
      case '5':
        currentAmountClicked = 5;
        if ((currentAmountClicked + currentBet <= money)) {
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case '10':
        currentAmountClicked = 10;
        if ((currentAmountClicked + currentBet <= money)) {
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case '25':
        currentAmountClicked = 25;
        if ((currentAmountClicked + currentBet <= money)) {
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case 'bet':
        console.log(`Alright a total of $${currentBet} was placed.`);
        money -= currentBet;
        moneyDiv.innerText = money;
        wagerButtons.style.display = 'none';
        newHand();
        break;
      default:
        console.log(betAmount);
        console.log("SOMEHOW AN UN-EXPECTED BET WAS PLACED?? FROM EVENTLISTENER ON WAGERBUTTONS");
    }
    betDiv.innerText = currentBet;
  });
}