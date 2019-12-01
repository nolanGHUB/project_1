//Setting variables for interactables and HTML elements to be adjusted by DOM calls.
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
const totalWrapper = document.querySelector('#totalWrapper');
const message = document.querySelector('#message');
const rules = document.querySelector('#rules');
const info = document.querySelector('#information');
const doubleButton = document.querySelector('#doubleButton');
const splitButton = document.querySelector('#splitButton');
const splitDiv = document.querySelector('#playerSplitCards');

//global variables
let deckId; // Grabs the deckId from the API to be used in order to draw said cards.
let deck; // store the full 52 card deck here. (array of card objects)
let gamesPlayedCounter; //purely for stat purposes
let money; //players total money
let score; //players total score
let currentBet; //players current bet for the current hand
let dealerHand; //the array for the dealers cards
let playerHand; //the array for the players cards
let playerSplitHand;
let handActive = 'player';  //tells the other functions if they should be working on the players hand or the split hand if that exists.
//BACK OF CARD IMAGE = 226px x 314px


//Run once per session or page refresh. Sets basic values for global counters
async function gameInit() {
  gamesPlayedCounter = 0;
  money = 100;
  score = 0;
  currentBet = 0;
  dealerHand = [];
  playerHand = [];
  playerSplitHand = [];
  message.innerHTML = ' ';
  gameStartButton.style.display = 'none';
  betDiv.innerText = currentBet;
  moneyDiv.innerText = money;
  scoreDiv.innerText = score;
  gamesPlayedCounterDiv.innerText = gamesPlayedCounter;
  let decksIdObj = await axios.get(`${getNewDecksURL}6`);
  deckId = decksIdObj.data.deck_id;
  console.log(`Six new decks created! The deckId = ${deckId}`);
  deck = await drawCards(312);//Fills the global deck array up with the full 6 decks, and they are ALREADY SHUFFLED, not necessary to follow up with shuffleDeck.
  startBetting(); //Start the game!
}

//Payout function. Takes a ratio of 1 for even money, 2 for normal payout and 2.5 for a blackjack payout and adds the appropriate winnings to the players money.
function payout(ratio) {
  let total = 0;
  total = currentBet * ratio;
  money += total;
  moneyDiv.innerText = money;
}

function startBetting() {
  //Gets called at the start of every hand before cards are delt, so this is where screen cleanup from the previous game is handled.
  gamesPlayedCounter++;
  gamesPlayedCounterDiv.innerText = gamesPlayedCounter;
  scoreDiv.innerText = score;
  message.innerHTML = 'PLACE YOUR BETS';
  newHandButton.style.display = 'none';
  currentBet = 0;
  dealer.innerHTML = ' ';
  player.innerHTML = ' ';
  betDiv.innerText = currentBet;
  //After cleanup the only real job of this function is to make the wagering buttons 5/10/25/max visible for the player.
  wagerButtons.style.display = 'flex';
  console.log('***PLACE YOUR BETS***');
}

//newHand function is called after wagering is completed when the BET button is pressed.  Makes sure the player and dealer arrays are not only empty but that the cards are put back into the deck and the entirety of the deck is re-shuffled.
async function newHand() {
  console.log('-----------------------NEW HAND---------------------------');
  dealer.innerHTML = ' ';
  player.innerHTML = ' ';
  splitDiv.innerHTML = ' '
  let flushHand = [];
  flushHand = playerHand.concat(dealerHand, playerSplitHand); //putting player and dealer hands together
  deck = deck.concat(flushHand); // puts them at the end of the deck
  deck = await localShuffleDeck(); // re-shuffles the entire deck after every hand
  playerHand = deal(2, player, true); //dealing begins
  setCardTotalVisual(player); //Sets the total visual count for the player, not dealer though we don't want the player to see the dealer's total before players turn is over!
  dealerHand = deal(2, dealer, false);
  console.log('Player, your hand is:');
  console.log(`The ${playerHand[0].value} of ${playerHand[0].suit}  &  ${playerHand[1].value} of ${playerHand[1].suit}`);
  console.log(`Your total is: ${getPlayerTotal()}`);
  console.log(' ');
  console.log(`The dealer is showing a ${dealerHand[1].value} of ${dealerHand[1].suit}`);
  console.log(' ');
  checkIfNatural(); // Before the game really begins we need to see if dealer or player have blackjack because then the hand ends. 3:2 payout for player blackjack
}

