const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Task storage
let tasks = [];

// Endpoint to create a task
app.post('/tasks', (req, res) => {
  const { date, teamLeader, description } = req.body;
  if (!date || !teamLeader || !description) {
    return res.status(400).send('All fields are required!');
  }
  const task = { id: tasks.length + 1, date, teamLeader, description };
  tasks.push(task);
  res.status(201).send(task);
});

// Endpoint to fetch all tasks
app.get('/tasks', (req, res) => {
  res.send(tasks);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Calendar API is running on http://localhost:${PORT}`);
});
