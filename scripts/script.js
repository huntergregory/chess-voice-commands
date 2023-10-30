// NOTES
// All text is lowercase except for the major/minor pieces and the word "Castle".
// The board square class may differ depending on the chess.com page. Two of them are identified here:
// 1. square-45
// 2. square-0405

// global constants
const voiceControlID = 'voice-control';
const instructionsID = 'instructions';
const checkboxesID = 'checkboxes';
const mustSayPawnID = 'must-say-pawn';
const showInstructionsID = 'show-instructions';

const longestText = 'castle queen side';
const transcriptSize = longestText.length + 5;
const defaultSuggestionText = '(feedback/suggestions appear here)';
const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const majorMinorPieces = ['King', 'Queen', 'Rook', 'Bishop', 'Knight'];
const piecesToHtmlClass = new Map(Object.entries({
    'King': 'k',
    'Queen': 'q',
    'Rook': 'r',
    'Bishop': 'b',
    'Knight': 'n',
    '': 'p'
}))
const castleKingSide = 'Castle King-side';
const castleQueenSide = 'Castle Queen-side';
// map chess.com square strings to x-y integer pairs
const coordinateMap = new Map();
// see note at top about board square class
ranks.forEach(i => ranks.forEach(j => {
    i = parseInt(i, 10);
    j = parseInt(j, 10);
    coordinateMap.set(i.toString() + j.toString(), [i, j]);
    coordinateMap.set('0' + i.toString() + '0' + j.toString(), [i, j]);
}));
const fileToCoordinate = new Map();
const coordinateToFile = new Map();
for (let i = 0; i < files.length; i++) {
    fileToCoordinate.set(files[i], i+1);
    coordinateToFile.set(i+1, files[i]);
}
// translations for potential improper speech recognition
const translationsMultiWord = new Map(Object.entries({
    'put on': 'pawn'
}));
const translationsSingleWord = new Map(Object.entries({
    'be': 'b',
    'pawnee': 'pawn e',
    'pony': 'pawn e',
    'pong': 'pawn',
    'palm': 'pawn',
    'on': 'pawn',
    'pain': 'pawn',
    'pond': 'pawn',
    'pawnee': 'pawn e',
    'night': 'knight',
    'light': 'knight',
    'lights': 'knight',
    'nights': 'knight',
    'knights': 'knight',
    'bishops': 'bishop',
    'rookie': 'rook e',
    'rock': 'rook',
    'rogue': 'rook',
    'broke': 'rook',
    'brook': 'rook',
    'brooke': 'rook',
    'roku': 'rook',
    'baroque': 'rook',
    'rogues': 'rook',
    'rooks': 'rook',
    'castles': 'castle',
    'kings': 'king',
    'queens': 'queen',
    'kingside': 'king-side',
    'queenside': 'queen-side',
    'take': 'takes',
    'asics': 'a6',
    'play': 'a',
    'aye': 'a',
    'ey': 'a',
    'before': 'b4',
    'bee': 'b',
    'see': 'c',
    'dee': 'd',
    'one': '1',
    'won': '1',
    'two': '2',
    'to': '2',
    'too': '2',
    'three': '3',
    'four': '4',
    'for': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'ate': '8',
    '1:00': '1',
    '2:00': '2',
    '3:00': '3',
    '4:00': '4',
    '5:00': '5',
    '6:00': '6',
    '7:00': '7',
    '8:00': '8'
}));

function currentSecondsSinceEpoch() {
    let d = new Date();
    return d.getTime() / 1000;
}

// global variables
let prevSpeechResult = '';
let prevSpeechTime = currentSecondsSinceEpoch();
let mustSayPawn = false;
let lastUrl = null;
let transcript;
let suggestion;
let continueRecording = false;
let recognition;

// inject HTML/CSS
window.addEventListener('load', () => {
    injectCSSLink('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
    new MutationObserver(injectHTML).observe(document, { subtree: true, childList: true });
});

function injectCSSLink(URL) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', URL);
    document.querySelector('head').appendChild(link);
}

