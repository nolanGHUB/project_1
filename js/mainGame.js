const gameStartButton = document.querySelector('#gameStartButton');
const newHandButton = document.querySelector('#newHandButton');
const hitButton = document.querySelector('#hitButton');
const standButton = document.querySelector('#standButton');
const getNewDecksURL = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=' //add the # of decks you want to the end (1-6)
let deckId;
// let getCardsURL = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=` //add the # of cards you want from the deck (52 = 1 deck, 312 = 6 decks)
let deck; // store the full 52 card deck here. (array of card objects)
let gameState = "start"; //Should be a string equating to the current gameState such as "over", "bet", "inHand", "outHand", & "start"
let gamesPlayedCounter = 0;
let dealerHand = [];
let playerHand = [];
//BACK OF CARD IMAGE = 226px x 314px
//These game states will allow playGame() to be called over and over and shooting to the appropriate section of the game.
//start is the game state where the game has yet to begin and needs the player to choose to start playing, it should show a New game button and nothing else. It should also call the gameInit() function?
//over is the game has ended due to money === 0. When this happens it should remove the gameboard and just show the game over screen with final score earned and a 'start over' button
//bet is where the hands have been delt, but before any actions can be played you should be able to bet from your pool of money. it should remove the button clicked value from the total cash and store that into a currentBet value of some sort.
//inHand is current gameplay, should show game actions hit and stand.
//outHand is hand is over, player won or lost and this is where you check to see if they are out of money for further bets before going to bet state again, if so go to over state.


async function gameInit() {
  await newDeck();
}
  
function resetBoard() {
  //reset boardVisuals
}

async function newHand() {
  console.log('-------------------------');
  let flushHand = [];
  flushHand = playerHand.concat(dealerHand);
  deck = deck.concat(flushHand);
  if (gamesPlayedCounter % 3 === 0 && gamesPlayedCounter !==0 ) { //every 3 games, reshuffle and redraw deck variable, this calls the api so limited it from every game
    await shuffleDeck();
    console.log("RESUFFLING DECK");
  }
  gamesPlayedCounter++;
  playerHand = deal(2);
  dealerHand = deal(2);
  gameState = "player";
  playerTurn();
}
  

  //createBoard()
  //this should call the newDeck to set the deck array and deckId
  //this is where you create and populate divs to a gameBoard this includes:
  //the "stack of cards" full deck from which cards are drawn from - this should just be (hopefully a css animation) a static image for now.


  //gameOver function
  //call when money is zero, this should present a game over state on the board.
  //calls gameReset()


async function newDeck() { //WHEN CALLED: needs to be run inside of another async/await setup otherwise other functions that depend on this data won't have access.
  let decksIdObj = await axios.get(`${getNewDecksURL}6`);
  deckId = decksIdObj.data.deck_id;
  console.log(`Six new decks created! The deckId = ${deckId}`);
  deck = await drawCards(312); //Fills the global deck array up with the full 6 decks, and they are ALREADY SHUFFLED, not necessary to follow up with shuffleDeck.
}


//This is the function that actually fills the global deck variable with the cards. Not to be confused with dealCards()
//Takes argument that dictates how many cards to fill the deck array with, almost always this will be the full reset of 312 cards, however if we only wanted a single deck of 52 for example, that can be passed in and the deck array will only be 1 full deck large.
async function drawCards(numOfCards) {
  let decksObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${numOfCards}`);
  return decksObj.data.cards;
}


//Shuffles the deck without having to create a new one, and then refills the deck array with newly shuffled cards.
async function shuffleDeck() {
  console.log(deck);
  let shuffleObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`); //Shuffles the deck on the API side.
  deck = await drawCards(312); //re-draws all the cards and refills the deck array with the now shuffled 312 cards.
  console.log(deck);
}


