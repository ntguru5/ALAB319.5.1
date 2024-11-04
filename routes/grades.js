import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb"; // class representing an ObjectId

const router = express.Router();

// get a single grade entry
router.get('/:id', async (req, res, next) => { // whoever is sending the request provides id
  try {
    let collection = await db.collection('grades');
    const query = { _id: new ObjectId(req.params.id) }; // query
    let result = await collection.findOne(query);

    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  } catch (err) {
    next(err); // the next function directs the err to the global error handling middleware
  }
})

// Backwards compatibility for student/learner. Redirects student to learner
router.get('/student/:id', (req, res) => {
  res.redirect(`../learner/${req.params.id}`);
  })

// Get specific student
router.get('/learner/:id', async (req, res, next) => {
  try {
    let collection = await db.collection('grades');
    const query = { learner_id: Number(req.params.id) }; // query

    // get combo of learner and class
    if (req.query.class) {
      query.class_id = Number(req.query.class);
    }

    let result = await collection.find(query).toArray();



    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  } catch (err) {
    next(err);
  }
})

// Get a class's grade data
router.get('/class/:id', async (req, res, next) => {
  try {
    let collection = await db.collection('grades');
    const query = { class_id: Number(req.params.id) }; // query

    if (req.query.learner) {
      query.learner_id = Number(req.query.learner);
    }

    let result = await collection.find(query).toArray();

    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  } catch (err) {
    next(err);
  }
})

// get learner average for EACH class
router.get("/learner/:id/class/average", async (req, res, next) => {
  try {
    let collection = db.collection("grades");
    let query = { learner_id: Number(req.params.id)}
    let learnerGrades = await collection.find(query).toArray()

    const averages = learnerGrades.reduce((acc, grade) => {
      let sum = 0;
      for (let i = 0; i < grade.scores.length; i++) {
        if (typeof grade.scores[i].score === 'number') {
          sum += grade.scores[i].score        }
      }
      acc[grade.class_id] = sum / grade.scores.length
      return acc
    }, {})

    res.send(averages).status(200)

  } catch (err) {
    next(err)
  }
})

const result = {
  "350": 78.20938475,
  "89": 90.9823754
}


// to get overall average of a learner
router.get("/learner/:id/average", async (req, res, next) => {
  try {
    let collection = db.collection("grades");
    let query = { learner_id: Number(req.params.id)}
    let learnerGrades = await collection.find(query).toArray()
    let sum = 0;
    let scoreCount = 0
    for (let i = 0; i < learnerGrades.length; i++) {
      for (let j = 0; j < learnerGrades[i].scores.length; j++) {
        if (typeof learnerGrades[i].scores[j].score === 'number') {
          sum += learnerGrades[i].scores[j].score
        }
        scoreCount++
      }
    }

    const overallScore = sum / scoreCount

    res.send("Over average: " + overallScore).status(200)
  } catch (err) {
    next(err)
  }
})


// Weighted average
// router.get('/learner/:id/average', async (req, res, next) => {
//   try {}
//   catch (err) {
//     next(err);
//   }
//   })


// router.get("/class/:id/average", async (req, res) => {
//   let collection = await db.collection("grades");
//   let query = { class_id: Number(req.params.id) };
//   let results = await collection.find(query).toArray();
//   if (!results || results.length === 0) {
//     return res.send("Not found").status(404);
//   }
//   let totalWeightedScore = 0;
//   let totalWeight = 0;
//   results.forEach(entry => {
//     // made up weights
//     const examWeight = 0.65;
//     const homeworkWeight = 0.10;
//     const quizWeight = 0.25; // Remaining weight for quizzes
//     const examScore = entry.scores.filter(score => score.type === 'exam').reduce((sum, score) => sum + score.score, 0);
//     const homeworkScore = entry.scores.filter(score => score.type === 'homework').reduce((sum, score) => sum + score.score, 0);
//     const quizScore = entry.scores.filter(score => score.type === 'quiz').reduce((sum, score) => sum + score.score, 0);
//     const weightedScore = (examScore * examWeight) + (homeworkScore *homeworkWeight) + (quizScore * quizWeight);
//     totalWeightedScore += weightedScore;
//     totalWeight += (examWeight + homeworkWeight + quizWeight);
//   });
//   const average = totalWeightedScore / totalWeight;
//   res.send({average }).status(200);
// });

