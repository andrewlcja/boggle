// custom modules
const config = require('../api/config');

// node modules
const fs = require('fs');
const path = require("path");
const readline = require('readline');

// this class represents the search tree data structure that will be used to store the valid words from dictionary.txt
class Trie {
  constructor() {
    this.root = {};
  }

  // this method adds each letter in the specified word into the trie
  add(word) {
    // instantiate current node
    let current = this.root;

    for (const letter of word) {
      // check if letter exists in current node
      if (!current[letter]) {
        current[letter] = {};
      }

      current = current[letter];
    }

    // an end symbol is used to signify the end of a word
    current[config.END_SYMBOL] = word;
  }
}

// initialize new trie with the valide words from dictionary.txt
exports.init = () => {
  return new Promise((resolve, reject) => {
    const trie = new Trie();

    const readInterface = readline.createInterface({
      input: fs.createReadStream(path.resolve(__dirname, '../data/dictionary.txt')),
      console: false
    });

    readInterface.on('line', (line) => {
      trie.add(line.trim().toLowerCase());
    });

    readInterface.on('close', () => {
      resolve(trie);
    })
  });
}