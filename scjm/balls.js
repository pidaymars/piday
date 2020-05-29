const left_heavier = 1;
const right_heavier = -1;
const same_weight = 0;
const illegal_move = 2;

const left = 0;
const right = 1;

const ball_height = 100;
const ball_width = 100;
const ball_packed_height = 86.6;

const plates_y_down = 150;
const plates_y_up = 50;
const plates_delta = 50;

const max_moves = 3;

function all_possibilities() {
    var possibilities = new Set();

    for(var i = 1; i <= 12; i++) {
        possibilities.add({number: i, heavier: false});
        possibilities.add({number: i, heavier: true});
    }

    return possibilities;
}

function new_game() {
    return {
        possibilities: all_possibilities(),
        remaining_moves: max_moves
    };
}

function print_possibilities(possibilities) {
    possibilities.forEach(function(oddball) {
        console.log(oddball.number + " " + oddball.heavier);
    });
}

function get_outcome(oddball, plates) {

    if (plates.left.size < plates.right.size) {
        return right_heavier;
    } else if (plates.left.size > plates.right.size) {
        return left_heavier;
    }

    try {
        plates.left.forEach(function (ball_number) {
            if (ball_number == oddball.number) {
                if (oddball.heavier) {
                    throw left_heavier;
                } else {
                    throw right_heavier;
                }
            }
        });
        
        plates.right.forEach(function (ball_number) {
            if (ball_number == oddball.number) {
                if (oddball.heavier) {
                    throw right_heavier;
                } else {
                    throw left_heavier;
                }
            }
        });
    } catch (outcome) {
        return outcome;
    }

    return same_weight;
}

function observe(possibilities, plates, outcome) {
    var filtered_possibilities = new Set(possibilities);

    possibilities.forEach(function(oddball) {
        if (get_outcome(oddball, plates) != outcome) {
            filtered_possibilities.delete(oddball);
        }
    });

    return filtered_possibilities;                        
}

