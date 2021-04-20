const obj = require('./config/datastores.js')
//console.log(obj.datastores.default.url)
const str = obj.datastores.default.url.split('//')
const str1 = (str[1])
const userPass = str1.split('@')
const userPass1 = userPass[0].split(':')
//console.log(user)
//console.log(pass)
const hostBd = userPass[1].split(':')
//console.log(hostBd[0])
const nameStr = userPass[1].split('/')
//console.log(nameStr[1])


const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : hostBd[0],
  user     : userPass1[0],
  password : userPass1[1],
  database : nameStr[1]
});

connection.connect();
const time = (new Date()).getTime() - (60*60*24*90*1000);
//console.log(time)
connection.query(`DELETE  FROM message WHERE topic REGEXP '[[:alpha:]]' AND updatedAt < ${time}`, function (error, results, fields) {
  if (error) throw error;
  console.log('deleted ' + results.affectedRows + ' rows');
})

connection.end();
