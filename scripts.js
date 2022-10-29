// board dimensions are 600px x 350px
// each snake piece is 10px x 10px

const startOrResetButton = document.querySelector('.start-or-reset-game-button');
const closeInstructionsButton = document.querySelector('.close-instructions-button');
const viewInstructionsButton = document.querySelector('.view-instructions-button');
const instructionsModal = document.querySelector('.game-instructions-modal');
const gameOverModal = document.querySelector('.game-over-modal');
const finalScore = document.querySelector('.final-score');
const timer = document.querySelector('.timer');
const snakeBoard = document.querySelector('.snake-game-canvas');

snakeBoard.addEventListener('keydown', (e) => setVelocities(e));
startOrResetButton.addEventListener('click', (e) => handleStartOrResetButtonClick(e));
closeInstructionsButton.addEventListener('click', (e) => handleCloseInstructionsButtonClick(e));
viewInstructionsButton.addEventListener('click', (e) => handleInstructionsButtonClick(e));

// prevent a user from accidentally navigating out of canvas
snakeBoard.addEventListener('blur', () => {
  running ? snakeBoard.focus() : null;
});

// create a two dimensional drawing context
const snakeBoardContext = snakeBoard.getContext('2d');

// declare empty variables to determine different states of gameplay
let running = false,
winner = false,
loser = false,
reset = false,
score = 0,
timeout = 100,
points = 100,
keyClicked = false,
turn = 0,
hours = 0,
minutes = 0,
seconds = 0,
pillXValue,
pillYValue,
interval;

// create and print a table to the console of all default settings onload
const initialTableObject = {
  intervalRunsIn: `${timeout} ms`,
  nextPillIsWorth: points,
  score,
  turn,
};

window.onload = () => console.table(initialTableObject);

// fn to pad hrs, mins, secs with zeros where there is less than 10 for a consistent look
const padTimes = (unit) => (unit < 10 ? '0' : '') + unit;

const adjustTimes = () => {
  // add a second
  seconds++

  // increment minutes at 60 seconds and reset seconds
  if (seconds === 60) {
    minutes++;
    seconds = 0;
    points += 3;
    padTimes(seconds);
    console.log('extra points added for a minute');
  }

  // increment hours at 60 minutes and reset seconds and minutes
  if (minutes === 60) {
    hours++;
    minutes = 0;
    seconds = 0;
    points += 13;
    padTimes(minutes);
    padTimes(seconds);
    console.log('extra points added for an hour');
  }
  
  // reflect current time on DOM
  timer.innerText = `${padTimes(hours)}:${padTimes(minutes)}:${padTimes(seconds)}`;
}

// choose red as initial pill color
let pillColor = '#F00';

// declare constants for board color details
const boardBackground = '#000';
const snakeColor = '#28BD00';

// fn to return array of initial snake state for reuse on reset
// snake always begins in the middle of the board
const getInitialSnake = () => [
  {x: 300, y: 180},
  {x: 290, y: 180},
  {x: 280, y: 180},
  {x: 270, y: 180},
  {x: 260, y: 180},
];

// use copy for game so that original state is unchanged on reset
let snakeCopy = getInitialSnake();

// horizontal velocity, snake begins moving at ten pixels to the right
let xVelocity = 10;

// set vertical velocity
let yVelocity = 0;

// update velocities based on keypresses
// the conditions make sure that you can't move backwards into your self
// the keyClicked is used to make sure you cant choose another direction
// until after the next render of the game
const setVelocities = (e) => {
  if (!keyClicked && !xVelocity && e.key.toLowerCase() === 'a') {
    keyClicked = true;
    xVelocity = -10;
    yVelocity = 0;
  } else if (!keyClicked && !xVelocity && e.key.toLowerCase() === 'd') {
    keyClicked = true;
    xVelocity = 10;
    yVelocity = 0;
  } else if (!keyClicked && !yVelocity && e.key.toLowerCase() === 'w') {
    keyClicked = true;
    xVelocity = 0;
    yVelocity = -10;
  } else if (!keyClicked && !yVelocity && e.key.toLowerCase() === 's') {
    keyClicked = true;
    xVelocity = 0;
    yVelocity = 10;
  }
}

