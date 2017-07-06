(function() {
    var module = angular.module('tetris', []);

    module.controller('gameCtrl', ['$scope', 'gameSrvc', function($scope, gameSrvc) {
        $scope.gameSrvc = gameSrvc;
        $scope.gameSrvc.startGame();
        var el = document.getElementsByClassName('game-grid')[0];
        if (el) el.focus();
    }]);

    module.factory('brickSrvc', function() {
        var brickLib = [
            {
                brick: [[-1, -0], [0, 0], [1, 0], [2, 0]],
                pivotIdx: 1,
                startPos: [6, 0],
                rotatesTo: 1,
                primary: true
            },
            {
                brick: [[0, -1], [0, 0], [0, 1], [0, 2]],
                pivotIdx: 1,
                rotatesTo: 0,
            },
            {
                brick: [[0, 0], [1, 0], [0, 1], [1, 1]],
                pivotIdx: 0,
                startPos: [5, 0],
                rotatesTo: 2,
                primary: true
            },
            {
                brick: [[0, -1], [-1, 0], [0, 0], [1, 0]],
                pivotIdx: 2,
                startPos: [6, 1],
                rotatesTo: 4,
                primary: true
            },
            {
                brick: [[-1, -1], [-1, 0], [0, 0], [-1, 1]],
                pivotIdx: 2,
                rotatesTo: 5
            },
            {
                brick: [[-1, -1], [0, -1], [0, 0], [1, -1]],
                pivotIdx: 2,
                rotatesTo: 6
            },
            {
                brick: [[1, -1], [1, 0], [0, 0], [1, 1]],
                pivotIdx: 2,
                rotatesTo: 3
            },
            {
                brick: [[-1, -1], [-1, 0], [0, 0], [1, 0]],
                pivotIdx: 2,
                rotatesTo: 8,
                startPos: [6, 1],
                primary: true
            },
            {
                brick: [[1, -1], [0, -1], [0, 0], [0, 1]],
                pivotIdx: 2,
                rotatesTo: 9
            },
            {
                brick: [[-1, 0], [1, 0], [0, 0], [1, 1]],
                pivotIdx: 2,
                rotatesTo: 10
            },
            {
                brick: [[0, -1], [0, 1], [0, 0], [-1, 1]],
                pivotIdx: 2,
                rotatesTo: 7
            },
            {
                brick: [[1, -1], [-1, 0], [0, 0], [1, 0]],
                pivotIdx: 2,
                rotatesTo: 12,
                startPos: [6, 1],
                primary: true
            },
            {
                brick: [[1, 1], [0, -1], [0, 0], [0, 1]],
                pivotIdx: 2,
                rotatesTo: 13
            },
            {
                brick: [[-1, 0], [1, 0], [0, 0], [-1, 1]],
                pivotIdx: 2,
                rotatesTo: 14
            },
            {
                brick: [[0, -1], [0, 1], [0, 0], [-1, -1]],
                pivotIdx: 2,
                rotatesTo: 11
            },
            {
                brick: [[-1, -1], [0, -1], [0, 0], [1, 0]],
                pivotIdx: 2,
                rotatesTo: 16,
                startPos: [6, 1],
                primary: true
            },
            {
                brick: [[1, -1], [1, 0], [0, 0], [0, 1]],
                pivotIdx: 2,
                rotatesTo: 15,
            },
            {
                brick: [[1, -1], [0, -1], [0, 0], [-1, 0]],
                pivotIdx: 2,
                rotatesTo: 18,
                startPos: [6, 1],
                primary: true
            },
            {
                brick: [[-1, -1], [-1, 0], [0, 0], [0, 1]],
                pivotIdx: 2,
                rotatesTo: 17,
            }
        ];

        return {
            getBrick: function(brickIdx) {
                return brickLib[brickIdx];
            },
            getNextBrick: function() {
                var numBricks = brickLib.length;
                do {
                    var brickIdx = Math.floor(Math.random() * numBricks);
                    primaryBrick = brickLib[brickIdx].primary;
                } while(!primaryBrick)
                
                var newBrick = [];
                var pivot = brickLib[brickIdx].startPos.slice();
                var pivotIdx = brickLib[brickIdx].pivotIdx;
                var brick = brickLib[brickIdx].brick;
                for (var i = 0; i < brick.length; i++) {
                    if (i === pivotIdx) {
                        newBrick.push(pivot);
                        continue;
                    }
                    var cell = brick[i].slice();
                    cell[0] = pivot[0] + cell[0];
                    cell[1] = pivot[1] + cell[1];
                    newBrick.push(cell);
                }
                return {
                    brick: newBrick,
                    brickIdx: brickIdx
                };
            }
        }
    });

    module.factory('gameSrvc', function($timeout, $interval, brickSrvc) {
        var gameGrid = null;
        var movingBrick = null;
        var movingBrickIdx = -1;
        var movingBrickLanded = false;
        var gameScore = 0;
        var gameOver = false;

        var canBrickMove = function(dir, rotatedBrickObj) {
            var selfBrick = {};
            for (var i = 0; i < movingBrick.length; i++) {
                var x = movingBrick[i][0];
                var y = movingBrick[i][1];
                selfBrick[x + ' ' + y] = true;
            }
            for (var i = 0; i < movingBrick.length; i++) {
                var x = movingBrick[i][0];
                var y = movingBrick[i][1];
                if (dir == 'rotate') {
                    x = rotatedBrickObj.brick[i][0];
                    y = rotatedBrickObj.brick[i][1];
                }
                if (dir == 'down') {
                    if (!gameGrid[y+1]) {
                        return false;
                    }
                    if (gameGrid[y+1][x]) {
                        if (!selfBrick[(x) + ' ' + (y+1)]) {
                            return false;
                        }
                    }
                } else if (dir == 'left') {
                    if (x - 1 < 0) {
                        return false;
                    }
                    if (gameGrid[y][x-1]) {
                        if (!selfBrick[(x-1) + ' ' + (y)]) {
                            return false;
                        }
                    }
                } else if (dir == 'right') {
                    if (x + 1 >= gameGrid[0].length) {
                        return false;
                    }
                    if (gameGrid[y][x+1]) {
                        if (!selfBrick[(x+1) + ' ' + (y)]) {
                            return false;
                        }
                    }
                } else if (dir == 'rotate') {
                    if (x < 0 || x >= gameGrid[0].length) {
                        return false;
                    }
                    if (y < 0 || y >= gameGrid.length) {
                        return false;
                    }
                    if (gameGrid[y][x]) {
                        if (!selfBrick[(x) + ' ' + (y)]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        var rotateBrick = function() {
            var currentBrick = brickSrvc.getBrick(movingBrickIdx);
            var pivotIdx = currentBrick.pivotIdx;
            var nextBrickIdx = currentBrick.rotatesTo;
            var nextBrick = brickSrvc.getBrick(nextBrickIdx);
            var pivotCell = movingBrick[pivotIdx].slice();
            var rotatedBrick = [];
            for (var i = 0; i < nextBrick.brick.length; i++) {
                if (i === pivotIdx) {
                    rotatedBrick.push(pivotCell);
                    continue;
                }
                var cell = nextBrick.brick[i].slice();
                cell[0] = pivotCell[0] + cell[0];
                cell[1] = pivotCell[1] + cell[1];
                rotatedBrick.push(cell);
            }
            return {
                brick: rotatedBrick,
                roatedBrickLibIdx: nextBrickIdx 
            }
        }

        var moveBrick = function(dir) {
            if (dir == 'rotate') {
                var rotatedBrickObj = rotateBrick();
            }
            var brickCanMove = canBrickMove(dir, rotatedBrickObj);
            if (!brickCanMove && dir == 'down') {
                movingBrickLanded = true;
            }
            if (!brickCanMove) {
                return;
            }
            for (var i = 0; i < movingBrick.length; i++) {
                var x = movingBrick[i][0];
                var y = movingBrick[i][1];
                gameGrid[y][x] = false;
            }
            for (var i = 0; i < movingBrick.length; i++) {
                if (dir == 'down') {
                    movingBrick[i][1]++;
                } else if (dir == 'left') {
                    movingBrick[i][0]--;
                } else if (dir == 'right') {
                    movingBrick[i][0]++;
                } else if (dir == 'rotate') {
                    movingBrick = rotatedBrickObj.brick;
                    movingBrickIdx = rotatedBrickObj.roatedBrickLibIdx;
                    break;
                }
            }
            for (var i = 0; i < movingBrick.length; i++) {
                var x = movingBrick[i][0];
                var y = movingBrick[i][1];
                gameGrid[y][x] = 'red';
            }
        }

    
        /* 
            Is there space for a brick on the top of the screen before it even starts moving down?
            (If bricks are piled high to the top of the grid, there might not even be place for a new brick, in which case the game is over).
        */
        var isBrickInitialPosFree = function() {
            for (var i = 0; i < movingBrick.length; i++) {
                var cell = movingBrick[i];
                var x = cell[0];
                var y = cell[1];
                if (gameGrid[y][x]) {
                    return false;
                }
            }
            return true;
        }

        var checkIfRowCleared = function() {
            var rowsToCheck = {};
            for (var i = 0; i < movingBrick.length; i++) {
                rowsToCheck[movingBrick[i][1]] = true;
            }
            var rowsToCheckArr = [];
            for (var row in rowsToCheck) {
                rowsToCheckArr.push(parseInt(row));
            }
            rowsToCheckArr = rowsToCheckArr.sort(function(a, b) {
                if (a > b) {
                    return true;
                }
                return false;
            });
            for (var i = 0; i < rowsToCheckArr.length; i++) {
                var row = rowsToCheckArr[i];
                var rowsCleared = true;
                for (var j = 0; j < gameGrid[row].length; j++) {
                    if (!gameGrid[row][j]) {
                        rowsCleared = false;
                        break;
                    }
                }
                if (rowsCleared) {
                    gameGrid.splice(row, 1); // delete cleared row
                    var newRow = [];
                    for (var r = 0; r < 13; r++) {
                        newRow.push(false);
                    }
                    gameGrid.unshift(newRow); // add a new row to the top
                    gameScore += 100;
                }
            }
        }

        var listenToKeyInputs = function(e) {
            if (movingBrickLanded || gameOver) {
                return;
            }
            var keyCode = e.keyCode;
            var arrowCodes = {37: true, 38: true, 39: true, 40: true};
            if (arrowCodes[keyCode]) {
                e.preventDefault()
            } else {
                return;
            }

            if (keyCode == 37) {
                $timeout(function() {
                    // safety check - unlikely to be necessary
                    if (movingBrickLanded || gameOver) {
                        return;
                    }
                    moveBrick('left');
                }, 0);              
            } else if (keyCode == 40) {
                $timeout(function() {
                    if (movingBrickLanded || gameOver) {
                        return;
                    }
                    moveBrick('down');
                }, 0);
            } else if (keyCode == 39) {
                $timeout(function() {
                    if (movingBrickLanded || gameOver) {
                        return;
                    }
                    moveBrick('right');
                }, 0);
            } else if (keyCode == 38) {
                $timeout(function() {
                    if (movingBrickLanded || gameOver) {
                        return;
                    }
                    moveBrick('rotate');
                }, 0);
            }
        }

        return {
            startGame: function () {
                this.resetGame();
                this.startGameEngine();
            },
            resetGame: function() {
                gameGrid = [];
                for (var i = 0; i < 20; i++) {
                    var row = [];
                    for (var j = 0; j < 13; j++) {
                        row.push(false);
                    }
                    gameGrid.push(row);
                }
                var brickObj = brickSrvc.getNextBrick();
                movingBrick = brickObj.brick;
                movingBrickIdx = brickObj.brickIdx;
                for (var i = 0; i < movingBrick.length; i++) {
                    var x = movingBrick[i][0];
                    var y = movingBrick[i][1];
                    gameGrid[y][x] = 'red';
                }
                movingBrickLanded = false;
                gameOver = false;
            },
            startGameEngine: function() {
                var gameLoop = $interval(function() {
                    // console.log('game loop tick');
                    if (!movingBrickLanded) {
                        moveBrick('down');
                    } else {
                        checkIfRowCleared();

                        var brickObj = brickSrvc.getNextBrick();
                        movingBrick = brickObj.brick;
                        movingBrickIdx = brickObj.brickIdx;
                        if (isBrickInitialPosFree()) {
                            for (var i = 0; i < movingBrick.length; i++) {
                                var x = movingBrick[i][0];
                                var y = movingBrick[i][1];
                                gameGrid[y][x] = 'red';
                            }
                            movingBrickLanded = false;
                        } else {
                            gameOver = true;
                            document.removeEventListener('keydown', listenToKeyInputs);
                            $interval.cancel(gameLoop);
                            for (var i = 0; i < movingBrick.length; i++) {
                                var x = movingBrick[i][0];
                                var y = movingBrick[i][1];
                                gameGrid[y][x] = 'yellow';
                            }
                            alert('Game Over... Thanks for playing!');
                        }
                    }
                }, 300);
                document.addEventListener('keydown', listenToKeyInputs);    
            },
            getGameGrid: function() {
                return gameGrid;
            },
            getGridCellColor: function(row, col) {
                if (gameGrid[row][col]) {
                    return gameGrid[row][col];
                }
                return 'white';
            },
            getGameScore: function() {
                return gameScore;
            }
        }
    })
})(angular);