//Is the check to see if player has any amount above zero to play with, otherwise game is over beause player can no longer bet.
function moneyCheck() {
  if (money <= 0) {
    message.innerHTML = "YOU'RE OUT OF MONEY! COME BACK AGAIN SOON!"
    gameStartButton.style.display = 'block';
    newHandButton.style.display = 'none';
  }
  else {
    startBetting();
  }
}

//checking if dealer has natural 21, automatically winning before players get the chance to play unless they too have natural blackjacks.
function checkIfNatural() {
  if (checkDealerNatural() === true && checkPlayerNatural() === false) {
    flipDealersCard();
    console.log(`Dealer has Blackjack! Better luck next game.`);
    conclusion("dbj");
  } else if (checkDealerNatural() === true && checkPlayerNatural() === true) {
    console.log('You AND the dealer both have Blackjack! No payouts.');
    flipDealersCard();
    conclusion('both');
    payout(1);
  } else if (checkDealerNatural() === false && checkPlayerNatural() === true) {
    console.log('You have Blackjack!, You win!');
    flipDealersCard();
    conclusion('pbj');
    payout(2.5);
  } else {
    if (money >= (currentBet * 2)) { //check if the player has enough available money for a double, if so then offer it.
      doubleButton.style.display = 'flex';
      // splitButton.style.display = 'flex'; //and split feature as well
    }
    playerTurn();
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

//Function API call to use the API's shuffle, however to minimize API calling to just once per session, this is unused at the moment., localShuffleDeck is used instead.
async function shuffleDeck() { //try to switch this to a local function instead.
  let shuffleObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`); //Shuffles the deck on the API side.
  deck = await drawCards(312); //re-draws all the cards and refills the deck array with the now shuffled 312 cards.
}

//Does shuffling locally to minimize api calls to once per browser refresh, or player gameover state.
function localShuffleDeck() { // Same shuffle from hi-lo week1 friday homework, works perfectly here as well.
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

//to set the total value of the cards as a visual on screen and have it always attached to newest card
function setCardTotalVisual(toWho) {
  //remove previous card total displays
  if (toWho.childElementCount > 0) { // if cards are in hand
    for (let i = 0; i < toWho.childElementCount; i++) { //loop through those cards
      while (toWho.children[i].firstChild) { //while each card has children (the current total)
        toWho.children[i].removeChild(toWho.children[i].firstChild); //delete them
      }
    }
  }

  //create a new div containing the total, give it the right css and append it to the newest card of that hand
  let testTotalDiv = document.createElement('div'); //create a new total child to append to newest card
  testTotalDiv.classList.add('cardTotal'); // give the total some positioning
  if (toWho === player) {
    testTotalDiv.innerText = getPlayerTotal();
  }
  else {
    testTotalDiv.innerText = getDealerTotal();
  }
  toWho.children[toWho.childElementCount - 1].appendChild(testTotalDiv);
}

//setCardImage takes 3 parameters: which card image to show, to which person (dealer/player) this card belongs and if the card should be face-up or not
function setCardImage(card, toWho, faceUp) {
  let cardDiv = document.createElement('div');
  cardDiv.classList.add('card');
  if (faceUp) { // because there is literally only one situation where a card is face down (dealers first 2 cards 1 up 1 down), we leave the background image set. otherwise all other cards acquire their faceup image here.
    cardDiv.style.backgroundImage = `url(${card.image})`;
  }
  toWho.appendChild(cardDiv);
}

//This handles showing the dealers previously left face-down card, after the player's turn is over and the showdown occurs. This gets called a few times so a function was created.
function flipDealersCard() {
  dealer.firstElementChild.style.backgroundImage = `url(${dealerHand[0].image})`;
}

//Deal function takes 3 parameters: How many cards to deal, to whom the cards are being delt (player/dealer), and if they should be faceUp(which is passed onto the setCardImage() function.)
function deal(numOfCards, toWho, faceUp) {
  let cards = []; //Creates a new empty array to use to hold the cards coming off the deck incase there is more than one.
  if (numOfCards === 1) { //check if you are only requesting one card so that you return the object and not another array.
    let card = deck.shift();
    setCardImage(card, toWho, true); //always true if 1
    return card; //return the singular card object.
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

// grabs the 'value' value from the card object, which could be 2-9 or ACE, JACK, QUEEN or KING and assigns a true number value which we can actually use.
function calculateValue(value) {
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
//This is trickier than one would think due to the need to account for aces Basically each hand is the highest value without going over, so if that you are over with an ace as an 11, it gets reverted to a 1 by subtracting 10 to the total vlaue, not by re-assigning how much the ace is giving to the total This way we can always leave aces as 11.
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

//if hit button is pressed, deal another card to the player, adjust the total counter on screen & start the playerTurn() function again to check for conclusions
function hit() {
  if (handActive === 'player') {
    playerHand.push(deal(1, player, true));
    setCardTotalVisual(player);
    console.log(`Your new card is ${playerHand[playerHand.length - 1].value} of ${playerHand[playerHand.length - 1].suit}`);
    console.log(`Your new total is ${getPlayerTotal()}`);
    doubleButton.style.display = 'none';
    playerTurn();
  }
  else {
    playerSplitHand.push(deal(1, splitDiv, true));
    setCardTotalVisual(splitDiv);
    console.log(`Your new card is ${playerSplitHand[playerSplitHand.length - 1].value} of ${playerSplitHand[playerSplitHand.length - 1].suit}`);
    console.log(`Your new total is ${getPlayerTotal()}`);
    doubleButton.style.display = 'none';
    playerTurn();
  }
}

//if stand button is pressed players turn is over, move onto dealerTurn()
function stand() {
  doubleButton.style.display = 'none';
  dealerTurn();
}

//Doubling effectively deals 1 more, doubles your bet and forces you to stand.
function double() {
  playerHand.push(deal(1, player, true)); //deal one more card
  setCardTotalVisual(player);
  money -= currentBet; // set the variable
  currentBet *= 2;
  moneyDiv.innerText = money; //set the visuals to represent the updated variables
  betDiv.innerText = money;
  let playerTotal = getPlayerTotal(); //need to do bust check
  doubleButton.style.display = 'none';
  gameButtons.style.display = 'none';
  if (playerTotal > 21) {
    conclusion('pbust');
  } else {
    dealerTurn();
  }
}

function split() {
  splitDiv.appendChild(player.lastElementChild); // steals the last card from the players original deck and appends it to the new split deck
  playerSplitHand.push(playerHand.pop());
  splitDiv.style.display = 'grid';
  playerHand.push(deal(1, player, true));
  playerSplitHand.push(deal(1, splitDiv, true));// then deals 2 cards, one for each.
  setCardTotalVisual(player);
  setCardTotalVisual(splitDiv);
}


//conclusion handles all the end-cases for hands and applies the appropriate message to the UI Also handles score
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
      score += 150;
      break;
    case 'dbust':
      message.innerHTML = 'DEALER BUSTS! YOU WIN!';
      score += 100;
      break;
    case 'pbust':
      message.innerHTML = 'YOU BUST, BETTER LUCK NEXT GAME.'
      break;
    case 'both':
      message.innerHTML = 'YOU BOTH HAVE BLACKJACK! NO MONEY WON.'
      score += 25;
      break;
    case 'dstandlose':
      message.innerHTML = 'DEALER WINS, TRY AGAIN!'
      break;
    case 'dstandwin':
      message.innerHTML = 'DEALER STANDS, YOU WIN!'
      score += 125;
      break;
  }
  newHandButton.style.display = 'block';
}

//Governs the players turn after the betting has taken place. uses getPlayersTotal to grab the total. This gets called when hit is pressed
function playerTurn() {
  gameButtons.style.display = 'flex'; // make the hit/stand buttons visible.

  let playerOutcome;
  let playerTotal = getPlayerTotal();
  if (playerTotal > 21) {  //Find out what the players situation is and sets it for the following conditional, if choice the player still has the option to hit or stand, otherwise player has busted or landed on a non-natural 21.
    playerOutcome = "bust";
  } else if (playerTotal === 21) {
    playerOutcome = "21";
  } else {
    playerOutcome = "choice";
  }
  switch (playerOutcome) { //conditional to handle all of the outcomes
    case '21': // if the player has a non-natural 21, immediately end the turn by calling stand() for the player, because why would they hit?
      console.log("You have a 21! You stand. Dealer's turn:"); // ends players turn immediately, in no circumstance should the player hit on 21 so prevent them from doing so.
      gameButtons.style.display = 'none';
      setTimeout(function () { //giving a 1 second pause before jumping to the dealers turn (which happens so instantaneously) so the player can realize that their turn is actually ending without the need to press stand.
        stand();
      }, 750);
      break;
    case 'bust': // if player busts, money has already been subtracted no need to do negative payout
      console.log(`You've busted. Better luck next game!`);
      conclusion('pbust');
      gameButtons.style.display = 'none';
      newHandButton.style.display = 'block';
      break;
    case 'choice': // if player neither gets a 21 or bust, they must still make a decision: hit or stand?
      console.log('Do you choose to Hit or Stand?');
      message.innerHTML = 'HIT OR STAND?';
      break;
    default:
      console.log("You should never see this message - From playerOutcome condition in playerTurn()");
  }
}

//Alright, the dealerTurn() function. Dealer always stands on 17 or higher. The real trick is preventing the dealer from doing all of its moves instantly and let the player get a sense of whats happening every second.
//This is really only the situation when the player has stood and not busted and their total needs to be played against.
function dealerTurn() {
  console.log(`Alright your final total is: ${getPlayerTotal()}`);
  console.log(' ');
  console.log(`Dealer's cards are ${dealerHand[0].value} of ${dealerHand[0].suit}  &  ${dealerHand[1].value} of ${dealerHand[1].suit}`);
  flipDealersCard(); //Its time to show the dealers face-down card
  setCardTotalVisual(dealer);
  gameButtons.style.display = 'none'; //Lets get rid of the players hit/stand options as they're no longer needed
  let dealerTotal = getDealerTotal(); //grab the dealers total.
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
        setCardTotalVisual(dealer);
        console.log('Dealer chooses to hit.');
        console.log(`Dealer's new card is ${dealerHand[dealerHand.length - 1].value} of ${dealerHand[dealerHand.length - 1].suit}`);
        dealerTotal = getDealerTotal();
        console.log(`Dealer's new total is ${dealerTotal}`);
      }
    }, 1000);
  });

  promise.then(function (dealResult) { //Here is the code that is now run once the promise has been resolved. This prevents these things from running before a result is finished.
    switch (dealResult) {
      case "bust":
        setCardTotalVisual(dealer);
        console.log('Dealer has busted! You win!');
        newHandButton.style.display = 'block';
        conclusion('dbust');
        payout(2);
        break;
      case "blackjack":
        setCardTotalVisual(dealer);
        console.log('Dealer has blackjack!');
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
        newHandButton.style.display = 'block';
        break;
      default:
        console.log("Not sure what happened here! HELP! - from playGame() default result for dealerOutcome switch.");
    }
  });
}



