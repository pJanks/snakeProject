// ----------------- SNAKE SCRIPTS -----------------
// board dimensions are 600 x 350
// each snake piece is 10 x 10
// handle events for snake movement and different game state navigation
$('.snake-game-canvas').on('keydown', (e) => setVelocities(e))
$('.start-or-reset-game-button').on('click', (e) => HandleStartOrResetButtonClick(e))
$('.close-instructions-button').on('click', (e) => handleCloseInstructionsButtonClick(e))
$('.view-instructions-button').on('click', (e) => handleInstructionsButtonClick(e))

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
interval

// timer scripts

$(document).ready(() => {
  const tableObject = {
    intervalRunsIn: `${timeout} ms`,
    nextPillIsWorth: points,
    score,
    turn,
  }
  console.table(tableObject)
})

const padTimes = (unit) => (unit < 10 ? '0' : '') + unit

const adjustTimes = () => {
  seconds++
  if (seconds === 60) {
    minutes++
    seconds = 0
    points += 3
    padTimes(seconds)
    console.log('extra points added for a minute')
  }

  if (minutes === 60) {
    hours++
    minutes = 0
    seconds = 0
    points += 13
    padTimes(minutes)
    padTimes(seconds)
    console.log('extra points added for an hour')
  }
  $('.timer').text(`${padTimes(hours)}:${padTimes(minutes)}:${padTimes(seconds)}`)
}

let pillColor = '#FF0C00'

// declare constants for board color details
const boardBackground = '#000'
const snakeColor = '#28BD00'


// save initial snake state for reuse on reset
const getInitialSnake = () => [
  {x: 300, y: 180},
  {x: 290, y: 180},
  {x: 280, y: 180},
  {x: 270, y: 180},
  {x: 260, y: 180},
]

// use copy for game so that you can reset to original position after end of game
let snakeCopy = getInitialSnake()


// Horizontal velocity
let xVelocity = 10

// Vertical velocity
let yVelocity = 0

// update velocities based on keypresses
const setVelocities = (e) => {
  if (!keyClicked && !xVelocity && e.key.toLowerCase() === 'a') {
    keyClicked = true
    xVelocity = -10
    yVelocity = 0
  } else if (!keyClicked && !xVelocity && e.key.toLowerCase() === 'd') {
    keyClicked = true
    xVelocity = 10
    yVelocity = 0
  } else if (!keyClicked && !yVelocity && e.key.toLowerCase() === 'w') {
    keyClicked = true
    xVelocity = 0
    yVelocity = -10
  } else if (!keyClicked && !yVelocity && e.key.toLowerCase() === 's') {
    keyClicked = true
    xVelocity = 0
    yVelocity = 10
  }
}

// Get the canvas element
const snakeBoard = document.getElementById('snake-game-canvas')

// refocus on blur to prevent a user from accidentally clicking out of canvas and breaking game
$(snakeBoard).on('blur', () => {
 if (running) {
  snakeBoard.focus()
 }
})

// Return a two dimensional drawing context
const snakeBoardContext = snakeBoard.getContext('2d')

// reset game state and clear everything for / start a new game
const HandleStartOrResetButtonClick = (e) => {

  interval ? clearInterval(interval) : null
  hours = 0
  minutes = 0
  seconds = 0
  $('.timer').html(`${padTimes(hours)}:${padTimes(minutes)}:${padTimes(seconds)}`)

  const tableObject = {
      intervalRunsIn: `${timeout} ms`,
      nextPillIsWorth: points,
      score,
      turn,
    }
    console.table(tableObject)

  // reset player status and start with original centered snake
  loser = false
  timeout = 100
  snakeCopy = getInitialSnake()
  score = 0
  turn = 0
  points = 100
  keyClicked = false

  if ($(e.target).text().toLowerCase() === 'start') {

    interval = setInterval(adjustTimes, 1000)
    
    // set game state to enable recursively calling runGame fn
    reset = false
    running = true

    // focus on the canvas so the player can target the keypress event
    snakeBoard.focus()

    // hide instructions if they are currently displayed
    $('.game-instructions-modal').addClass('hidden')

    // disable instructions button during gameplay
    $('.view-instructions-button').prop('disabled', true)

    // update button text
    $(e.target).text('Reset')

    // run app
    runGame()
  } else if ($(e.target).text().toLowerCase() === 'reset') {

    console.clear()

    // reset starting velocities so snake will proceed toward right of the screen
    xVelocity = 10
    yVelocity = 0

    // update state to stop recursively calling runGame fn
    running = false
    reset = true

    // randomly put pill on canvas
    populatePill()

    // enable view instructions button
    $('.view-instructions-button').prop('disabled', false)

    // hide game over modal
    $('.game-over-modal').addClass('hidden')

    // update button text
    $(e.target).text('Start')

    // add snake to canvas without movement
    drawSnake()
  }
}

// close instructions when specifically clickIng close
const handleCloseInstructionsButtonClick = (e) => {
  $('.game-instructions-modal').addClass('hidden')
}

// toggle instructions on/off on instructions button click
const handleInstructionsButtonClick = (e) => {
  $('.game-instructions-modal').toggleClass('hidden')
}

// reset to blank canvas
const clearCanvas = () => {
  
  //  Select the color to fill the drawing
  snakeBoardContext.fillStyle = boardBackground

  // Draw a 'filled' rectangle to cover the entire canvas
  snakeBoardContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height)

  // Draw a 'border' around the entire canvas
  snakeBoardContext.strokeRect(0, 0, snakeBoard.width, snakeBoard.height)
}

