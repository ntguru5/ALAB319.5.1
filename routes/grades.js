import express from "express";
import db from "../db/conn.js";
// import { ObjectId } from "mongodb"; // class representing an ObjectId
import Grade from "../models/Grade.js";

const router = express.Router();

// get a single grade entry
router.get('/:id', async (req, res, next) => { // whoever is sending the request provides id
  try {
    const id = req.params.id;
    const grade = await Grade.findById(id);
    if (!grade) {
      res.status(404).json({ message: "Grade not found" });
    } else {
      res.json(grade);
    }
  } catch (err) {
    next(err);
  }
});

// Backwards compatibility for student/learner. Redirects student to learner
router.get('/student/:id', (req, res) => {
  res.redirect(`../learner/${req.params.id}`);
  })

// Get specific student
router.get('/learner/:id', async (req, res, next) => {
  try {
    const learnerId = req.params.id;
    const query = { learner_id: parseInt(learnerId) };
    if (req.query.class) {
      query.class_id = parseInt(req.query.class);
    }
    const grades = await Grade.find(query);
    res.json(grades);
  } catch (err) {
    next(err);
  }
});

// Get a class's grade data
router.get('/class/:id', async (req, res, next) => {
  try {
    const classId = req.params.id;
    const grades = await Grade.find({ class_id: parseInt(classId) });
    res.json(grades);
  } catch (err) {
    next(err);
  }
});

// get learner average for EACH class
router.get("/learner/:id/class/average", async (req, res, next) => {
  try {
    let query = { learner_id: parseInt(req.params.id) }
    let learnerGrades = await Grade.find(query)

    const averages = learnerGrades.reduce((acc, grade) => {
      let sum = 0;
      for (let i = 0; i < grade.scores.length; i++) {
        if (typeof grade.scores[i].score === 'number') {
          sum += grade.scores[i].score
        }
      }
      acc[grade.class_id] = sum / grade.scores.length
      return acc
    }, {})

    res.send(averages).status(200)

  } catch (err) {
    next(err)
  }
})

// const result = {
//   "350": 78.20938475,
//   "89": 90.9823754
// }


// to get overall average of a learner
router.get("/learner/:id/average", async (req, res, next) => {
  try {
    let query = { learner_id: parseInt(req.params.id) }
    let learnerGrades = await Grade.find(query)
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


// Create a single grade entry
router.post('/', async (req, res, next) => {
  try {
    let newDocument = req.body;
    if (newDocument.student_id) {
      newDocument.learner_id = newDocument.student_id;
      delete newDocument.student_id;
    }

    let result = await Grade.create(newDocument);
    res.send(result).status(204);
  }
  catch (err) {
    next(err);
  }
})

// Add a score to a grade entry
router.patch('/:id/add', async (req, res, next) => {
  try {
    let query = { _id: req.params.id };

    let result = await Grade.updateOne(query, {
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
    let query = { _id: req.params.id }

    let result = await Grade.updateOne(query, {
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
    let query = { class_id: parseInt(req.params.id) };

    let result = await Grade.updateMany(query, {
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
    let query = { _id: req.params.id };
    let result = await Grade.deleteOne(query);

    if (!result) res.send("Not Found").status(404); // if not found
    else res.send(result).status(200);
  }
  catch (err) {
    next(err);
  }
})

// Delete a class
router.delete("/class/:id", async (req, res) => {
  let query = { class_id: parseInt(req.params.id) };

  let result = await Grade.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a learner
router.delete("/learner/:id", async (req, res) => {
  let query = { learner_id: parseInt(req.params.id) };

  let result = await Grade.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200)
});


export default router;