function injectHTML() {
    const url = location.href;
    const urlBase = url.split('?')[0];
    if (lastUrl !== urlBase) {
        lastUrl = urlBase;

        continueRecording = false;
        recognition.stop();

        removeHTML();
        addHTML();
    }
}

function removeHTML() {
    const vc = document.getElementById(voiceControlID);
    if (vc) {
        vc.remove();
    }

    const i = document.getElementById(instructionsID);
    if (i) {
        i.remove();
    }
}

function addHTML() {
    const boardLayout = document.getElementById('board-layout-main');
    boardLayout.appendChild(getVoiceControl());
    boardLayout.appendChild(getInstructions());
}

function hideInstructions() {
    const instructions = document.getElementById(instructionsID);
    instructions.style.display = 'none';
}

function revealInstructions() {
    const instructions = document.getElementById(instructionsID);
    instructions.style.display = 'block';
}

function getInstructions() {
    const instructions = document.createElement('div');
    instructions.setAttribute('id', instructionsID);
    instructions.style.display = 'none';
    instructions.style.backgroundColor = 'white';
    instructions.style.marginBottom = '2%';
    instructions.style.marginTop = '2%';
    instructions.style.borderRadius = '3px';

    function newP(t, italic) {
        const p = document.createElement('p');
        p.style.margin = '0.5%';
        p.innerHTML = t;
        if (italic) {
            p.style.fontStyle = 'italic';
        }
        instructions.appendChild(p);
    }

    newP('Instructions:', true);
    let lines = [
        '1. Press mic button (can leave mic on).',
        '2. Say your chess move.',
    ];
    lines.forEach(l => newP(l, false));

    newP('Example moves:', true);
    lines = [
        '- "Queen d4"',
        '- "Castle King-side"',
        '- "Bishop takes c3" ("takes" is always optional)',
        '- "Pawn g3"',
        '- "g3" (if \'Must Say "Pawn"\' is unchecked)',
        '- "Pawn f g3" (pawn capture)'
    ];
    lines.forEach(l => newP(l, false));

    newP('Troubleshooting:', true);
    lines = [
        '1. Settings > Board > Move Method > Click.',
        '2. Your player\'s color must start on the bottom of the board/screen.',
        '3. If you prefer "Pawn g3" instead of "g3", you can check \'Must Say "Pawn"\' to prevent the second option.',
        '4. "failed to start recording":',
        'a) Make sure no other chess.com tabs have their mic turned on.',
        'b) Try reclicking the mic button.',
        'c) If that doesn\'t work, refresh the page. NOTE: in live games, please wait until white has moved twice. In puzzles, would lose progress.'
    ];
    lines.forEach(l => newP(l, false));

    return instructions;
}

function getVoiceControl() {
    const d = document.createElement('div');
    d.setAttribute('id', voiceControlID);
    d.style.display = 'flex';
    d.style.backgroundColor = 'white';
    d.style.marginBottom = '2%';
    d.style.marginTop = '2%';
    d.style.borderRadius = '3px';

    d.appendChild(getSpeechBtn());
    d.appendChild(getTranscriptAndSuggestion());
    d.appendChild(getCheckboxes())

    return d;
}

function getCheckboxes() {
    const d = document.createElement('div');
    d.setAttribute('id', checkboxesID);
    d.style.display = 'block';
    d.style.margin = '1%';

    d.appendChild(checkbox(mustSayPawnID, 'Must Say "Pawn"', mustSayPawn));

    const c2 = checkbox(showInstructionsID, 'Show Instructions', false);
    // c2.style.marginLeft = '7px';
    d.appendChild(c2);

    return d;
}

