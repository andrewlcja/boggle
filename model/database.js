// common database methods are written here
const initConnection = () => {
  const knex = require('knex')({
    client: 'mysql',
    connection: {
      host: 'boggle.c3zwmot1y76w.ap-southeast-1.rds.amazonaws.com',
      user: 'admin',
      password: 'admin123',
      port: '3306',
      database: 'boggle'
    }
  });

  return knex;
}

exports.insertRecord = (tableName, object) => {
  return new Promise((resolve, reject) => {
    const knex = initConnection();

    knex(tableName)
      .insert(object)
      .then((result) => {
        knex.destroy();
        resolve(result[0]);
      })
      .catch((err) => {
        knex.destroy();
        reject(err);
      })
      .finally(() => {
        knex.destroy();
      })
  })
}

exports.updateRecord = (tableName, id, object) => {
  return new Promise((resolve, reject) => {
    const knex = initConnection();

    knex(tableName)
      .where('id', id)
      .update(object)
      .then((result) => {
        knex.destroy();
        resolve(result);
      })
      .catch((err) => {
        knex.destroy();
        reject(err);
      })
      .finally(() => {
        knex.destroy();
      })
  })
}

exports.retrieveRecord = (tableName, id) => {
  return new Promise((resolve, reject) => {
    const knex = initConnection();

    knex(tableName)
      .where('id', id)
      .first('*')
      .then((result) => {
        knex.destroy();
        
        if (typeof result === 'undefined') {
          resolve(null);
        } else {
          resolve(result);
        }
      })
      .catch((err) => {
        knex.destroy();
        reject(err);
      })
      .finally(() => {
        knex.destroy();
      })
  })
}