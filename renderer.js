const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'workouts.json');

document.getElementById('newWorkoutBtn').addEventListener('click', () => {
  const container = document.getElementById('workoutFormContainer');
  container.innerHTML = ''; // clear previous

  const form = document.createElement('form');
  form.innerHTML = `
    <h2>Create Workout</h2>
    <label>Day of the Week: <input type="text" name="day" required></label><br>
    <label>Muscle Group: <input type="text" name="muscleGroup" required></label><br><br>

    <h3>Exercise 1</h3>
    <label>Exercise Name: <input type="text" name="name"></label><br>
    <label>Sets: <input type="number" name="sets"></label><br>
    <label>Reps: <input type="number" name="reps"></label><br>
    <label>Weight: <input type="number" name="weight"></label><br><br>

    <button type="submit">Save Workout</button>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const workout = {
      date: new Date().toISOString(),
      day: data.get('day'),
      muscleGroup: data.get('muscleGroup'),
      exercises: [
        {
          name: data.get('name'),
          sets: Number(data.get('sets')),
          reps: Number(data.get('reps')),
          weight: Number(data.get('weight'))
        }
      ]
    };

    let existing = [];
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath));
    }

    existing.push(workout);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    showNotification('Workout saved successfully!');
    form.reset();
  });

  container.appendChild(form);
});

// Load saved workouts
document.getElementById('loadWorkoutsBtn').addEventListener('click', () => {
  const display = document.getElementById('savedWorkouts');
  display.innerHTML = '<h2>Saved Workouts:</h2>';

  if (!fs.existsSync(filePath)) {
    display.innerHTML += '<p>No workouts found.</p>';
    return;
  }

  const workouts = JSON.parse(fs.readFileSync(filePath));
  workouts.forEach(w => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${w.day}</strong> (${w.muscleGroup}) - ${new Date(w.date).toLocaleDateString()}<br>
      ${w.exercises.map(ex => `${ex.name} - ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight} lbs`).join('<br>')}
      <hr>
    `;
    display.appendChild(div);
  });
});
