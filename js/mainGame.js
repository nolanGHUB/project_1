const getIdButton = document.querySelector('#gameStart');
const getNewDecksURL = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=' //add the # of decks you want to the end (1-6)
let deckId;
// let getCardsURL = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=` //add the # of cards you want from the deck (52 = 1 deck, 312 = 6 decks)
let deck; // store the full 52 card deck here. (array of card objects)
let gameState = "start"; //Should be a string equating to the current gameState such as "over", "bet", "inHand", "outHand" & "start"
//BACK OF CARD IMAGE = 226px x 314px
//These game states will allow playGame() to be called over and over and shooting to the appropriate section of the game.
//start is the game state where the game has yet to begin and needs the player to choose to start playing, it should show a New game button and nothing else. It should also call the gameInit() function?
//over is the game has ended due to money === 0. When this happens it should remove the gameboard and just show the game over screen with final score earned and a 'start over' button
//bet is where the hands have been delt, but before any actions can be played you should be able to bet from your pool of money. it should remove the button clicked value from the total cash and store that into a currentBet value of some sort.
//inHand is current gameplay, should show game actions hit and stand.
//outHand is hand is over, player won or lost and this is where you check to see if they are out of money for further bets before going to bet state again, if so go to over state.

  //gameInit function
  //invokes all functions required to begin the game.
  //calls createBoard()
  //calls playGame()

  
  //createBoard()
  //this should call the newDeck to set the deck array and deckId
  //this is where you create and populate divs to a gameBoard this includes:
  //the "stack of cards" full deck from which cards are drawn from - this should just be (hopefully a css animation) a static image for now.


  //gameOver function
  //call when money is zero, this should present a game over state on the board.
  //calls gameReset()


  //newDeck
  //using the API, creates 6 new shuffled decks and sets them all into one main deck array
  //also sets the deck_id to deckId incase it needs to be referenced to later.
  //const deck = await axios.get(getNewDecksURL);
  //deckId = deck.data.deck_id;
  //console.log(deckId);
async function newDeck() { //WHEN CALLED: needs to be run inside of another async/await setup otherwise other functions that depend on this data won't have access.
  let decksIdObj = await axios.get(`${getNewDecksURL}6`);
  deckId = decksIdObj.data.deck_id;
  console.log(`Six new decks created! The deckId = ${deckId}`);
  deck = await drawCards(312); //Fills the global deck array up with the full 6 decks, and they are already shuffled.
}


//This is the function that actually fills the global deck variable with the cards. Not to be confused with dealCards()
//Takes argument that dictates how many cards to fill the deck array with, almost always this will be the full reset of 312 cards, however if we only wanted a single deck of 52 for example, that can be passed in and the deck array will only be 1 full deck large.
async function drawCards(num) {
  let decksObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${num}`);
  return decksObj.data.cards;
}


//Shuffles the deck without having to create a new one, and then refills the deck array with newly shuffled cards.
async function shuffleDeck() {
  let shuffleObj = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`); //Shuffles the deck on the API side.
  deck = await drawCards(312); //re-draws all the cards and refills the deck array with the now shuffled 312 cards.
}





async function testRun() { //temporary fn to call subsets of the game for testing 
  await newDeck();
  await shuffleDeck();
}
testRun();

  //clearHand()
  //take both hand arrays that have been played in and reset them

  
  //dealCards(number of cards)
  //returns the number of cards (pops) from the deck array


  //dealHand
  //using dealCards() applies the appropriate amount of cards to each hand, 2 each.



  //playGame()
  //where most game logic will take place
  //just a series of if elses given the current gameState string, run that code.
  //all gameState variable changes will occur in other functions, then recall playGame() and playGame will jump to the appropriate
  //part due to it checking the gameState
  //call dealHand
  //once the player can see their cards,  change gameState to "bet"
  //make betOptions appear, this should be a div containing the buttons that take from totalMoney and sets currentBet
  //
  //make gameOptions appear, this should be a div containing the buttons for hit and stand (keep it simple at the start)
  //
function playGame() {
    
  if (gameState === "bet") {
    //call function to create betting options appear, create functions to respond to those button clicks & change the gameState if finish betting 
    //is set and then recall playGame()
  } else if (gameState === "inHand") {
    //call dealHand()
  } else if (gameState === "outHand"){
    //call 
  } else if (gameState === "over") {
    //call
  } else if (gameState === "start") {
    //call gameInit()
  }  
}


window.onload = function() {
  

  // getIdButton.addEventListener('click',async function () {
  //   //call newDeck fn
  //   //newDecks()

  //   // const deck = await axios.get(newDeck);
  //   // deckId = deck.data.deck_id;
  //   // console.log(deckId);
  // })


}