//deal
//ORIGINAL VERSION DOES NOT WORK BUT DONT UNDERSTAND WHY: WHY CAN'T I PASS 2 ARGUMENTS, THE GLOBAL DECK THAT I WISH TO APPEND TO AND THE NUMBER OF CARDS TO APPEND, ITS A REFERENCE ISSUE BUT I JUST DONT UNDERSTAND IT. NEVERTHE LESS CHANGED TO ONLY HAVE ONE PARAMETER AND DO THE BINDING IN THE FUNCTION THAT IS CALLING THIS INSTEAD OF INSIDE THIS FUNCTION
//This function returns the number of cards you need. I feel like I could combine takeFromDeck and this but this works for now.
function deal(numOfCards) {
  let cards = [];
  if (numOfCards === 1) { //check if you are only requesting one card so that you return the object and not another array.
    cards.push(deck.shift());
    return cards.pop();
  } else {
    cards = deck.splice(0, numOfCards);// splice returns cards starting at the first variable, number of cards to return. So if first arg is 0, returning starting at the start of the array.  If I wanted to return the final 2 cards I would use splice(-numofcards, numofcards) (negative2, 2)
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
      // isEleven ? value = 11 : value = 1;
      value = 11;
      break;
    default:
      value = parseInt(value);
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
  let total = 0;
  for (let i = 0; i < dealerHand.length; i++) {
    let value = calculateValue(true, dealerHand[i].value);
    if (total + value > 21) {
      value = calculateValue(false, dealerHand[i].value);
    }
    total += value;
  }
  return total;
}


function hit() {
  playerHand.push(deal(1));
  console.log(`Your new card is ${playerHand[playerHand.length - 1].value} of ${playerHand[playerHand.length - 1].suit}`);
  console.log(`Your new total is ${getPlayerTotal()}`);
  if (getPlayerTotal() > 21) {
    gameState = "bust";
    playGame();
  }
}

function stand() {
  console.log(`Alright your final total is: ${getPlayerTotal()}`);
  gameState = "dealer";
  playGame();
}

//have the dealer perform his turn after the player has stood.
function dealerTurn() {

}

function playerTurn() {
  console.log('Player, your hand is:');
  console.log(`The ${playerHand[0].value} of ${playerHand[0].suit}  &  ${playerHand[1].value} of ${playerHand[1].suit}`);
  console.log(`Your total is: ${getPlayerTotal()}`);
  console.log(' ');
  console.log(`The dealer is showing a ${dealerHand[1].value} of ${dealerHand[1].suit}`);
  console.log(' ');
}

//clearHand()
//take both hand arrays that have been played in and reset them

 
async function testRun() { //temporary fn to call subsets of the game for testing 
  // await newDeck();
  await gameInit();
  // await shuffleDeck();
  // console.log(takeFromDeck(2));
  playerHand = deal(2);
  dealerHand = deal(2);
  // console.log(playerHand);
  // console.log(dealerHand);
  playerTurn();
}


//playGame()
//where most game logic will take place
//just a series of if elses given the current gameState string, run that code.
//all gameState variable changes will occur in other functions, then recall playGame() and playGame will jump to the appropriate
//part due to it checking the gameState
async function playGame() {
    
  if (gameState === "bet") {
    //call function to create betting options appear, create functions to respond to those button clicks & change the gameState if finish betting 
    //is set and then recall playGame()
  } else if (gameState === "player") {
    //call dealHand()
    playerTurn();
  } else if (gameState === "dealer"){
    //call 
    dealerTurn();
  } else if (gameState === "bust") {
    console.log("***************YOU BUST!***************");
    // resetBoard();
  } else if (gameState === "over") {
    //call
  } else if (gameState === "start") {
    //call gameInit()
    await gameInit();
  }  
}


window.onload = function () {
  
  gameStartButton.addEventListener('click', playGame);
  newHandButton.addEventListener('click', newHand);
  hitButton.addEventListener('click', hit);
  standButton.addEventListener('click', stand);

}