// Draw the snake on the canvas
const drawSnake = () => {

  // Draw each part
  snakeCopy.forEach((snakePart, i) => drawSnakePart(snakePart, i))
}

// Draw one snake part
const drawSnakePart = (snakePart, i) => {

  // Set the color of the snake part
  !i ? snakeBoardContext.fillStyle = '#F0FF00' : snakeBoardContext.fillStyle = snakeColor

  // Draw a 'filled' rectangle to represent the snake part at the coordinates the part is located
  snakeBoardContext.fillRect(snakePart.x, snakePart.y, 10, 10)

  // Draw a border around the snake part
  snakeBoardContext.strokeRect(snakePart.x, snakePart.y, 10, 10)
}

// method to update position of snake and velocities
const moveSnake = () => {  

  // condition to check if a collision occurs with one of the walls
  if (snakeCopy[0].x + xVelocity === -10 || snakeCopy[0].x + xVelocity === 600 || snakeCopy[0].y + yVelocity === -10 || snakeCopy[0].y + yVelocity === 350) {
    loser = true
    running = false
    clearInterval(interval)
    return
  }

  // variable describing where the snake will be next
  const head = { x: snakeCopy[0].x + xVelocity, y: snakeCopy[0].y + yVelocity }

    // check to see if the snake collided with itself
    checkForTailCollision(head)

    // if the snake collides with a pill, randomly generate another one
    if (checkForPillCollision(head)) {
      populatePill()
    } else {
      
      // add new head position and remove end of tail
      snakeCopy.unshift(head)
      snakeCopy.pop()
    }
}

// runGame function called repeatedly to keep the game running
const runGame = (e) => {
  if (loser) {
    // show game over modal
    $('.game-over-modal').removeClass('hidden')
    
    // display user score on game over modal
    $('.score').text(score)
    
    // enable instructions button
    $('.view-instructions-button').prop('disabled', false)
    
    // clear current board
    snakeBoardContext.clearRect(0, 0, snakeBoard.width, snakeBoard.height)

  } else if (timeout <= 50) {
    winner = true
  } else {
    // run app repeatedly
    running = true
    setTimeout(() => {
      keyClicked = false
      clearCanvas()
      populatePill(pillXValue, pillYValue)
      moveSnake()
      drawSnake()
      runGame()
    }, timeout)
  }
}

const populatePill = (x, y) => {

  // declare variable to make sure the pill isn't populated on top of the snake
  let pillIsOnOrAroundSnake = false

  // if called without all arguments, generate random x and y values for pills
  if (!x || !y) {

    // get random 10x10 blocks on the canvas for pill placement
    // add five to center the pill in the square on the grid
    possibleX = Math.random() * 60 + 5
    possibleY = Math.random() * 35 + 5
    
    // make sure the random coordinates are not too close or on top of the snake
    snakeCopy.forEach(snakePart => {
      if (possibleX * 10 - snakePart.x <= 5 && possibleX * 10 - snakePart.x >= -5 && possibleY * 10 - snakePart.y <= 5 && possibleY * 10 - snakePart.y >= -5) {
        pillIsOnOrAroundSnake = true
      }
    })

    // make sure random coordinates are not off the border
    // may not need this ??
    if (possibleX * 10 < 5 || possibleX * 10 > 595 || possibleY * 10 < 5 || possibleY * 10 > 345 || pillIsOnOrAroundSnake) {
      populatePill()
      return
    }

    // round off decimals and scale values to actual columns and rows
    pillXValue = Math.round(possibleX) * 10 + 5
    pillYValue = Math.round(possibleY) * 10 + 5
  }

  // draw and color pills on the page
  snakeBoardContext.beginPath()
  snakeBoardContext.ellipse(pillXValue, pillYValue, 5 , 5  , Math.PI / 4, 0, 2 * Math.PI)
  snakeBoardContext.stroke()
  snakeBoardContext.fillStyle = pillColor
  snakeBoardContext.fill()
  snakeBoardContext.closePath()
}

// assess if snake has collided with a pill
const checkForPillCollision = (head) => {
  if ((xVelocity && head.x + 5 === pillXValue) && head.y + 5 === pillYValue || (yVelocity && head.y + 5 === pillYValue) && head.x + 5 === pillXValue) {

    // rotate pill colors between blue and red
    pillColor === '#FF0C00' ? pillColor = '#0725FF' : pillColor = '#FF0C00'

    // add head without removing end of tail to grow snake
    snakeCopy.unshift(head)

    // increment user score
    score += points

    // add one to points for effect in high scores
    points++

    // increment turn
    turn++

    // gradually speed up movement of the snake
    timeout = Number((timeout - .04).toFixed(2))

    // console.log('--------------start--------------')
    // console.log('turn: ', points - 100)
    // console.log('timeout: ', timeout)
    // console.log('score: ', score)
    // console.log('--------------end--------------')

    const tableObject = {
      intervalRunsIn: `${timeout} ms`,
      nextPillIsWorth: points,
      score,
      turn,
    }
    console.table(tableObject)

    return true
  }
  return false
}

// assess if snake has collided with itself
const checkForTailCollision = (head) => {
  snakeCopy.forEach(snakePart => {
    if (head.x === snakePart.x && head.y === snakePart.y) {
      loser = true
      clearInterval(interval)
    }
  })
}
// ----------------- END SNAKE SCRIPTS -----------------

// set initial gameboard
drawSnake()
populatePill()
