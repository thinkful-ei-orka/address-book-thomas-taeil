require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const { v4: uuidv4 } = require('uuid');

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json());


const addresses = [];

app.get('/address', (req, res) => {
  res.json(addresses);
})

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  // move to the next middleware
  next();
});

app.post('/address', (req, res) => {
  const { firstName, lastName, address1, address2 = '', city, state, zip } = req.body;

  if (!firstName) {
    return res.status(400).send('First name is required');
  }

  if (!lastName) {
    return res.status(400).send('Last name is required');
  }

  if (!address1) {
    return res.status(400).send('Address 1 is required');
  }

  if (!city) {
    return res.status(400).send('City is required');
  }

  if (!state || state.length !== 2) {
    return res.status(400).send('State is required and must be two characters');
  }

  if (!parseInt(zip) || zip.length !== 5 ) {
    return res.status(400).send('Zip is required and must be 5 digits');
  }

  let newId = uuidv4()
  const newAddress = {
    id: newId,
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip
  };

  addresses.push(newAddress);

  res
    .status(201)
    .location(`http://localhost:8000/address/${newId}`)
    .json(newAddress);
})

app.delete('/address/:id', (req, res) => {
  const indexOfAddress = addresses.findIndex(address => address.id === req.params.id);
  addresses.splice(indexOfAddress, 1);
  res
    .status(204)
    .end();
})

app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
    res.status(500).json(response)
  })

module.exports = app
