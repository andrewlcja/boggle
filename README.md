
# Boggle

## Getting Started

### Prerequisites

This collection of APIs was implemented using Node.js and utilizes a couple of node packages

Before running the codes, the following must be installed:

 - NodeJS
 - Npm

### Running the codes

Clone the source code

Run the following commands to start the express server
```
cd boggle
npm i
npm start
```

The following message should appear
```
Boggle app listening on port 3000!
```

### Calling the API (Postman)
Download [Postman](https://www.getpostman.com/downloads/)
Download the postman collection [here](https://www.getpostman.com/collections/383a4d2bf8acb1ce67ea)

**Note:** Replace serverUrl environment variable in the postman collection accordingly

## Design

### Algorithm
The main data structure used is a Trie. Every node of the Trie consists of multiple branches. Each branch represents a possible character of a possible word. There will be an end symbol (!) which indicates that a word has been formed. (Refer to comments written on code level)

The rough flow for creating a game is as follows:

 1. When the create game API is invoked (i.e. POST /games), the game board will be generated (either randomly / specified by user / default)
 2. Convert board string into a 2d array for easier exploration
 3. Construct Trie (by using the data from dictionary.txt)
 4. Start exploring each letter in the board in a recursive manner
 5. During the exploration, if an end symbol is reached (i.e. !), this means a valid word has been found in the board. Keep track of this valid word
 6. More nodes in the Trie will be traversed if the current letter is a wildcard (i.e. *) as this could represent any letter
 7. Once the exploration is complete, the collated list of valid words will be converted into a JSON string and stored as an attribute of this new game record, which will be stored in the database

The rough flow for playing/updating a game is as follows:

 1. When the update game API is invoked (i.e. PUT /games/1), this game record is retrieved from the database
 2. A series of validity checks are carried out (e.g. checking token validity, checking if game has expired etc.)
 3. The input word will be checked against the valid words object which was stored as a JSON string in the database for this game record (i.e. when converting the JSON string back into a JSON object, the data structure is like a hash table)
 4. Using the valid words object, a quick lookup can be done to check if the input word is valid
 5. If it is valid, calculate the points gained and keep track of the words guessed (represented similarly as a JSON string)
 6. Game record is updated in the database

### Considerations
Initially, I was not entirely sure which data structure to use (e.g. array, graph, stack, queue, heap). But my first impression was to use a graph as I knew I had to some how keep track of how each letter links up to another.

After some initial research, I realised that there was this data structure called Trie which was pretty much like a graph but it's main use case was to do string searching. I thought that this was appropriate to be used for this boggle challenge. The next thing that I had to decide was how this Trie data structure was going to be used. There were 2 main options:

 1. Ingest it with data from the game board (to somehow keep track of all possible letter combinations)
 2. Ingest it with data from dictionary.txt (to keep track of all valid words)

I went with the 2nd option as the 1st didn't make much sense on second thought. Next, I had to consider how should the user's guessed word be validated? Since boggle is a game where users can keep guessing various words in a specified time frame, I thought that it would be important that validating the user's guessed word had to be done as quick as possible in order for the game to be smooth.

Hence, I decided to implement the above mentioned algorithm every time a new game is created and leveraged on the database to store the list of valid words (represented as a hash table). Each time the game is played (i.e. a new word is guessed), not much backend logic has to be ran. The only thing to be done is to check the guessed word against the valid words which was already calculated in advance during the creation of this game.

The other thing that was proving to be an issue was how to handle the wildcards in the boggle board as they could virtually represent any letter. I decided to make slight modifications to the algorithm (refer to above explanation under Algorithm).

## Assumptions

*  Game is played with a 4x4 board with 16 letter tiles
* When a board is randomly generated, the possible letters are the 26 uppercase letters + the wildcard (*)
* For wildcards, I've imposed a check to ensure that there's no more than 8 wildcards in the board (this is a current limitation of the algorithm)
* Points awarded for each correct/valid word is based on the length of the word (e.g. tap is worth 3 points)
* When the update game API (i.e. PUT /games/1) is called, the response will show the accumulated points for that specific game (i.e. 1st word played is tap - 3 points, 2nd word played is apple - 8 points (3 + 5 = 8))

## External resources

### Node packages
* [express](https://www.npmjs.com/package/express) - Used as backend server for exposing API routes
* [knex](https://www.npmjs.com/package/knex) - SQL query builder
* [joi](https://www.npmjs.com/package/@hapi/joi) - Object schema description language and validator for JavaScript objects
* [moment-timezone](https://www.npmjs.com/package/moment-timezone) - A lightweight JavaScript date library for parsing, validating, manipulating, and formatting dates. Includes timezone features
* [short-uuid](https://www.npmjs.com/package/short-uuid) - Generate short UUIDs (mainly used to generate unique token for each game)