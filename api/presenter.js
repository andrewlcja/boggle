// presentation logic is written here
exports.formatCreateGameResponse = (game) => {
  return {
    id: game.id,
    token: game.token,
    duration: game.duration,
    board: game.board
  }
}

exports.formatGameResponse = (game) => {
  return {
    id: game.id,
    token: game.token,
    duration: game.duration,
    board: game.board,
    time_left: game.time_left,
    points: game.points
  }
}