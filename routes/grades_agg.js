import express from "express";
import db from "../db/conn.js";
import Grade from "../models/Grade.js";

const router = express.Router();

/**
 * It is not best practice to separate these routes
 * like we have done here. This file was created
 * specifically for educational purposes, to contain
 * all aggregation routes in one place.
 */

/**
 * Grading Weights by Score Type:
 * - Exams: 50%
 * - Quizzes: 30%
 * - Homework: 20%
 */

// Get the weighted average of a specified learner's grades, per class
// router.get("/learner/:id/avg-class", async (req, res) => {
//   let collection = await db.collection("grades");

//   let result = await collection
//     .aggregate([
//       {
//         $match: { learner_id: Number(req.params.id) },
//       },
//       {
//         $unwind: { path: "$scores" },
//       },
//       {
//         $group: {
//           _id: "$class_id",
//           quiz: {
//             $push: {
//               $cond: {
//                 if: { $eq: ["$scores.type", "quiz"] },
//                 then: "$scores.score",
//                 else: "$$REMOVE",
//               },
//             },
//           },
//           exam: {
//             $push: {
//               $cond: {
//                 if: { $eq: ["$scores.type", "exam"] },
//                 then: "$scores.score",
//                 else: "$$REMOVE",
//               },
//             },
//           },
//           homework: {
//             $push: {
//               $cond: {
//                 if: { $eq: ["$scores.type", "homework"] },
//                 then: "$scores.score",
//                 else: "$$REMOVE",
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           class_id: "$_id",
//           avg: {
//             $sum: [
//               { $multiply: [{ $avg: "$exam" }, 0.5] },
//               { $multiply: [{ $avg: "$quiz" }, 0.3] },
//               { $multiply: [{ $avg: "$homework" }, 0.2] },
//             ],
//           },
//         },
//       },
//     ])
//     .toArray();

//   if (!result) res.send("Not found").status(404);
//   else res.send(result).status(200);
// });
router.get("/learner/:id/avg-class", async (req, res) => {
  try {
    const learnerId = req.params.id;
    const grades = await Grade.aggregate([
      {
        $match: { learner_id: parseInt(learnerId) }
      },
      {
        $unwind: { path: "$scores" }
      },
      {
        $group: {
          _id: "$class_id",
          quiz: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "quiz"] },
                then: "$scores.score",
                else: "$$REMOVE"
              }
            }
          },
          exam: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "exam"] },
                then: "$scores.score",
                else: "$$REMOVE"
              }
            }
          },
          homework: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "homework"] },
                then: "$scores.score",
                else: "$$REMOVE"
              }
            }
          }
        }
      },
      {
        $addFields: {
          quizAvg: { $avg: "$quiz" },
          examAvg: { $avg: "$exam" },
          homeworkAvg: { $avg: "$homework" }
        }
      },
      {
        $project: {
          _id: 1,
          quizAvg: 1,
          examAvg: 1,
          homeworkAvg: 1
        }
      }
    ]);

    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching grades" });
  }
});

// Get grades statistics
router.get('/stats', async (req, res, next) => {
  try {
    let result = await Grade.aggregate([
      {
        $unwind: "$scores"
      },
      {
        $group: {
          _id: "$learner_id",
          examScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "exam"] }, "$scores.score", null]
            }
          },
          quizScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "quiz"] }, "$scores.score", null]
            }
          },
          homeworkScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "homework"] }, "$scores.score", null]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          weightedAverage: {
            $add: [
              { $multiply: ["$examScore", 0.6] },
              { $multiply: ["$quizScore", 0.3] },
              { $multiply: ["$homeworkScore", 0.1] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLearners: { $sum: 1 },
          learnersAbove50: { $sum: { $cond: [{ $gte: ["$weightedAverage", 50] }, 1, 0] } },
          totalAverage: { $sum: "$weightedAverage" }
        }
      },
      {
        $project: {
          totalLearners: 1,
          learnersAbove50: 1,
          percentageAbove50: {
            $multiply: [
              { $divide: ["$learnersAbove50", "$totalLearners"] },
              100
            ]
          },
          averageScore: {
            $divide: ["$totalAverage", "$totalLearners"]
          }
        }
      }
    ]);
    if (!result || result.length === 0) res.send("Not Found").status(404); // if not found
    else res.send(result[0]).status(200);
  } catch (err) {
    next(err);
  }
})

// Create GET route for learners within a class that has a class_id = :id
router.get('/stats/:id', async (req, res, next) => {
  try {
    let result = await Grade.aggregate([
      {
        $match: { class_id: parseInt(req.params.id) }
      },
      {
        $unwind: "$scores"
      },
      {
        $group: {
          _id: "$learner_id",
          examScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "exam"] }, "$scores.score", null]
            }
          },
          quizScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "quiz"] }, "$scores.score", null]
            }
          },
          homeworkScore: {
            $avg: {
              $cond: [{ $eq: ["$scores.type", "homework"] }, "$scores.score", null]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          weightedAverage: {
            $add: [
              { $multiply: ["$examScore", 0.6] },
              { $multiply: ["$quizScore", 0.3] },
              { $multiply: ["$homeworkScore", 0.1] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLearners: { $sum: 1 },
          learnersAbove50: { $sum: { $cond: [{ $gte: ["$weightedAverage", 50] }, 1, 0] } },
          totalAverage: { $sum: "$weightedAverage" }
        }
      },
      {
        $project: {
          totalLearners: 1,
          learnersAbove50: 1,
          percentageAbove50: {
            $multiply: [
              { $divide: ["$learnersAbove50", "$totalLearners"] },
              100
            ]
          },
          averageScore: {
            $divide: ["$totalAverage", "$totalLearners"]
          }
        }
      }
    ]);
    if (!result || result.length === 0) res.send("Not Found").status(404);
    else res.send(result[0]).status(200);
  } catch (err) {
    next(err);
  }
})

export default router;
