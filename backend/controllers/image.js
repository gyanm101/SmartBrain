const axios = require('axios');

const PAT = '';

const handleApiCall = (req, res) => {
  const IMAGE_URL = req.body.input;

  const raw = JSON.stringify({
    user_app_id: {
      user_id: 'clarifai',
      app_id: 'main'
    },
    inputs: [
      {
        data: {
          image: {
            url: IMAGE_URL
          }
        }
      }
    ]
  });

  axios({
    method: 'POST',
    url: 'https://api.clarifai.com/v2/models/face-detection/outputs',
    headers: {
      Accept: 'application/json',
      Authorization: 'Key ' + PAT,
      'Content-Type': 'application/json'
    },
    data: raw
  })
    .then(response => res.json(response.data))
    .catch(err => {
      console.log('Clarifai error:', err.response?.data || err.message);
      res.status(400).json(err.response?.data || 'unable to work with API');
    });
};

const handleImage = (req, res, db) => {
  const { id } = req.body;
  db('users')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => res.json(entries[0]))
    .catch(err => res.status(400).json('unable to get entries'));
};

module.exports = {
  handleImage,
  handleApiCall
};