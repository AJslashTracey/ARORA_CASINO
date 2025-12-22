function secureRandom() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xFFFFFFFF + 1); // [0, 1]
}



function randomInt(min, max) {
    return Math.floor(secureRandom() * max);

}



// ==== SYMBOLS / REEL STRIPS =====
// Example: 5 reels, 3 rows visible. Duplicate symbols = higher weight.
//
// You will later tweak these to get a specific RTP/volatility.
// Symbols: 10, J, Q, K, A = lows; C, D, G, H = highs; W = wild; S = scatter.

const reels = [
    ["10","10","10","J","J","Q","Q","K","K","A","A","C","D","G","H","W","10","J","Q","S"],
    ["10","10","J","J","Q","Q","Q","K","K","A","A","A","C","D","G","H","W","10","Q","S"],
    ["10","J","J","J","Q","Q","K","K","K","A","A","C","D","G","H","H","W","10","Q","S"],
    ["10","10","J","Q","Q","Q","K","K","A","A","C","C","D","G","H","W","10","J","Q","S"],
    ["10","J","Q","Q","K","K","K","A","A","C","D","D","G","H","H","W","10","J","Q","S"]
  ];




const paylines = [
    [1,1,1,1,1], // middle
    [0,0,0,0,0], // top
    [2,2,2,2,2], // bottom
    [0,1,2,1,0], // V
    [2,1,0,1,2], // inverted V
    [0,0,1,2,2],
    [2,2,1,0,0],
    [1,0,1,2,1],
    [1,2,1,0,1],
    [0,1,1,1,2]
];



const paytable = {
    "10": {3: 2, 4: 5, 5: 10},
    "J":  {3: 3, 4: 8, 5: 15},
    "Q":  {3: 4, 4: 10,5: 20},
    "K":  {3: 5, 4: 15,5: 30},
    "A":  {3: 6, 4: 20,5: 40},
    "C":  {3: 8, 4: 30,5: 60},
    "D":  {3:10, 4:40,5: 80},
    "G":  {3:15, 4:60,5:120},
    "H":  {3:20, 4:80,5:200},
    "W":  {3:20, 4:100,5:500}
}


const scatterSymbol = "S";
const scatterPays = {3: 2, 4: 5, 5: 10};
const scatterMultiplier = 2;


function getPayout(symbols, bet) {
    let payout = 0;
    let scatterCount = 0;
    for (let i = 0; i < symbols.length; i++) {
        if (symbols[i] === scatterSymbol) {
            scatterCount++;
        }
    }
}



function spinReels() {
    const rows = 3;
    const cols = reels.length;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  
    for (let col = 0; col < cols; col++) {
      const reel = reels[col];
      const len = reel.length;
      const stopIndex = randomInt(len); // top row index
  
      for (let row = 0; row < rows; row++) {
        const symbolIndex = (stopIndex + row) % len;
        grid[row][col] = reel[symbolIndex];
      }
    }
  
    return grid; // grid[row][col]
}





function evaluateLines(grid, betPerLine){
    let totalWin = 0;

    for (const line of paylines){
        const cols = grid[0].lenght;
        const symbols = [];
    
        for (let col = 0; col < cols; col++){
            const rowIndex = line[col];
            symbols.push(grid[rowIndex][col]);
        }
        

        let firstSymbol = symbolsOnLine[0];
        if (firstSymbol === scatterSymbol) continue;



        if (firstSymbol === "W"){
            
            firstSymbol = symbolOnLine.find(s => s !== "W") && s !== (scatterSymbol) || "W";

        }

        const payDef = paytable[firstSymbol];
        if(!payDef) continue;


        let count = 1;
        for (let i = 1; i < symbols.length; i++){
            const s = symbolsOnline[i];
            if (s === firstSymbol || s === "W") {
                count++;
            } else {
                break;
            }
        }

        const multiplier = payDef[count];
        if(multiplier) {
            totalWin += multiplier * betPerLine;
        }
    }

    return totalWin;

}





function evaluateScatters(grid, betTotal) {
    let scatterCount = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (grid[row][col] === scatterSymbol) scatterCount++;
      }
    }


    const mult = scatterPays[scatterCount] || 0;
    return betTotal * mult;
}




function spinONce(betPerLine){
    const linesCount = paylines.length;
    const totalBet = betPerLine * linesCount;

    const grid = spinReels();
    const lineWin = evaluateLines(grid, betPerLine);
    const scatterWin = evaluateScatters(grid, totalBet);

    const totalWin = lineWin + scatterWin;

    return {
        grid,
        lineWin,
        scatterWin,
        totalWin,
        totalWin,
        totalBet,
    };
}




async function simulateRTP(numSpins = 1000000){
    let totalBet = 0;
    let totalWin = 0;

    for(let i = 0; i < numSpins; i++){
        const result = spinOnce(betPerLine);
        totalBet += result.totalBet;
        totalWin += result.totalWin;
    }


    const rtp = totalWin / totalBet;
    return {rtp,totalBet, totalWin};



}