function checkbox(id, text, checked) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;

    // Create a label element
    const label = document.createElement('label');
    label.innerHTML = text;
    label.appendChild(checkbox);

    const d = document.createElement('div');
    d.appendChild(label);

    d.style.marginBottom = '1%';
    d.style.padding = '2px';
    // d.whiteSpace = 'pre-wrap';
    return d;
}

function getSpeechBtn() {
    const b = document.createElement('button');
    b.setAttribute('id', 'speechBtn');
    b.style.marginRight = '2%';
    b.style.marginLeft = '2%';
    b.style.marginBottom = '0.5%';
    b.style.marginTop = '0.5%';
    b.style.minWidth = '10%';

    const i = document.createElement('i');
    i.setAttribute('id', 'speechIcon');
    i.className = 'fa fa-microphone';

    b.appendChild(i);
    return b;
}

function getTranscriptAndSuggestion() {
    const d = document.createElement('div');
    d.style.display = 'block';
    d.style.margin = '1%';
    d.style.justifyContent = 'center';
    d.style.alignItems = 'center';
    
    transcript = document.createElement('span');
    transcript.setAttribute('id', 'transcript');
    transcript.style.marginBottom = '1%';
    transcript.style.borderRadius = '3px';
    transcript.style.borderColor = 'black';
    transcript.style.borderWidth = '2px';
    transcript.style.backgroundColor = 'black';
    transcript.style.color = 'white';
    transcript.style.padding = '2px';
    transcript.style.whiteSpace = 'pre-wrap';
    transcript.style.fontFamily = 'monospace, monospace';
    setTranscriptText('');

    suggestion = document.createElement('div');
    suggestion.setAttribute('id', 'suggestion');
    suggestion.style.fontStyle = 'italic';
    setSuggestionStyleValid(defaultSuggestionText);

    d.appendChild(transcript);
    d.appendChild(suggestion);
    
    return d;
}

function setTranscriptText(t) {
    t = ' ' + t;

    if (t.length === transcriptSize) {
        transcript.innerHTML = t;
        return;
    }

    if (t.length < transcriptSize) {
        transcript.innerHTML = t + ' '.repeat(transcriptSize - t.length);
        return;
    }

    transcript.innerHTML = t.slice(0, transcriptSize-3) + '...';
}

function setSuggestionStyleValid(t) {
    suggestion.style.color = '';
    suggestion.innerHTML = t;
}

function setSuggestionStyleInvalid(t) {
    suggestion.style.color = 'red';
    suggestion.innerHTML = t;
}

// click listener for record button
document.addEventListener('click', (e) => {
    if (e.target.id === 'speechBtn' || e.target.id === 'speechIcon') {
        // toggle speech recognition
        const speechIcon = e.target.id === 'speechBtn' ? e.target.children[0] : e.target;
        if (speechIcon.style.color === 'red') {
            speechIcon.style.color = 'black';
            continueRecording = false;
            recognition.stop();
        } else {
            prevSpeechResult = '';
            prevSpeechTime = currentSecondsSinceEpoch();
            setTranscriptText('');
            speechIcon.style.color = 'red';
            try {
                recognition.start();
                continueRecording = true;
                setSuggestionStyleValid(defaultSuggestionText);
            } catch (err) {
                console.log('failed to start recognition', err);
                continueRecording = false;
                setSuggestionStyleInvalid('failed to start recording (check "Show Instructions" and see "Troubleshooting"');
            }
        }
    }
});

document.addEventListener('change', (e) => {
    if (e.target.id === mustSayPawnID) {
        mustSayPawn = e.target.checked;
    }

    if (e.target.id === showInstructionsID) {
        if (e.target.checked) {
            revealInstructions();
        } else {
            hideInstructions();
        }
    }
});

// speech recognition and action logic
if (!('webkitSpeechRecognition' in window)) {
    suggestion.setSuggestionStyleInvalid('ERROR: upgrade your browser to use Chrome version 25 or greater');
} else {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;

    recognition.onend = () => {
        if (continueRecording) {
            // keep recording even after user stops talking
            recognition.start();
        }
    };

    recognition.onresult = handleResult;
}

