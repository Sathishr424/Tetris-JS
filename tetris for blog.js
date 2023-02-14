// Defining game rows, cols and block size
const cols = 14;
const rows = 25;
const blockSize = 20;
// Based on above properties we'll calculate screen width and height
const screenWidth = blockSize * cols;
const screenHeight = blockSize * rows;
// Here we all addition 8 block space for next block screen
const gameWidth = screenWidth + (blockSize*8);
// Creating the canvas tag and applying the width and height properties
let canvas = document.createElement('canvas');
canvas.width = gameWidth;
canvas.height = screenHeight;
// Getting context from canvas (This is needed to draw graphics on the screen)
let ctx = canvas.getContext("2d");
// Appending the canvas to body
document.body.appendChild(canvas);
// Creating a empy grid for the size row and col
// 0 means emty block other than zero represents color
let grid = [ ...Array(rows+4).keys() ].map( i => [ ...Array(cols).keys() ].map( i => 0 ) );
// Creating colors for the blocks
// Feel free to add your own colors. You can add as many colors as you want
let colors = ["#FFEA20", "#16FF00", "#2192FF", "#3330E4", "#00FFAB", '#FF1700', '#548CFF']

// Shapes
let shapes = [
    [
        0,0,0,0,
        0,1,1,0, // OO
        0,1,1,0, // OO
        0,0,0,0
    ],
    [
        0,0,0,0,
        0,2,0,0, // O
        0,2,2,0, // OO
        0,0,2,0  //  0
    ],
    [
        0,0,0,0,
        0,0,3,0, //  O
        0,3,3,0, // OO
        0,3,0,0  // O
    ],
    [
        0,0,0,0,
        4,4,4,0, // OOO
        0,0,4,0, //   O
        0,0,0,0
    ],
    [
        0,0,0,0,
        0,0,5,0, //   O
        5,5,5,0, // OOO
        0,0,0,0
    ],
    [
        0,0,0,0,
        0,6,0,0, //   O
        6,6,6,0, // OOO
        0,0,0,0
    ],
    [
        0,0,0,0,
        0,0,0,0,
        7,7,7,7, // OOOO
        0,0,0,0
    ]
]

// For generating random block
const getRandomShape = () => {
    // Getting a random shape for shapes
    let shape = shapes[Math.floor(Math.random() * shapes.length)];
    // And getting a random color from colors
    let color = Math.floor(Math.random() * colors.length);
    // Assiging all the 1 values in the shape array to color index + 1 (for avoiding 0 index)
    return shape.map(s => s == 0 ? 0 : color + 1 )
}

let nextBlock = getRandomShape();
let currentShape = getRandomShape();
// To make it center of the screen we change the x pos
let blockPos = [0,(parseInt(cols/2) - 2) * blockSize]
// For the ghost shape
let ghostPos = 0;
// If paused or not
let move = true;
// If need rotation
let rotate = false;
// Sideway moving
let direction = 0;
let gameover = false;
// Hard down
let down = false;
let score = 0;

