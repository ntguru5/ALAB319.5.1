// Create indexes
db.collection('grades').createIndex({ class_id: 1 });
db.collection('grades').createIndex({ learner_id: 1 });
db.collection('grades').createIndex({ learner_id: 1, class_id: 1 });

// Create validation rules
db.command({
  collMod: 'grades',
  validator: {
    $and: [
      { class_id: { $type: 'int', $gte: 0, $lte: 300 } },
      { learner_id: { $type: 'int', $gte: 0 } }
    ]
  },
  validationAction: 'warn',
  validationLevel: 'strict'
});