function handleResult(e) {
    const result = e.results[0][0].transcript;
    if (result.length === 0) {
        return;
    }

    // get board
    const boards = document.getElementsByClassName('board');
    if (boards.length === 0) {
        setSuggestionStyleInvalid('ERROR: failed to locate the board. Cannot execute moves. Please try again');
        return;
    }
    const board = boards[0];

    // preprocess words
    const words = preProcessedWords(result);
    let speechTime = currentSecondsSinceEpoch();
    if (prevSpeechResult.length > 0 && speechTime - prevSpeechTime < 5.0) {
        // consider merging speech results if the previous result was spoken less than 5 seconds before
        pieces = new Set(majorMinorPieces);
        pieces.add('Pawn');
        pieces.add('Castle');
        if (pieces.has(prevSpeechResult) && !pieces.has(words[0])) {
            // merge if previous result was just a piece name, and the current result does not mention a piece name (as the first word)
            console.log('merging previous and current speech results. previous:', prevSpeechResult);
            words.unshift(prevSpeechResult);
        }
    }
    let speechResult = words.join(' ');
    prevSpeechResult = speechResult;
    prevSpeechTime = speechTime;

    // validate preprocessed words
    allPieces = new Set(majorMinorPieces);
    allPieces.add('Pawn');
    if (!mustSayPawn) {
        files.forEach(f => allPieces.add(f));
        ranks.forEach(r => allPieces.add(r));
    }

    const isCastle = words[0] === 'Castle';
    if (!allPieces.has(words[0]) && !isCastle) {
        let msg = 'start with "Castle", ' + majorMinorPieces.map(w => '"' + w + '"').join(', ');
        if (mustSayPawn) {
            msg +=  ', or "Pawn"';
        } else {
            msg += ', or "Pawn"/file';
        }

        setSuggestionStyleInvalid(msg);
        setTranscriptText(speechResult);
        return;
    }

    let move;
    if (isCastle) {
        move = newMove();
        move.majorMinorPiece = 'King';
        move.fromFile = 'e';
        const rank = isBlack(board) ? '8' : '1';
        move.fromRank = rank;
        move.rank = rank;

        if (speechResult === castleKingSide) {
            move.castleKingSide = true;
            move.file = 'g';
        } else if (speechResult === castleQueenSide) {
            move.castleQueenSide = true;
            move.file = 'c';
        } else {
            setSuggestionStyleInvalid('say "' + castleKingSide + '" or "' + castleQueenSide + '"');
            setTranscriptText(speechResult);
            return;
        }
    } else {
        let valid = false;
        [move, valid] = validateChessNotation(words);
        if (!valid) {
            setSuggestionStyleInvalid('invalid format (try "Pawn a3", "Queen d4", or "Castle King-side")');
            setTranscriptText(speechResult);
            return;
        }
    }

    // valid chess notation
    setTranscriptText(prettyPrintMove(move));

    const [fromCoords, valid, msg] = validateMoveOnBoard(board, move);
    if (!valid) {
        setSuggestionStyleInvalid(msg);
        return;
    }

    // valid move on board
    setSuggestionStyleValid('attempting move...');

    // execute move
    clickSquare(board, fromCoords);
    let toCoords = [fileToCoordinate.get(move.file), parseInt(move.rank, 10)];
    clickSquare(board, toCoords);
}