// function for weighted average
// function calculateAverage(result) {
//   let totalWeightedScore = 0;
//   let totalWeight = 0;
//   let examScore = 0;
//   let homeworkScore = 0;
//   let quizScore = 0;
//   result.forEach((entry) => {
//     examScore = entry.scores
//       .filter((score) => score.type === "exam")
//       .reduce((sum, score) => sum + score.score, 0);
//     homeworkScore = entry.scores
//       .filter((score) => score.type === "homework")
//       .reduce((sum, score) => sum + score.score, 0);
//     quizScore = entry.scores
//       .filter((score) => score.type === "quiz")
//       .reduce((sum, score) => sum + score.score, 0);
//     const weightedScore =
//       examScore * EXAM_WEIGHT +
//       homeworkScore * HOMEWORK_WEIGHT +
//       quizScore * QUIZ_WEIGHT;
//     totalWeightedScore += weightedScore;
//     totalWeight += EXAM_WEIGHT + HOMEWORK_WEIGHT + QUIZ_WEIGHT;
//   });
//   const average = totalWeightedScore / totalWeight;
//   return average;
// }

// Get weighted average score for each class for a learner


// Create a single grade entry
router.post('/', async (req, res, next) => {
  try {
    let collection = await db.collection('grades');
    let newDocument = req.body;

    if (newDocument.student_id) {
      newDocument.learner_id = newDocument.student_id;
      delete newDocument.student_id;
    }

  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
  }
  catch (err) {
    next(err);
  }
})

// Add a score to a grade entry
router.patch('/:id/add', async (req, res, next) => {
  try {
    let collection = await db.collection('grades');
    let query = { _id: ObjectId.createFromHexString(req.params.id) };

    let result = await collection.updateOne(query, {
      $push: { scores: req.body }
    });

    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  } catch (err) {
    next(err);
  }
})

// Remove a score from a grade entry
router.patch('/:id/remove', async (req, res, next) => {
  try {
    let collection = db.collection("grades");
    let query = { _id: ObjectId.createFromHexString(req.params.id) }

    let result = await collection.updateOne(query, {
      $pull: { scores: req.body }
    })

    if (!result) res.send("Not Found").status(404)
    else res.send(result).status(200)
  } catch (err) {
    next(err)
  }
})

// Extra route to combine add/remove
// router.patch('/:id/:operation', async (req, res, next) => {
//   try {
//     let collection = await db.collection('grades');
//     let query = { _id: ObjectId.createFromHexString(req.params.id) };

//     let update = {};
//     if (req.params.operation === 'add') {
//       update["$push"] = { scores: req.body }

//     } else if (req.params.operation === 'remove') {
//       update["$pull"] = { scores: req.body }
//     } else {
//       res.status(400).send("Invalid operation");
//     }

//     let result = await collection.updateOne(query, {
//       $push: { scores: req.body }
//     });

//     if (!result) res.send("Not Found").status(404); // if not found
//     else res.send(result).status(200);
//   } catch (err) {
//     next(err);
//   }
// })

// Update a class id
router.patch("/class/:id", async (req, res, next) => {
  try {
    let collection = await db.collection("grades");
    let query = { class_id: Number(req.params.id) };

    let result = await collection.updateMany(query, {
      $set: { class_id: req.body.class_id },
    });

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
  }
  catch (err) {
    next(err);
  }
});


// Delete a single grade entry
router.delete('/:id', async (req, res, next) => {
  try {
    let collection = await db.collection('grades');
    let query = { _id: ObjectId.createFromHexString(req.params.id) };
    let result = await collection.deleteOne(query);

    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  }
  catch (err) {
    next(err);
  }
})

// Delete a class
router.delete("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a learner
router.delete("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };

  let result = await collection.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});


export default router;
