function Conversation() {
    "use strict";

    var $this = this,
        stepNum = 0,
        steps = [],
        setup,
        finish;

    this.bot = null;
    this.data = {};

    /*
     * Initiates conversation, calls setup if its exists, then asks the first question
     */
    this.start = function (bot, initialMessage) {
        $this.bot = bot;
        bot.startConversation(initialMessage, function (err, convo) {
            if (err) {
                $this.handleError("An error occurred when starting the conversation", convo);
            } else if (setup) {
                setup(initialMessage, $this.data)
                    .then(function () {
                        $this.nextQuestion(initialMessage, convo);
                    }, function () {
                        convo.say("An error occurred when setting up");
                        convo.next();
                    });
            } else {
                $this.nextQuestion(initialMessage, convo);
            }
        });
    };

    /*
     * Generic Error Handler
     */
    this.handleError = function (errorMessage, convo) {
        $this.convo = convo;
        $this.convo.say("Error: " + errorMessage);
        $this.convo.next();
        console.trace(errorMessage);
    };

    /*
     * Add a step object with question and response.
     */
    this.addStep = function (question, response, precondition) {
        if (question && response) {
            steps.push({
                question: question,
                response: response,
                precondition : precondition
            });
        }
        return $this;
    };

    /*
     * Call the next question if it exists otherwise calls the
     * finish function if it exists
     */
    this.nextQuestion = function (message, convo) {
        if (stepNum < steps.length) {
            var step = steps[stepNum];
            if (step.precondition !== undefined && step.precondition($this.data) === false) {
                $this.nextQuestion(message, convo);
            } else {
                convo.ask(step.question($this.data), step.response($this));
                convo.next();
            }
            stepNum = stepNum + 1;
        } else {
            if (finish) {
                finish($this.data)
                    .then(function (message) {
                        convo.say(message);
                        convo.next();
                    }, function (errMessage) {
                        $this.handleError(errMessage, convo);
                    });
            } else {
                convo.next();
            }
        }
    };

    /*
     * Generic Repeat
     */
    this.repeat = function (message, convo) {
        var step = steps[stepNum];
        convo.ask(step.question, step.response($this));
        convo.next();
    };

    /*
     * Silent Repeat
     */
    this.silentRepeat = function (message, convo) {
        var step = steps[stepNum];
        convo.ask("", step.response($this));
        convo.next();
    };

    /*
     * Generic end
     */
    this.end = function (message, convo) {
        convo.say("Exited");
        convo.next();
    };

    /*
     * This should be a function that returns a Deferred
     * Setup is given $this and is used to setup the data object and
     * explain stuff to the user :)
     */
    this.setSetup = function (s) {
        if (s) {
            setup = s;
        }
        return $this;
    };

    /*
     * When all steps are done it will call finish with the data object
     * @param data
     */
    this.setFinish = function (f) {
        if (f) {
            finish = f;
        }
        return $this;
    };

}

module.exports = Conversation;