// convert two num
function preProcessedWords(t) {
    // remove punctuation
    t.replace('-', ' ');
    t.replace("'", '');
    t.replace(',', '');
    t.replace('.', '');

    // replace phrases like "put on" -> "pawn"
    for (const key of translationsMultiWord.keys()) {
        const val = translationsMultiWord.get(key);
        t.replace(key, val);
    }

    // replace individual words
    const words = t.split(' ');
    var cleanWords = words.map(w => {
        var val = w.toLowerCase();
        if (translationsSingleWord.has(val)) {
            return translationsSingleWord.get(val);
        }
        return val;
    });

    // remove extra spaces and make every array item one word in case of translations into multiple words
    cleanWords = cleanWords.join(' ').replace(/ +/g, ' ').split(' ');

    // uppercase first word
    if (majorMinorPieces.includes(upper(cleanWords[0])) || cleanWords[0] === 'castle' || cleanWords[0] === 'pawn') {
        cleanWords[0] = upper(cleanWords[0]);
    }

    if (cleanWords[0] === 'Castle') {
        // transform cleanWords into 'Castle Queen-side' or 'Castle King-side'
        if (cleanWords.length === 2) {
            cleanWords[1] = upper(cleanWords[1]);
        } else if (cleanWords.length >= 3) {
            cleanWords[1] = upper(cleanWords[1]) + '-' + cleanWords[2];
        }
    }

    let separated = [];
    cleanWords.forEach(w => {
        // space out ranks and files
        // 1. file rank file rank
        w = w.replace(/([a-z])(\d)([a-z])(\d)/g, '$1 $2 $3 $4');
        // 2. file file rank
        w = w.replace(/([a-z])([a-z])(\d)/g, '$1 $2 $3');
        // 3. rank file rank
        w = w.replace(/(\d)([a-z])(\d)/g, '$1 $2 $3');
        // 4. file rank
        w = w.replace(/([a-z])(\d)/g, '$1 $2');
        // 5. in case of e.g. "rook 5d 7"
        w = w.replace(/(\d)([a-z])/g, '$1 $2');

        w.split(' ').forEach((e) => {
            // in case of e.g. "rook ac 1" where we need to split "ac" into "a" and "c"
            for (const f1 of files) {
                for (const f2 of files) {
                    if (e === f1 + f2) {
                        separated.push(f1);
                        separated.push(f2);
                        return;
                    }
                }
            }

            separated.push(e);
        });
    });

    return separated;
}