//adds an animation to the incoming target particularly in this case adds the inner as text to where you are clicking for a little pizzaz.
function addAnimationRaiseUpFadeOut(inner, target) {
  let tempText = document.createElement('div');
  tempText.innerHTML = inner;
  tempText.classList.add('animateButtonText');
  target.appendChild(tempText);
  setTimeout(function () { tempText.remove(); }, 995); //You have to remove it once the animation is complete otherwise you end up just adding a ton of divs which will eventually bog down the DOM/memory I assume.
}

//Event Listeners for the buttons.
window.onload = function () {

  //button listeners
  gameStartButton.addEventListener('click', gameInit);
  newHandButton.addEventListener('click', moneyCheck);
  hitButton.addEventListener('click', hit);
  standButton.addEventListener('click', stand);
  doubleButton.addEventListener('click', double);
  splitButton.addEventListener('click', split);

  //wagering could be done in its own function up top but in reality its just large conditional why not handle it inside an anonymous function inside the event listener.
  wagerButtons.addEventListener('click', function (e) { //On all of the div so we dont have to set a new listener on each button individually.
    const betAmount = e.target.id;
    let currentAmountClicked = 0;
    switch (betAmount) {
      case '5': //if $5 was placed
        addAnimationRaiseUpFadeOut('$5', e.target);
        currentAmountClicked = 5;
        if ((currentAmountClicked + currentBet <= money)) { // only allow if player has enough for this bet else do nothing
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case '10': //or perhaps $10..
        addAnimationRaiseUpFadeOut('$10', e.target);
        currentAmountClicked = 10;
        if ((currentAmountClicked + currentBet <= money)) {
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case '25':
        addAnimationRaiseUpFadeOut('$25', e.target);
        currentAmountClicked = 25;
        if ((currentAmountClicked + currentBet <= money)) {
          currentBet += currentAmountClicked;
          console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        }
        break;
      case 'max': //This was needed because of the 3:2 blackjack payout.  Incase the player wants to max bet, OR if the player is left with some change after a 3:2 payout has left them with uneven chips.
        currentBet = money;
        currentAmountClicked = currentBet;
        break;
      case 'bet': //In order to set in the bet. Also allows a $0 dollar bet, not sure if a min of 5 should be forced or not?
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