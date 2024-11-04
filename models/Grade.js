import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  type: String,
  score: Number
});

const gradeSchema = new mongoose.Schema({
  scores: [scoreSchema],
  class_id: Number,
  learner_id: Number
});

const Grade = mongoose.model('Grade', gradeSchema);

export default Grade;
