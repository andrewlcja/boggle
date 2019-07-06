// custom modules
const config = require('./config');
const validator = require('./validator');
const presenter = require('./presenter');
const response = require('./response');
const database = require('../model/database');
const Trie = require('../model/trie');

// node modules
const fs = require('fs');
const path = require("path");
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Singapore');
const short = require('short-uuid');

exports.createGame = async (req, res) => {
  try {
    // validate request payload
    const result = validator.validateRequest(req.body, validator.createGameSchema);

    // check if validation passes
    if (result.error === null) {
      // reassign validated value
      req.body = result.value;

      // instantiate board
      let board = null;

      if (req.body.random) {
        // generate random board
        board = generateRandomBoard();
      } else {
        if (req.body.board) {
          // use custom board input from user
          board = req.body.board;
        } else {
          // use default board from test_board.txt
          const data = fs.readFileSync(path.resolve(__dirname, '../data/test_board.txt'));
          board = data.toString();
        }
      }

      // convert board object from string to 2d array
      const board2DArr = convertBoardTo2DArray(board);

      // calculate the number of wildcards in the board (currently allow only if less than equals to 8)
      if (calculateWildcards(board2DArr) <= 8) {
        // initialize 2d array to keep track of whether each letter has been visted or not
        const visited = board2DArr.map((row) => {
          return row.map((letter) => {
            return false;
          });
        });

        // initialize trie
        const trie = await Trie.init();

        // instantizte object to keep track of valid words that can be formed from the board
        const validWords = {};

        // start iterating through each letter in the board
        for (let i = 0; i < board2DArr.length; i++) {
          for (let j = 0; j < board2DArr[i].length; j++) {
            // explore current letter
            explore(i, j, board2DArr, trie.root, visited, validWords);
          }
        }

        // construct new game
        const game = {
          token: short.generate(),
          duration: req.body.duration,
          board: board,
          points: 0,
          valid_words: JSON.stringify(validWords),
          guessed_words: JSON.stringify({}),
          expires_at: moment().add(req.body.duration, 'seconds').format('YYYY-MM-DDTHH:mm:ss')
        };

        // insert new game into database
        const id = await database.insertRecord(config.TABLE_NAME, game);
        game.id = id;

        // return success message
        response.success(res, presenter.formatCreateGameResponse(game), 201);
      } else {
        // return error message
        response.error(res, 'There can only be a maximum of 8 wildcards', 400);
      }
    } else {
      // return error message
      response.error(res, result.error.details[0].message.replace(/"/g, ''), 400);
    }
  } catch (err) {
    // return error message
    response.error(res, err, 500);
  }
}

exports.updateGame = async (req, res) => {
  try {
    // validate request payload
    const result = validator.validateRequest(req.body, validator.updateGameSchema);

    // check if validation passes
    if (result.error === null) {
      // reassign validated value
      req.body = result.value;

      // check if game exists in database
      const game = await database.retrieveRecord(config.TABLE_NAME, req.params.id);

      if (game !== null) {
        // validate entered token
        if (req.body.token === game.token) {
          // calculate the time left
          game.time_left = Math.round(moment.duration(moment(game.expires_at).diff(moment())).asSeconds());

          if (game.time_left > 0) {
            // parse json string into json
            const validWords = JSON.parse(game.valid_words);
            req.body.word = req.body.word.toLowerCase();

            // check if word is valid
            if (validWords[req.body.word]) {
              const guessedWords = JSON.parse(game.guessed_words);

              // check if word has been guessed before
              if (!guessedWords[req.body.word]) {
                guessedWords[req.body.word] = true;
                game.points += req.body.word.length;

                // update game with latest guessed word and points in database
                await database.updateRecord(config.TABLE_NAME, game.id, { guessed_words: JSON.stringify(guessedWords), points: game.points });

                // return success message
                response.success(res, presenter.formatGameResponse(game), 200);
              } else {
                // return error message
                response.error(res, 'This word has already been guessed', 400);
              }
            } else {
              // return error message
              response.error(res, 'Invalid word', 400);
            }
          } else {
            // return error message
            response.error(res, 'This game has expired, please create a new game', 400);
          }
        } else {
          // return error message
          response.error(res, 'Invalid token', 400);
        }
      } else {
        // return error message
        response.error(res, 'Game not found', 404);
      }
    } else {
      // return error message
      response.error(res, result.error.details[0].message.replace(/"/g, ''), 400);
    }
  } catch (err) {
    // return error message
    response.error(res, err, 500);
  }
}

exports.getGame = async (req, res) => {
  try {
    // check if game exists in database
    const game = await database.retrieveRecord(config.TABLE_NAME, req.params.id);

    if (game !== null) {
      // calculate time left
      game.time_left = Math.round(moment.duration(moment(game.expires_at).diff(moment())).asSeconds());

      // if game has expired
      if (game.time_left < 0) {
        game.time_left = 0;
      }

      //return success message
      response.success(res, presenter.formatGameResponse(game), 200);
    } else {
      // return error message
      response.error(res, 'Game not found', 404);
    }
  } catch (err) {
    // return error message
    response.error(res, err, 500);
  }
}

// generates a board with random letters (wildcard included)
const generateRandomBoard = () => {
  let board = '';

  for (let i = 0; i < config.NUM_OF_TILES; i++) {
    // randomize each letter and place into board
    board += config.VALID_CHARACTERS[Math.floor(Math.random() * config.VALID_CHARACTERS.length)];

    if (i !== config.NUM_OF_TILES - 1) {
      board += ', ';
    }
  }

  return board;
}

// convert board to 2d array to allow easier tracking of neighbours
const convertBoardTo2DArray = (board) => {
  let result = [];

  const boardArr = board.toLowerCase().replace(/ /g, '').split(',');

  // divide into equal length arrays
  for (let i = 0; i < boardArr.length; i += config.BOARD_LENGTH) {
    result.push(boardArr.slice(i, i + config.BOARD_LENGTH));
  }

  return result;
}

// calcule numbmer of wildcards in a given board
const calculateWildcards = (board2DArr) => {
  let wildcards = 0;

  for (let i = 0; i < board2DArr.length; i++) {
    for (let j = 0; j < board2DArr[i].length; j++) {
      if (board2DArr[i][j] === config.WILDCARD_SYMBOL) {
        wildcards++;
      }
    }
  }

  return wildcards;
}

// explore the board recursively
const explore = (i, j, board2DArr, trieNode, visited, validWords) => {
  // ignore letters that have been visited
  if (visited[i][j]) {
    return;
  }

  const letter = board2DArr[i][j];

  // ignore wildcards or if letter does not exists in trie node
  if (letter !== config.WILDCARD_SYMBOL && !trieNode[letter]) {
    return;
  }

  // mark current letter as visited
  visited[i][j] = true;

  // define array of trie nodes to account for letter being a wildcard
  let trieNodes = [];
  if (letter !== config.WILDCARD_SYMBOL) {
    // if letter is not a wildcard, push in corresponding trie node for letter
    trieNodes.push(trieNode[letter]);
  } else {
    // if letter is a wild card, push in trie nodes for all letters at the current level
    const keys = Object.keys(trieNode);

    for (let key of keys) {
      trieNodes.push(trieNode[key]);
    }
  }

  // loop through each trie node
  for (let trieNode of trieNodes) {
    // check if trie node has an end symbol, if yes, keep track of new valid word
    if (trieNode[config.END_SYMBOL]) {
      validWords[trieNode[config.END_SYMBOL]] = true;
    }

    // get neighbours corresponding to current coordinates
    const neighbours = getNeighbours(i, j, board2DArr);

    for (let neighbour of neighbours) {
      // explore each neighbour for current trie node
      explore(neighbour[0], neighbour[1], board2DArr, trieNode, visited, validWords);
    }

  }

  // set current letter as not visited after exploration
  visited[i][j] = false;
}

// gets neighbours based on your current coordinates
const getNeighbours = (i, j, board2DArr) => {
  const neighbours = [];

  if (i > 0 && j > 0) {
    neighbours.push([i - 1, j - 1]);
  }

  if (i > 0 && j < board2DArr[0].length - 1) {
    neighbours.push([i - 1, j + 1]);
  }

  if (i < board2DArr.length - 1 && j < board2DArr[0].length - 1) {
    neighbours.push([i + 1, j + 1]);
  }

  if (i < board2DArr.length - 1 && j > 0) {
    neighbours.push([i + 1, j - 1]);
  }

  if (i > 0) {
    neighbours.push([i - 1, j]);
  }

  if (i < board2DArr.length - 1) {
    neighbours.push([i + 1, j]);
  }

  if (j > 0) {
    neighbours.push([i, j - 1]);
  }

  if (j < board2DArr[0].length - 1) {
    neighbours.push([i, j + 1]);
  }

  return neighbours;
}