// set game for reset or initial start
const handleStartOrResetButtonClick = (e) => {

  // reset timing
  interval ? clearInterval(interval) : null;
  hours = 0;
  minutes = 0;
  seconds = 0;
  timer.innerHTML = `${padTimes(hours)}:${padTimes(minutes)}:${padTimes(seconds)}`;

  // reset player status and start with original centered snake
  loser = false;
  timeout = 100;
  snakeCopy = getInitialSnake();
  score = 0;
  turn = 0;
  points = 100;
  keyClicked = false;

  if (e.target.innerText.toLowerCase() === 'start') {

    interval = setInterval(adjustTimes, 1000);
    
    // set game state to enable/disable recursively calling runGame fn
    reset = false;
    running = true;

    // focus on the canvas so the player can target the keypress event
    snakeBoard.focus();

    // hide instructions if they are currently displayed
    instructionsModal.classList.add('hidden');

    // disable instructions button during gameplay
    viewInstructionsButton.disabled = true;

    // update button text
    e.target.innerText = 'Reset';

    // run app
    runGame();
    running = true;
  } else if (e.target.innerText.toLowerCase() === 'reset' && !running) {

    console.clear();

    // reset starting velocities so snake will proceed toward right of the screen
    xVelocity = 10;
    yVelocity = 0;
    
    // update state to stop recursively calling runGame fn
    running = false;
    reset = true;
    loser = true;

    // randomly put pill on canvas
    populatePill();

    // enable view instructions button
    viewInstructionsButton.disabled = false;

    // hide game over modal
    gameOverModal.classList.add('hidden');

    // update button text
    e.target.innerText = 'Start';

    // add snake to canvas without movement
    drawSnake();
  } else if (e.target.innerText.toLowerCase() === 'reset' && running) {
    
    console.clear();

    // reset starting velocities so snake will proceed toward right of the screen
    xVelocity = 10;
    yVelocity = 0;

    // update state to stop recursively calling runGame fn
    running = false;
    reset = true;
    loser = true;

    // randomly put pill on canvas
    populatePill();

    // add snake to canvas without movement
    drawSnake();
  }
}

// close instructions when specifically clicking close
const handleCloseInstructionsButtonClick = (e) => instructionsModal.classList.add('hidden');

// toggle instructions on/off on instructions button click
const handleInstructionsButtonClick = (e) => instructionsModal.classList.contains('hidden') ? instructionsModal.classList.remove('hidden') : instructionsModal.classList.add ('hidden');


// reset to blank canvas
const clearCanvas = () => {
  
  //  Select the color to fill the drawing
  snakeBoardContext.fillStyle = boardBackground;

  // Draw a 'filled' rectangle to cover the entire canvas
  snakeBoardContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height);

  // Draw a 'border' around the entire canvas
  snakeBoardContext.strokeRect(0, 0, snakeBoard.width, snakeBoard.height);
}

// Draw the snake on the canvas
const drawSnake = () => snakeCopy.forEach((snakePart, i) => drawSnakePart(snakePart, i));

// Draw one snake part
const drawSnakePart = (part, i) => {

  // Set the color of the snake part
  !i ? snakeBoardContext.fillStyle = '#FF0' : snakeBoardContext.fillStyle = snakeColor;

  // Draw a 'filled' rectangle to represent the snake part at the coordinates the part is located
  snakeBoardContext.fillRect(part.x, part.y, 10, 10);

  // Draw a border around the snake part
  snakeBoardContext.strokeRect(part.x, part.y, 10, 10);
}

