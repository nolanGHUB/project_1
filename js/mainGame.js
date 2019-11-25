const gameStartButton = document.querySelector('#gameStartButton');
const newHandButton = document.querySelector('#newHandButton');
const hitButton = document.querySelector('#hitButton');
const standButton = document.querySelector('#standButton');
const getNewDecksURL = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=' //add the # of decks you want to the end (1-6)
const wagerButtons = document.querySelector('#wagerOptions');

let deckId;
// let getCardsURL = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=` //add the # of cards you want from the deck (52 = 1 deck, 312 = 6 decks)
let deck; // store the full 52 card deck here. (array of card objects)
let gameState = "start"; //Should be a string equating to the current gameState such as "over", "bet", "inHand", "outHand", & "start"
let gamesPlayedCounter = 0;
let money = 500;
let currentBet = 0;
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
  // await newDeck();
  let decksIdObj = await axios.get(`${getNewDecksURL}6`);
  deckId = decksIdObj.data.deck_id;
  console.log(`Six new decks created! The deckId = ${deckId}`);
  deck = await drawCards(312);//Fills the global deck array up with the full 6 decks, and they are ALREADY SHUFFLED, not necessary to follow up with shuffleDeck.
}

//All payouts are 1:1, unless player gets a blackjack, then payout is 3:2.  negative payouts accepted for losses. 0 accepted for even money/push?
function payout(ratio) { //ratio should be either 1, 1.75 or -1.
  let total = 0;
  total = money * ratio;
  return total;
}

//have all the event liseners for bet buttons point here, then figure out which using... getAttribute? values will be hard coded?
//Maybe Have 1 5 10 25 50 100 buttons and then a BET button & have the buttons add to a visible numerical total then on click they all point here and this function just looks at the number. using a querySelector innerText?
function setWager() {
  
}
  

// I think this is where payout will be called, somehow in here.
async function newHand() {
  console.log('-----------------------NEW HAND---------------------------');
  console.log('----------------------------------------------------------');
  let flushHand = [];
  flushHand = playerHand.concat(dealerHand);
  deck = deck.concat(flushHand);
  deck = await localShuffleDeck(); // shuffle after every hand.
  gamesPlayedCounter++;
  playerHand = deal(2);
  dealerHand = deal(2);
  console.log('Player, your hand is:');
  console.log(`The ${playerHand[0].value} of ${playerHand[0].suit}  &  ${playerHand[1].value} of ${playerHand[1].suit}`);
  console.log(`Your total is: ${getPlayerTotal()}`);
  console.log(' ');
  console.log(`The dealer is showing a ${dealerHand[1].value} of ${dealerHand[1].suit}`);
  console.log(' ');
  
  gameState = 'bet';
  wagerButtons.style.visibility = 'visible';
  console.log('***PLACE YOUR BETS***');

  // playGame();
  //doShowCorrectButtons here.
}

function checkIfNatural() {
  //checking if dealer has natural 21, automatically winning before players get the chance to play unless they too have natural blackjacks.
  if (checkDealerNatural() === true && checkPlayerNatural() === false) {
    gameState = "over";
    console.log(`Dealer has Blackjack! Better luck next game.`);
    playGame();
  } else if (checkDealerNatural() === true && checkPlayerNatural() === true) {
    gameState = "over";
    console.log('You AND the dealer both have Blackjack! No payouts.');
    playGame();
  } else if (checkDealerNatural() === false && checkPlayerNatural() === true) {
    gameState = "over";
    console.log('You have Blackjack!, You win!'); 
    playGame();
  } else {
    gameState = "player";
    playGame();
  }
}
  

  //createBoard()
  //this should call the newDeck to set the deck array and deckId
  //this is where you create and populate divs to a gameBoard this includes:
  //the "stack of cards" full deck from which cards are drawn from - this should just be (hopefully a css animation) a static image for now.

  //reset visuals after a hand ends.
  function resetBoard() {
    //reset board Visuals
  }

  //gameOver function
  //call when money is zero, this should present a game over state on the board.
  //calls gameReset()


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


//deal - all local not using API
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

//if hit button is pressed
function hit() {
  gameState = 'player';
  playerHand.push(deal(1));
  console.log(`Your new card is ${playerHand[playerHand.length - 1].value} of ${playerHand[playerHand.length - 1].suit}`);
  console.log(`Your new total is ${getPlayerTotal()}`);
  playGame();
}

//if stand button is pressed
function stand() {
  
  gameState = "dealer";
  playGame();
}

