var State = function(old) {
    this.turn = "";
    this.oMovesCount = 0;
    this.result = "still running";
    this.board = [];
    if(typeof old !== "undefined") {
        var len = old.board.length;
        this.board = new Array(len);
        for(var i = 0 ; i < len ; i++) {
            this.board[i] = old.board[i];
        }
        this.oMovesCount = old.oMovesCount;
        this.result = old.result;
        this.turn = old.turn;
    }
    this.advanceTurn = function() {
        this.turn = this.turn === "X" ? "O" : "X";
    }
    this.emptyCells = function() {
        var indxs = [];
        for(var i = 0 ; i < 9 ; i++) {
            if(this.board[i] === "E") {
                indxs.push(i);
            }
        }
        return indxs;
    }
    this.isTerminal = function() {
        var B = this.board;
        for(var i = 0; i <= 6; i = i + 3) {
            if(B[i] !== "E" && B[i] === B[i + 1] && B[i + 1] == B[i + 2]) {
                this.result = B[i] + "-won";
                return true;
            }
        }
        for(var i = 0; i <= 2 ; i++) {
            if(B[i] !== "E" && B[i] === B[i + 3] && B[i + 3] === B[i + 6]) {
                this.result = B[i] + "-won";
                return true;
            }
        }
        for(var i = 0, j = 4; i <= 2 ; i = i + 2, j = j - 2) {
            if(B[i] !== "E" && B[i] == B[i + j] && B[i + j] === B[i + 2*j]) {
                this.result = B[i] + "-won";
                return true;
            }
        }
        var available = this.emptyCells();
        if(available.length == 0) {
            this.result = "draw";
            return true;
        }
        else {
            return false;
        }
    };
};
var Game = function(autoPlayer) {
    this.ai = autoPlayer;
    this.currentState = new State();
    this.currentState.board = ["E","E","E","E","E","E","E","E","E"];
    this.currentState.turn = "X";
    this.status = "beginning";
    this.advanceTo = function(_state) {
        this.currentState = _state;
        if(_state.isTerminal()) {
            this.status = "ended";
            if(_state.result === "X-won")
                ui.switchViewTo("won");
            else if(_state.result === "O-won")
                ui.switchViewTo("lost");
            else
                ui.switchViewTo("draw");
        }
        else {
            if(this.currentState.turn === "X") {
                ui.switchViewTo("human");
            }
            else {
                ui.switchViewTo("robot");
                this.ai.notify("O");
            }
        }
    };
    this.start = function() {
        if(this.status = "beginning") {
            this.advanceTo(this.currentState);
            this.status = "running";
        }
    }
};
Game.score = function(_state) {
    if(_state.result === "X-won"){
        return 10 - _state.oMovesCount;
    }
    else if(_state.result === "O-won") {
        return - 10 + _state.oMovesCount;
    }
    else {
        return 0;
    }
}
var AIAction = function(pos) {
    this.movePosition = pos;
    this.minimaxVal = 0;
    this.applyTo = function(state) {
        var next = new State(state);
        next.board[this.movePosition] = state.turn;
        if(state.turn === "O")
            next.oMovesCount++;
        next.advanceTurn();
        return next;
    }
};
AIAction.ASCENDING = function(firstAction, secondAction) {
    if(firstAction.minimaxVal < secondAction.minimaxVal)
        return -1;
    else if(firstAction.minimaxVal > secondAction.minimaxVal)
        return 1;
    else
        return 0;
}
AIAction.DESCENDING = function(firstAction, secondAction) {
    if(firstAction.minimaxVal > secondAction.minimaxVal)
        return -1;
    else if(firstAction.minimaxVal < secondAction.minimaxVal)
        return 1;
    else
        return 0;
}
var AI = function() {
    var game = {};
    function minimaxValue(state) {
        if(state.isTerminal()) {
            return Game.score(state);
        }
        else {
            var stateScore;
            if(state.turn === "X")
                stateScore = -1000;
            else
                stateScore = 1000;
            var availablePositions = state.emptyCells();
            var availableNextStates = availablePositions.map(function(pos) {
                var action = new AIAction(pos);
                var nextState = action.applyTo(state);
                return nextState;
            });
            availableNextStates.forEach(function(nextState) {
                var nextScore = minimaxValue(nextState);
                if(state.turn === "X") {
                    if(nextScore > stateScore)
                        stateScore = nextScore;
                }
                else {
                    if(nextScore < stateScore)
                        stateScore = nextScore;
                }
            });
            return stateScore;
        }
    }
    function move(turn) {
        var available = game.currentState.emptyCells();
        var availableActions = available.map(function(pos) {
            var action =  new AIAction(pos);
            var next = action.applyTo(game.currentState);
            action.minimaxVal = minimaxValue(next);
            return action;
        });
        if(turn === "X")
            availableActions.sort(AIAction.DESCENDING);
        else
            availableActions.sort(AIAction.ASCENDING);
        var chosenAction = availableActions[0];
        var next = chosenAction.applyTo(game.currentState);
        ui.insertAt(chosenAction.movePosition, turn);
        game.advanceTo(next);
    }
    this.plays = function(_game){
        game = _game;
    };
    this.notify = function(turn) {
        move(turn);
    };
};
var ui = {};
ui.intialControlsVisible = true;
ui.currentView = "";
ui.switchViewTo = function(turn) {
    function _switch(_turn) {
        ui.currentView = "#" + _turn;
        $(ui.currentView).fadeIn("fast");
        if(_turn === "ai")
            ui.startRobotFlickering();
    }
    if(ui.intialControlsVisible) {
        ui.intialControlsVisible = false;
        $('.intial').fadeOut({
            duration : "slow",
            done : function() {
                _switch(turn);
            }
        });
    }
    else {
        $(ui.currentView).fadeOut({
            duration: "fast",
            done: function() {
                _switch(turn);
            }
        });
    }
};
ui.insertAt = function(indx, symbol) {
    var board = $('.cell');
    var targetCell = $(board[indx]);
    if(!targetCell.hasClass('occupied')) {
        targetCell.html(symbol);
        targetCell.css({
            color : symbol == "X" ? "lightblue" : "pink"
        });
        targetCell.addClass('occupied');
    }
}
var globals = {};
$(".start").click(function() {
    var aiPlayer = new AI();
    globals.game = new Game(aiPlayer);
    aiPlayer.plays(globals.game);
    globals.game.start();

});
$(".cell").each(function() {
    var $this = $(this);
    $this.click(function() {
        if(globals.game.status === "running" && globals.game.currentState.turn === "X" && !$this.hasClass('occupied')) {
            var indx = parseInt($this.data("indx"));
            var next = new State(globals.game.currentState);
            next.board[indx] = "X";
            ui.insertAt(indx, "X");
            next.advanceTurn();
            globals.game.advanceTo(next);

        }
    })
});