// method to update position of snake and velocities
const moveSnake = () => {  

  // condition to check if a collision occurs with one of the walls
  if (snakeCopy[0].x + xVelocity === -10 || snakeCopy[0].x + xVelocity === 600 || snakeCopy[0].y + yVelocity === -10 || snakeCopy[0].y + yVelocity === 350) {
    loser = true;
    running = false;
    clearInterval(interval);
    return;
  }

  // variable describing where the snake will be next
  const head = { x: snakeCopy[0].x + xVelocity, y: snakeCopy[0].y + yVelocity };

    // check to see if the snake collided with itself
    checkForTailCollision(head);

    // if the snake collides with a pill, randomly generate another one
    if (checkForPillCollision(head)) {
      populatePill();
    } else {
      
      // add new head position and remove end of tail
      snakeCopy.unshift(head);
      snakeCopy.pop();
    }
}

// runGame function called repeatedly to keep the game running
const runGame = (e) => {
  if (loser) {

    // show game over modal
    gameOverModal.classList.remove('hidden');
    
    // display user score on game over modal
    finalScore.innerText = score;
    
    // enable instructions button
    viewInstructionsButton.disabled = false;
    
    // clear current board
    snakeBoardContext.clearRect(0, 0, snakeBoard.width, snakeBoard.height);

  } else if (timeout <= 50) {
    // by the time the timeout gets this low the game is hardly playable and a winner is declared
    winner = true;
  } else {
    
    // repaint canvas with each call to runGame if all other conditions fail
    setTimeout(() => {
      keyClicked = false;
      clearCanvas();
      populatePill(pillXValue, pillYValue);
      moveSnake();
      drawSnake();
      runGame();
    }, timeout);
  }
}

const populatePill = (x, y) => {

  // declare variable to make sure the pill isn't populated on top of the snake
  let pillIsOnOrAroundSnake = false;

  // if called without all arguments, generate random x and y values for pills
  if (!x || !y) {

    // get random 10x10 blocks on the canvas for pill placement
    // add five to center the pill in the square on the grid
    possibleX = Math.random() * 60 + 5
    possibleY = Math.random() * 35 + 5
    
    // make sure the random coordinates are not too close or on top of the snake
    snakeCopy.forEach(snakePart => {
      if (possibleX * 10 - snakePart.x <= 5 && possibleX * 10 - snakePart.x >= -5 && possibleY * 10 - snakePart.y <= 5 && possibleY * 10 - snakePart.y >= -5) {
        pillIsOnOrAroundSnake = true;
      }
    });

    // make sure random coordinates are not off the border
    // may not need this ??
    if (possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345 || pillIsOnOrAroundSnake) {
      populatePill();
      return;
    }

    // round off decimals and scale values to actual columns and rows
    pillXValue = Math.round(possibleX) * 10 + 5;
    pillYValue = Math.round(possibleY) * 10 + 5;
  }

  // draw and color pills on the page
  snakeBoardContext.beginPath();
  snakeBoardContext.ellipse(pillXValue, pillYValue, 5 , 5, Math.PI / 4, 0, 2 * Math.PI);
  snakeBoardContext.stroke();
  snakeBoardContext.fillStyle = pillColor;
  snakeBoardContext.fill();
  snakeBoardContext.closePath();
}

// assess if snake has collided with a pill
const checkForPillCollision = (head) => {
  if ((xVelocity && head.x + 5 === pillXValue) && head.y + 5 === pillYValue || (yVelocity && head.y + 5 === pillYValue) && head.x + 5 === pillXValue) {

    // rotate pill colors between blue and red
    pillColor === '#F00' ? pillColor = '#00F' : pillColor = '#F00';

    // add head without removing end of tail to grow snake
    snakeCopy.unshift(head);

    // increment user score
    score += points;

    // add one to points for effect in high scores
    points++;

    // increment turn
    turn++;

    // gradually speed up movement of the snake
    timeout = Number((timeout - .04).toFixed(2));

    const tableObject = {
      intervalRunsIn: `${timeout} ms`,
      nextPillIsWorth: points,
      score,
      turn,
    };
    console.table(tableObject);
    return true;
  }
  return false;
}

// assess if snake has collided with itself
const checkForTailCollision = (head) => {
  snakeCopy.forEach(snakePart => {
    if (head.x === snakePart.x && head.y === snakePart.y) {
      loser = true;
      clearInterval(interval);
    }
  });
}

drawSnake();
populatePill();