//returns natural for 2-card blackjack, 21 or bust.  hit() and stand() do the rest of the player logic.
function playerTurn() {
  let playerTotal = getPlayerTotal();
  if (playerTotal > 21) { 
    gameState = "bust";
    return "bust";
  } else if (playerTotal === 21) {
    return "21";
  } else {
    return "choice";
  }
}

//clearHand()
//take both hand arrays that have been played in and reset them


//playGame()
//where most game logic will take place
//just a series of if elses given the current gameState string, run that code.
//all gameState variable changes will occur in other functions, then recall playGame() and playGame will jump to the appropriate
//part due to it checking the gameState
async function playGame() {
  if (gameState === "natural") {
    checkIfNatural();
    //call function to create betting options appear, create functions to respond to those button clicks & change the gameState if finish betting 
    //is set and then recall playGame()
    } else if (gameState === "player") {
      
      let playerOutcome = playerTurn(); // natural, 21, bust  -- if stand it automatically goes to the dealers turn and never enters this loop.
      switch (playerOutcome) {
        case '21':
          console.log("You have a 21! You stand. Dealer's turn:");
          setTimeout(function () { //giving a 1 second pause before jumping to the dealers turn (which happens so instantaneously) so the player can realize what happened before its over.
            stand();
          }, 750);
          break;
        case 'bust':
          console.log(`You've busted. Better luck next game!`);
          gameState === "bust";
          break;
        case 'choice':
          console.log('Do you choose to Hit or Stand?');
          break;
        default:
          console.log("You should never see this message - From playGame() player section.");
      }
  } else if (gameState === "dealer") {
      console.log(`Alright your final total is: ${getPlayerTotal()}`);
      console.log(' ');
      console.log(`Dealer's cards are ${dealerHand[0].value} of ${dealerHand[0].suit}  &  ${dealerHand[1].value} of ${dealerHand[1].suit}`);
      let dealerTotal = getDealerTotal();
      console.log(`Dealer's total is: ${dealerTotal}`);
      let dealResult = "";

      let promise = new Promise(function (resolve) {
        let dealerThink = setInterval(function () {
        if (dealerTotal > 21) {//if dealer bust
          dealResult = 'bust';
          resolve(dealResult);
          clearInterval(dealerThink);
        } else if (dealerTotal >= 17) {
          console.log('Dealer Stands');
          dealResult = 'stand';
          resolve(dealResult);
          clearInterval(dealerThink);
        } else {
          dealerHand.push(deal(1));
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
            break;
          case "blackjack":
            console.log('Dealer has blackjack!');
            break;
          case "stand":
            // console.log(`**TEST FROM PLAYGAME DEALER** YOUR TOTAL:${getPlayerTotal()}  DEALER TOTAL:${getDealerTotal()}.    ${dealerOutcome} WAS RETURNED`);
            if (getPlayerTotal() > getDealerTotal()) {
              console.log('You win!');
            } else if (getPlayerTotal() < getDealerTotal()) {
              console.log('Sorry, you lose this round. Better luck next game!');
            } else {
              console.log('Push! No money won or lost.');
            }
            break;
          default:
            console.log("Not sure what happened here! HELP! - from playGame() default result for dealerOutcome switch.");
        } 
      }); 
  } else if (gameState === "bust") {
    console.log("***YOU BUST!***");
    // resetBoard();
  } else if (gameState === "over") {
    //only show the deal new game button.
    // hide hit and stand
  } else if (gameState === "start") {
    await gameInit();
  }  
}


window.onload = function () {
  
  gameStartButton.addEventListener('click', playGame);
  newHandButton.addEventListener('click', newHand);
  hitButton.addEventListener('click', hit);
  standButton.addEventListener('click', stand);

  //wagering
  wagerButtons.addEventListener('click', async function (e) {
    const betAmount = e.target.id;
    let currentAmountClicked = 0;
    switch (betAmount) {
      case '5':
        currentAmountClicked = 5;
        currentBet += currentAmountClicked;
        console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        break;
      case '10':
        currentAmountClicked = 10;
        currentBet += currentAmountClicked;
        console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        break;
      case '25':
        currentAmountClicked = 25;
        currentBet += currentAmountClicked;
        console.log(`$${betAmount} placed. Current bet total: $${currentBet}`);
        break;
      case 'bet':
        console.log(`Alright a total of ${betAmount} was placed.`);
        wagerButtons.style.visibility = 'hidden';
        checkIfNatural();
        break;
      default:
        console.log(betAmount);
        console.log("SOMEHOW AN UN-EXPECTED BET WAS PLACED?? FROM EVENTLISTENER ON WAGERBUTTONS");
    }
    
  });
}