define(['dt'], function(dt) {

  return () => {
    console.log('dt',dt);
    // Training set
    var data =
        [{person: 'Homer', hairLength: 0, weight: 250, age: 36, sex: 'male'},
         {person: 'Marge', hairLength: 10, weight: 150, age: 34, sex: 'female'},
         {person: 'Bart', hairLength: 2, weight: 90, age: 10, sex: 'male'},
         {person: 'Lisa', hairLength: 6, weight: 78, age: 8, sex: 'female'},
         {person: 'Maggie', hairLength: 4, weight: 20, age: 1, sex: 'female'},
         {person: 'Abe', hairLength: 1, weight: 170, age: 70, sex: 'male'},
         {person: 'Selma', hairLength: 8, weight: 160, age: 41, sex: 'female'},
         {person: 'Otto', hairLength: 10, weight: 180, age: 38, sex: 'male'},
         {person: 'Krusty', hairLength: 6, weight: 200, age: 45, sex: 'male'}];

    // Configuration
    var config = {
        trainingSet: data,
        categoryAttr: 'sex',
        ignoredAttributes: ['person']
    };

    // Building Decision Tree
    var decisionTree = new dt.DecisionTree(config);

    // Building Random Forest
    var numberOfTrees = 3;
    var randomForest = new dt.RandomForest(config, numberOfTrees);

    // Testing Decision Tree and Random Forest
    var comic = {person: 'Comic guy', hairLength: 8, weight: 290, age: 38};

    var decisionTreePrediction = decisionTree.predict(comic);
    var randomForestPrediction = randomForest.predict(comic);

    console.log('dt predict',decisionTreePrediction);
    console.log('rf predict',randomForestPrediction);
  };
});