function choose_outcome(possibilities, plates) {
    var outcomes = [left_heavier, right_heavier, same_weight];
    outcomes = outcomes.filter(function(outcome) {
        var score = observe(possibilities, plates, outcome).size;
        return (score >= possibilities.size/4);
    });
    return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function play(game, plates) {
    if (game.remaining_moves <= 0) {
        return illegal_move;
    }
    game.remaining_moves--;
    
    var outcome = choose_outcome(game.possibilities, plates);
    game.possibilities = observe(game.possibilities, plates, outcome);
    return outcome;
}

/* ==== Abstract interface === */

/* Plate: 
      5
     3 4
    0 1 2
*/

function new_interface() {
    var my_interface = {
        left_plate: [0,0,0,0,0,0],
        right_plate: [0,0,0,0,0,0],
        store: [1,2,3,4,5,6,7,8,9,10,11,12],
        measuring: false,
        answering: false,
        answer_slot: 0,
        over: false
    };
    return my_interface;
}

function percolate_atom(plate, source, destination) {
    if (plate[source] > 0 && plate[destination] == 0) {
        plate[destination] = plate[source];
        plate[source] = 0;
        return true;
    } else {
        return false;
    }
}

function percolate(plate) {
    var changed = true;
    while (changed) {
        changed = false;
        changed = percolate_atom(plate, 3, 1) || changed;
        changed = percolate_atom(plate, 3, 0) || changed;
        changed = percolate_atom(plate, 4, 1) || changed;
        changed = percolate_atom(plate, 4, 2) || changed;
        changed = percolate_atom(plate, 5, 3) || changed;
        changed = percolate_atom(plate, 5, 4) || changed;
    }
}

function plate_can_add(plate) {
    return (plate[5] == 0);
}
function plate_add(plate, number) {
    if (plate_can_add(plate)) {
        plate[5] = number;
        percolate(plate);
        return true;
    } else {
        return false;
    }
}
function plate_can_delete(plate, number) {
    return plate.some(n => n == number);
}
function plate_delete(plate, number) {
    for (var i = 0; plate.length; i++) {
        if (plate[i] == number) {
            plate[i] = 0;
            percolate(plate);
            return true;
        }
    }
    return false;
}

function store_add(store, number) {
    store.push(number);
}
function store_can_delete(store, number) {
    return store.some(n => n == number);
}
function store_delete(store, number) {
    for (var i = 0; store.length; i++) {
        if (store[i] == number) {
            store.splice(i, 1);
            return true;
        }
    }
    return false;
}

function remove_ball(my_interface, number) {
    if (store_can_delete(my_interface.store, number)) {
        return store_delete(my_interface.store, number);
    } else if (plate_can_delete(my_interface.left_plate, number)) {
        return plate_delete(my_interface.left_plate, number);
    } else if (plate_can_delete(my_interface.right_plate, number)) {
        return plate_delete(my_interface.right_plate, number);
    } else if (my_interface.answer_slot == number) {
        my_interface.answer_slot = 0;
        return true;
    } else {
        return false;
    }
}

function move_to_plate(my_interface, plate_id, number) {
    var plate;
 
    if (plate_id == left) {
        plate = my_interface.left_plate;
    } else {
        plate = my_interface.right_plate;
    }
    if (!plate_can_add(plate)) {
        return false;
    }

    if (store_can_delete(my_interface.store, number)) {
        store_delete(my_interface.store, number);
    } else if (plate_id != left
               && plate_can_delete(my_interface.left_plate, number)) {
        plate_delete(my_interface.left_plate, number);
    } else if (plate_id != right
               && plate_can_delete(my_interface.right_plate, number)) {
        plate_delete(my_interface.right_plate, number);
    } else {
        return false;
    }

    plate_add(plate, number);
    return true;
}

function move_to_store(my_interface, number) {
    var plate;

    if (plate_can_delete(my_interface.left_plate, number)) {
        plate = my_interface.left_plate;
    } else if (plate_can_delete(my_interface.right_plate, number)) {
        plate = my_interface.right_plate;
    } else {
        return false;
    }
    
    plate_delete(plate, number);
    store_add(my_interface.store, number);
}

function register_play(state, plates, outcome) {
    var n = 0;
    plates.left.forEach(function (number) {
        if (number > 0) { n += Math.pow(3, number-1); }
    });
    plates.right.forEach(function (number) {
        if (number > 0) { n += 2*Math.pow(3, number-1); }
    });
    if (outcome == left_heavier) {
        n += Math.pow(3, 12);
    } else if (outcome == right_heavier) {
        n += Math.pow(3, 12);
    }
    var text = n.toString(36);
    while (text.length < 4) { text = "0" + text; }
    state.trace += text;
}
function register_answer(state, number, heavier) {
    var n = number - 1 + (heavier ? 12 : 0);
    var text = n.toString(36);
    state.trace += text;
}



/* ==== GUI ==== */

function reset_state(state) {
    state.game = new_game();
    state.interf = new_interface();
    state.trace = "";

    place_balls(state);
    
    return state;    
}

function new_state() {
    var state = {
        game: null,
        interf: null,
        balls: create_balls(),
        trace: null
    };

    for (var i = 1; i <= 12; i++) {
        let j = i;
        state.balls[i-1].addEventListener("click", function (event) {
            ball_click(state, state.balls[j-1], j);
        }, {once: false});
    }

    var measure_click = function (event) {
        if (state.interf.over) {
            document.getElementById("result-block").innerText = "";
            reset_state(state);
            place_balls(state);
            place_plates_down();
            place_remaining_moves(state)
            console.log(state);
            return;
        }
        
        if (state.game.remaining_moves > 0) {
            if (state.interf.measuring) {
                place_plates_down();
                state.interf.measuring = false;
            } else {
                var plates = {left: new Set(state.interf.left_plate.filter(number => number > 0)),
                              right: new Set(state.interf.right_plate.filter(number => number > 0))};
                var outcome = play(state.game, plates);
                register_play(state, plates, outcome);
                if (outcome != illegal_move) {
                    place_plates_up(outcome);
                    state.interf.measuring = true;
                    place_remaining_moves(state);
                }
            }
        } else if (!state.interf.answering) {
            place_plates_down();
            state.interf.measuring = false;
            state.interf.answering = true;
        } else if (state.interf.answer_slot > 0) {
            var answer_number = state.interf.answer_slot;
            var answer_heavier = (document.getElementById("answer-select").value == "heavier");

            var possibilities = state.game.possibilities;
            var filtered_possibilities = new Set(possibilities);
            possibilities.forEach(function(oddball) {
                if (oddball.number == answer_number && oddball.heavier == answer_heavier) {
                    filtered_possibilities.delete(oddball);
                }
            });

            register_answer(state, answer_number, answer_heavier);
            
            var text;
            if (filtered_possibilities.size == 0) {
                text = "Réponse correcte! Clé: " + state.trace;
            } else {
                var oddball_index = Math.floor(Math.random() * filtered_possibilities.size);
                var iter = filtered_possibilities.values();
                var oddball;
                for (var i = 0; i < oddball_index; i++) {
                    oddball = iter.next().value;
                }
                text = "Réponse incorrecte: ";
                if (answer_number == oddball.number) {
                    text += "la boule " + oddball.number + " est plus " + (oddball.heavier ? "lourde" : "légère");
                } else {
                    text += "c'est la boule " + oddball.number + " qui est plus " +
                        (oddball.heavier ? "lourde" : "légère");
                }
            }
            document.getElementById("result-block").innerText = text;
            
            state.interf.over = true;
        }
        
        place_balls(state);
        
    }
    //document.getElementById("moves").addEventListener("click", measure_click);
    document.getElementById("measure-button").addEventListener("click", measure_click);

    reset_state(state);
    return state;
 }

function place_remaining_moves(state) {
    html = '<span style="color: #C0C0C0">';
    for (var i=0; i<max_moves-state.game.remaining_moves; i++) {
        html += "&#9878;"
        if (i < max_moves-1) { html += "&nbsp"; }
    }
    html += '</span>';
    for (var i=max_moves-state.game.remaining_moves; i<max_moves; i++) {
        html += "&#9878;"
        if (i < max_moves-1) { html += "&nbsp;"; }
    }
    document.getElementById("moves").innerHTML = html;
}

function place_plates_down() {
    document.getElementById("left_plate").style.top = plates_y_down;
    document.getElementById("right_plate").style.top = plates_y_down;
}

function place_plates_up(outcome) {
   switch (outcome) {
   case left_heavier:
       document.getElementById("left_plate").style.top = plates_y_up+plates_delta;
       document.getElementById("right_plate").style.top = plates_y_up-plates_delta;
       break;
   case right_heavier:
       document.getElementById("left_plate").style.top = plates_y_up-plates_delta;
       document.getElementById("right_plate").style.top = plates_y_up+plates_delta;
       break;
   case same_weight:
       document.getElementById("left_plate").style.top = plates_y_up;
       document.getElementById("right_plate").style.top = plates_y_up;
       break;
    }
}


function ball_color(ball_number) {
    switch(ball_number) {
    case 1:
    case 9: return "#D0D000"; // Yellow
    case 2:
    case 10: return "#0020A0"; // Blue
    case 3:
    case 11: return "#C00020"; // Red
    case 4:
    case 12: return "#A00060"; // Purple
    case 5:
    case 13: return "#E07000"; // Orange
    case 6:
    case 14: return "#00A020"; // Green
    case 7:
    case 15: return "#803000"; // Maroon
    case 8: return "#000000"; // Black
    }
 }

function create_balls() {
    var balls = [];
    for (var i = 1; i <= 12; i++) {
        var ball = document.createElement("div");
        ball.classList.add("ball");
        var span = document.createElement("span");
        span.innerText = i;
        ball.appendChild(span);
        ball.style['border-color'] = ball_color(i);        
        balls.push(ball);
    }
    return balls;
}

function ball_click(state, element, number) {
    console.log(state);
    
    if (state.interf.over) { return; }
    
    if (state.game.remaining_moves > 0) {
        if (state.interf.measuring) { return; }
        
        if (state.interf.store.some(n => n == number)) {
            if (!move_to_plate(state.interf, left, number)) {
                move_to_plate(state.interf, right, number);
            }
        } else if (state.interf.left_plate.some(n => n == number)) {
            if (!move_to_plate(state.interf, right, number)) {
                move_to_store(state.interf, number);
            }
        } else if (state.interf.right_plate.some(n => n == number)) {
            move_to_store(state.interf, number);
        }
    } else {
        var old_answer = state.interf.answer_slot;
        if (old_answer > 0) {
            remove_ball(state.interf, old_answer);
            store_add(state.interf.store, old_answer)
        }
        if (old_answer != number) {
            remove_ball(state.interf, number);
            state.interf.answer_slot = number;
        }            
    }
    
    place_balls(state);
}

function coordinates_in_plate(position) {
    switch(position) {
    case 0: return {top: 2*ball_packed_height, left: 0};
    case 1: return {top: 2*ball_packed_height, left: ball_width};
    case 2: return {top: 2*ball_packed_height, left: 2*ball_width};
    case 3: return {top: ball_packed_height, left: 0.5*ball_width};
    case 4: return {top: ball_packed_height, left: 1.5*ball_width};
    case 5: return {top: 0, left: ball_width};
    }
}

function place_balls(state) {
    var next_x = 0;
    var next_y = 0;
    var ball;

    for (var i = 0; i < state.interf.store.length; i++) {
        ball = state.balls[state.interf.store[i]-1];
        document.getElementById("store").appendChild(ball);
        ball.style.position = "absolute";
        ball.style.top = next_y;
        ball.style.left = next_x;
        next_x += ball_width;
        if (i % 6 == 5) {
            next_x = 0;
            next_y += ball_height;
        }        
    }
    [ {balls: state.interf.left_plate,
       element: document.getElementById("left_plate")},
      {balls: state.interf.right_plate,
       element: document.getElementById("right_plate")} ].forEach(
           function (plate) {
               for (i=0; i<6; i++) {
                   if (plate.balls[i] != 0) {
                       ball = state.balls[plate.balls[i]-1];
                       coordinates = coordinates_in_plate(i);
                       plate.element.appendChild(ball);
                       ball.style.position = "absolute";
                       ball.style.top = coordinates.top;
                       ball.style.left = coordinates.left
                   }
               }
           });

    if (state.game.remaining_moves > 0) {
        document.getElementById("answer-block").style.visibility = "hidden";
        if (state.interf.measuring) {
            document.getElementById("measure-button").innerHTML = "Stop&nbsp;mesure";
        } else {
            document.getElementById("measure-button").innerHTML = "Mesurer";
        }
    } else if (!state.interf.answering) {
        document.getElementById("measure-button").innerHTML = "Proposer&nbsp;réponse";
    } else if (!state.interf.over) {
        document.getElementById("measure-button").innerHTML = "Valider&nbsp;réponse";
        document.getElementById("answer-block").style.visibility = "visible";
        if (state.interf.answer_slot > 0) {
            ball = state.balls[state.interf.answer_slot-1];
            ball.style.position = null;
            ball.style.top = null;
            ball.style.bottom = null;
            document.getElementById("answer-slot").appendChild(ball);
            document.getElementById("cue-ball").style.display = "none";
        } else {
            document.getElementById("cue-ball").style.display = null;;
        }
    } else {
        document.getElementById("measure-button").innerText = "Rejouer";
    }
}

state = new_state();

// Handle window resize

function window_resize() {
    var scale = Math.min(window.innerHeight/(693+20), 1);
    
    document.getElementById("board").style.transform = "scale(" + scale + ")";
    document.getElementById("board").style['transform-origin'] = "top left";
    document.getElementById("board").style.width = 900*scale;
    document.getElementById("board").style.height = 693*scale;

    document.getElementById("answer-slot").style.transform = "scale(" + scale + ")";
    document.getElementById("answer-slot").style['transform-origin'] = "top left";
    document.getElementById("answer-slot").style.width = 100*scale;
    document.getElementById("answer-slot").style.height = 100*scale;

}

window.addEventListener("resize", window_resize);
window_resize();