function upper(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function validateChessNotation(words) {
    // options are the following, where TFR = [optional take] <dst-file> <dst-rank>:
    // 1. TFR (if mustSayPawn === false)
    // 2. [file] TFR (if mustSayPawn === false)
    // 3. [file] [rank] TFR
    // 4. [piece] TFR
    // 5. [piece] [file] TFR
    // 6. [piece] [rank] TFR
    // 7. [piece] [file] [rank] TFR

    const move = newMove();

    // ensure that file and rank are last
    if (words.length >= 2) {
        move.file = words[words.length - 2];
        move.rank = words[words.length - 1];
        const valid = files.includes(move.file) && ranks.includes(move.rank);
        if (!valid) {
            return [move, false];
        }
    }

    if (words.length === 2) {
        if (mustSayPawn) {
            return [move, false];
        } else {
            // pawn move like b6
            return [move, true];
        }
    }

    // remove the file and rank from the word array
    words = words.slice(0, words.length - 2);

    // ensure that "takes" is now last
    if (words.includes('takes')) {
        move.takes = true;
        const valid = words.length >= 2 && words[words.length - 1] === 'takes';
        if (!valid) {
            return [move, false];
        }
    
        // remove "takes" from the word array
        words = words.slice(0, words.length - 1);
    }

    if (majorMinorPieces.includes(words[0])) {
        // non-pawn piece
        move.majorMinorPiece = words[0];
        if (words.length === 1) {
            return [move, true];
        }

        // remove the piece from the word array
        words = words.slice(1);

        if (files.includes(words[0])) {
            move.fromFile = words[0];

            if (words.length === 1) {
                return [move, true];
            }

            // remove the fromFile from the word array
            words = words.slice(1);
        }

        if (ranks.includes(words[0])) {
            move.fromRank = words[0];

            if (words.length === 1) {
                return [move, true];
            }
        }

        // invalid at this point
        return [move, false];
    }

    // pawn
    if (words[0] === 'Pawn') {
        move.pawn = true;
        if (words.length === 1) {
            return [move, true];
        }

        words = words.slice(1);
    } else if (mustSayPawn) {
        return [move, false];
    }

    if (files.includes(words[0])) {
        move.fromFile = words[0];

        if (words.length === 1) {
            return [move, true];
        }

        // remove the fromFile from the word array
        words = words.slice(1);
    }

    if (ranks.includes(words[0])) {
        move.fromRank = words[0];

        if (words.length === 1) {
            return [move, true];
        }
    }

    // invalid pawn move
    return [move, false];
}

function newMove() {
    return {
        // considered a pawn iff majorMinorPiece === ''
        majorMinorPiece: '',
        fromFile: '',
        fromRank: '',
        // takes only signifies whether the user said "takes", not whether this will be a capture
        takes: false,
        // pawn only signifies whether the user said "pawn", not whether this is a pawn move
        pawn: false,
        file: '',
        rank: '',
        castleKingSide: false,
        castleQueenSide: false
    };
}

function prettyPrintMove(m) {
    if (m.castleKingSide) {
        return castleKingSide;
    }

    if (m.castleQueenSide) {
        return castleQueenSide;
    }

    let result = '';
    if (m.majorMinorPiece.length > 0) {
        result += m.majorMinorPiece + ' ';
    } else if (m.pawn) {
        result += 'Pawn ';
    }

    if (m.fromFile.length > 0 || m.fromRank > 0) {
        result += m.fromFile + m.fromRank + ' ';
    }

    if (m.takes) {
        result += 'takes ';
    }

    result += m.file + m.rank;

    return result;
}

function validateMoveOnBoard(board, move) {
    let pieceClass = 'w';
    if (isBlack(board)) {
        pieceClass = 'b';
    }

    pieceClass += piecesToHtmlClass.get(move.majorMinorPiece);
    const pieces = board.querySelectorAll('.piece.' + pieceClass);
    if (pieces.length === 0) {
        return [null, false, 'could not find the piece on the board'];
    }

    const validPieces = Array.from(pieces).filter(p => validatePiece(board, move, p));
    if (validPieces.length === 0) {
        let msg = 'illegal move detected';
        if (move.majorMinorPiece.length === 0) {
            // pawn move
            msg += '. pawn captures require the original file (e.g. "Pawn a b4")';
        }
        return [null, false, msg];
    }

    let validPiece = validPieces[0];
    if (move.majorMinorPiece.length === 0 && validPieces.length == 2 && validPieces[0].fromFile == validPieces[1].fromFile) {
        // edge case where pawn's stacked on each other on 2nd and 3rd rank (white), or 6th and 7th rank (black)
        if (isBlack(board)) {
            if (validPieces[1].fromRank === '6') {
                validPiece = validPieces[1];
            }
        } else {
            if (validPieces[1].fromRank === '3') {
                validPiece = validPieces[1];
            }
        }
    } else if (validPieces.length > 1) {
        return [null, false, validPieces.length.toString() + ' pieces can make this move. Be more descriptive (e.g. Rook a1 c1)'];
    }

    return [pieceCoords(validPiece), true, ''];
}

function isBlack(board) {
    return board.classList.contains('flipped');
}

function validatePiece(board, move, piece) {
    const [x, y] = pieceCoords(piece);
    if (x === -1) {
        // failure in pieceCoords
        return false;
    }

    if (move.fromFile.length > 0 && move.fromFile !== coordinateToFile.get(x)) {
        return false;
    }

    if (move.fromRank.length > 0 && move.fromRank !== y.toString()) {
        return false;
    }

    if (move.castleKingSide || move.castleQueenSide) {
        return true;
    }

    // validate if the piece can move to the destination (minus pins and pieces in the way)
    const newX = fileToCoordinate.get(move.file);
    const newY = parseInt(move.rank, 10);

    const deltaX = newX - x;
    const deltaY = newY - y;

    // ensure that the piece is moving
    if (deltaX === 0 && deltaY === 0) {
        return false;
    }

    if (move.majorMinorPiece.length === 0) {
        // pawn
        const sameFile = move.fromFile.length === 0 || move.fromFile == move.file;
        if (sameFile) {
            if (deltaX !== 0) {
                return false;
            }
        } else {
            if (Math.abs(deltaX) !== 1) {
                return false;
            }
        }

        // allowed to move one rank or two ranks on first move
        if (isBlack(board)) {
            return deltaY === -1 || (sameFile && y === 7 && newY === 5);
        } else {
            return deltaY === 1 || (sameFile && y === 2 && newY === 4);
        }
    }
    
    if (move.majorMinorPiece === 'Knight') {
        return (Math.abs(deltaX) === 2 && Math.abs(deltaY) === 1) || (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 2);
    }

    if (move.majorMinorPiece === 'King') {
        const legalX = deltaX === 0 || Math.abs(deltaX) === 1;
        const legalY = deltaY === 0 || Math.abs(deltaY) === 1;
        return legalX && legalY;
    }

    const legalBishopMove = Math.abs(deltaX) === Math.abs(deltaY);
    const legalRookMove =  (deltaX === 0 && deltaY !== 0) || (deltaX !== 0 && deltaY === 0);
    if (move.majorMinorPiece === 'Bishop') {
        return legalBishopMove;
    }

    if (move.majorMinorPiece === 'Rook') {
        return legalRookMove;
    }

    if (move.majorMinorPiece === 'Queen') {
        return legalBishopMove || legalRookMove;
    }

    console.log('WARNING: unknown piece', move);
    return false;
}

// pieceCoords gets the HTML piece coords.
// It returns [-1, -1] if it cannot find the coords.
function pieceCoords(piece) {
    let square = '';
    for (c of piece.classList) {
        if (c.startsWith('square-')) {
            square = c;
            break;
        }
    }

    if (square === '') {
        return [-1, -1];
    }

    const coords = square.slice('square-'.length);
    if (!coordinateMap.has(coords)) {
        console.log('ERROR: missing square in coordinateMap', square, coords);
        return [-1, -1];
    }

    return coordinateMap.get(coords);
}

function clickSquare(board, coords) {
    console.log('clicking coords:', coords);
    const [x, y] = coords;
    const boardCoords = board.getBoundingClientRect();
    const squareLength = (1 / 8) * boardCoords.width;
    
    let clientX;
    let clientY;
    if (isBlack(board)) {
        clientX = boardCoords.right - x * squareLength + (1 / 2) * squareLength;
        clientY = boardCoords.top + y * squareLength - (1 / 2) * squareLength;
    } else {
        clientX = boardCoords.left + x * squareLength - (1 / 2) * squareLength;
        clientY = boardCoords.bottom - y * squareLength + (1 / 2) * squareLength;
    }

    const eventOptions = {
        view: window, bubbles: true, cancelable: true, clientX, clientY,
    };

    // see note at top about board square class
    const pieceSquareTwoDigits = document.querySelector('.square-' + x.toString() + y.toString());
    const pieceSquareFourDigits = document.querySelector('.square-0' + x.toString() + '0' + y.toString());

    // some click logic
    if (pieceSquareTwoDigits) {
        pieceSquareTwoDigits.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
        pieceSquareTwoDigits.dispatchEvent(new PointerEvent('pointerup', eventOptions));
    } else if (pieceSquareFourDigits) {
        pieceSquareFourDigits.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        pieceSquareFourDigits.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    } else {
        if (board.classList.contains('v-board')) {
            board.dispatchEvent(new MouseEvent('mousedown', eventOptions));
            board.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        } else {
            board.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
            board.dispatchEvent(new PointerEvent('pointerup', eventOptions));
        }
    }
}
