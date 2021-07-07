const express = require('express')
const app = express()
const $path = require('path')
const port = process.env.PORT || 5000
const scoresPath = $path.resolve('./scores')
const fs = require('fs')

app.get('/scores', (request, response) => {
  const theFile = $path.join(scoresPath, 'scores.json')
  const data = fs.readFileSync(theFile);
  const json = JSON.parse(data);
  response.type('json').send(json)
})

app.post('/scores',
  express.json(),
  (request, response) => {
    const theFile = $path.join(scoresPath, 'scores.json')
    fs.writeFileSync(theFile, JSON.stringify(request.body));
    response.status(201).send('Success')
})

app.listen(port, () => console.log(`Listening on port ${port}!`))