let game = {
    // Game reset
    reset: () => {
        // Restting the grid to 0
        grid = [ ...Array(rows+4).keys() ].map( i => [ ...Array(cols).keys() ].map( i => 0 ) );
        currentShape = getRandomShape();
        nextBlock = getRandomShape();
        gameover = false;
        blockPos = [0,(parseInt(cols/2) - 2) * blockSize];
        score = 0;
    },
    // Drawing the blocks on screen
    drawRect: (x, y, w, h, color, radius=0, shadow=false, opacity=1) => {
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        if (shadow){
            // For block shadow
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
        }
        ctx.roundRect(x+1, y+1, w-2, h-2, radius);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        if (shadow) ctx.shadowBlur = 0;
        ctx.globalAlpha = '1';
    }, // For drawing only the outline of the block
    drawStrokeRect: (x, y, w, h, color="#332C39", radius=0, shadow=false, opacity=0.2) => {
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        if (shadow){
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
        }
        ctx.rect(x, y, w, h, color, radius);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
        if (shadow) ctx.shadowBlur = 0;
        ctx.globalAlpha = '1';
    }, // If block landed generating new block and assigning the grid values
    genNewShape: () => {
        score += 10;
        for (let i=0; i<currentShape.length; i+=4){
            for (let j=0; j<4; j++){
                if (currentShape[i+j] != 0) {
                    grid[(blockPos[0] / blockSize) + (i/4)][(blockPos[1] / blockSize) + j] = currentShape[i+j];
                    if ((blockPos[0] / blockSize) + (i/4) < 5) gameover = true;
                }
            }
        }
        // Checking if rows filled
        game.chcekMatch();
        currentShape = nextBlock;
        nextBlock = getRandomShape();
        blockPos = [0,(parseInt(cols/2) - 2) * blockSize];
    },
    // Calculating ghost position
    calculateGhostPos: () => {
        for (let y=rows+4; y>=0; y-=1){
            if (game.checkCollision(0,y)){
                ghostPos = blockPos[0]+((y-1)*blockSize);
            }
        }
    },// Checking for collision
    checkCollision: (x,y, shape=null, checkX=false) => {
        if (shape == null) shape = currentShape;
        for (let i=0; i<shape.length; i+=4){
            for (let j=0; j<4; j++){
                if (shape[i+j] != 0) {
                    let xx = (blockPos[1] / blockSize) + j + x;
                    let yy = (blockPos[0] / blockSize) + (i/4) + y;
                    if ((checkX && (xx < 0 || xx >= cols)) || yy < 0 || yy >= rows+4 || grid[yy][xx] != 0 ) return true;
                }
            }
        }return false;
    }, // Rotating if not collision
    rotateBlock: () => {
        let newShape = [];
        for (let i=3; i>=0; i-=1){
            for (let j=0; j<currentShape.length; j+=4) newShape.push(currentShape[i+j]);
        }
        if (!game.checkCollision(0,0,newShape,true)) currentShape = newShape;
        rotate = false;
    },// Checking for row fills
    chcekMatch: () => {
        let t_score = parseInt((cols * 10)/2);
        for (let i=0; i<grid.length; i++){
            let match = true;
            for (let j=0; j<grid[i].length; j++){
                if (grid[i][j] == 0) { match = false; break; }
            }if (match){
                t_score += t_score;
                grid.splice(i,1);
                grid.splice(0,0,[ ...Array(cols).keys() ].map( i => 0 ));
            }
        }if (t_score > parseInt((cols * 10)/2)) score += t_score;
    },// Checking wall collision based on user key press
    checkWallCollision: (x=0,y=0) => {
        for (let i=0; i<currentShape.length; i+=4){
            for (let j=0; j<4; j++){
                if (currentShape[i+j] != 0) {
                    let xx = (blockPos[1] / blockSize) + j + x;
                    let yy = (blockPos[0] / blockSize) + (i/4) + y;
                    if (xx < 0 || xx >= cols || yy >= rows+4 || grid[yy][xx] != 0) return true;
                }
            }
        }return false;
    }, // Drawing block on the screen
    drawBlocks: () => {
        // For drawing grid blocks
        for (let i=0; i<grid.length; i++){
            for (let j=0; j<grid[i].length; j++){
                game.drawStrokeRect((j*blockSize), ((i-4)*blockSize), blockSize, blockSize);
                if (grid[i][j] != 0) game.drawRect((j*blockSize), ((i-4)*blockSize), blockSize, blockSize, colors[grid[i][j]-1], blockSize/10, true);
            }
        }// Drawing current shape and ghost
        for (let i=0; i<currentShape.length; i+=4){
            for (let j=0; j<4; j++){
                ctx.globalAlpha = '0.2';
                if (currentShape[i+j] != 0) game.drawStrokeRect(blockPos[1] + (j*blockSize), ghostPos + ((i/4)*blockSize) - (4*blockSize), blockSize, blockSize, colors[currentShape[i+j]-1], blockSize/10, true, 0.7);
                ctx.globalAlpha = '1';
                if (currentShape[i+j] != 0) game.drawRect(blockPos[1] + (j*blockSize), blockPos[0] + ((i/4)*blockSize) - (4*blockSize), blockSize, blockSize, colors[currentShape[i+j]-1], blockSize/10, true);
            }
        }
        // For the next block, score and some borders
        game.drawRect(screenWidth, 0, 3, screenHeight, "white")
        game.drawStrokeRect(screenWidth+blockSize, blockSize*2, blockSize*6, blockSize*5, "white", blockSize/10, true)
        game.drawStrokeRect(screenWidth+blockSize, blockSize*7, blockSize*6, blockSize*2, "white", blockSize/10, true)
        ctx.font = "16px bold Arial";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 2;
        ctx.textAlign = "center";
        ctx.fillText("Next", screenWidth+(blockSize*4), (blockSize*8)+(blockSize/3));
        for (let i=0; i<nextBlock.length; i+=4){
            for (let j=0; j<4; j++){
                if (nextBlock[i+j] != 0) game.drawRect(screenWidth + (blockSize*2) + (j*blockSize), (blockSize*6) + ((i/4)*blockSize) - (4*blockSize), blockSize, blockSize, colors[nextBlock[i+j]-1], blockSize/10, true);
            }
        }
        ctx.shadowColor = "white";
        ctx.shadowBlur = 2;
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText(score, screenWidth+(blockSize*4), (blockSize*10)+(blockSize/3));
        ctx.font = "bold 17px Arial";
        ctx.shadowBlur = 1;
        ctx.fillText("SCORE", screenWidth+(blockSize*4), (blockSize*10)+(blockSize/3)+25);
        ctx.shadowBlur = 0;
        //
    }, // Main game function updating all the things needed per frame
    update: () => {
        // Clearing screen from the previos render
        ctx.clearRect(0, 0, gameWidth, screenHeight);
        // Checking if game is paused or gameover
        if (move && !gameover){
            if (rotate) game.rotateBlock();
            if (game.checkWallCollision(direction,move)) direction = 0;
            blockPos[1] += direction * blockSize
            if (down) {
                while (!game.checkCollision(0,3)) blockPos[0] += blockSize;
                down = false;
            }if (direction == 0){
                if (!game.checkCollision(0,move)) blockPos[0] += blockSize;
                else game.genNewShape(); 
            }
            direction = 0;
        }
        game.calculateGhostPos()
        game.drawBlocks();
        ctx.shadowColor = "white";
        ctx.shadowBlur = 2;
        // Game over screen
        if (gameover){
            game.drawRect(0, 0, screenWidth, screenHeight, "black", 0, false, 0.7);
            ctx.font = "bold 20px Arial";
            ctx.shadowColor = "red";
            ctx.fillStyle = "#F90716";
            ctx.fillText("Game Over", screenWidth/2, screenHeight/2);
            ctx.shadowColor = "white";
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.fillText("Press enter to restart", screenWidth/2, (screenHeight/2)+30);
        }else if (!move){ // Pause screen
            game.drawRect(0, 0, screenWidth, screenHeight, "black", 0, false, 0.2);
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("Paused", screenWidth/2, screenHeight/2);
        }
        ctx.shadowBlur = 0;
    }
}

window.onload = () =>  setInterval(game.update, 175);

window.onkeypress = (event) => {
    if (event.key.toLowerCase() == 'a') direction = -1;
    else if (event.key.toLowerCase() == 'w') rotate = true;
    else if (event.key.toLowerCase() == 'd') direction = 1;
    else if (event.key.toLowerCase() == 'p') move = !move;
    else if (event.key.toLowerCase() == 's') down = true;
    else if (event.key.toLowerCase() == 'enter') game.reset();
}