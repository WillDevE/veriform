import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Iter "mo:base/Iter";

// Backend actor (Motoko)
actor {
  // Data structure to store questions and answers for each set
  var questionSets : HashMap.HashMap<Text, (Buffer.Buffer<(Text, Text, [Text])>, HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>)> = HashMap.HashMap<Text, (Buffer.Buffer<(Text, Text, [Text])>, HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>)>(0, Text.equal, Text.hash);

  // Add a new question set
  public func addQuestionSet(setKey : Text) {
    questionSets.put(setKey, (Buffer.Buffer<(Text, Text, [Text])>(0), HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>(0, Text.equal, Text.hash)));
  };

  // Get all existing set keys
  public query func getExistingSets() : async [Text] {
    Iter.toArray(questionSets.keys());
  };

  // Add a new question to a specific set
  public func addQuestion(setKey : Text, questionType : Text, questionText : Text, options : [Text]) {
    switch (questionSets.get(setKey)) {
      case null {};
      case (?set) {
        let (questions, answers) = set;
        questions.add((questionType, questionText, options));
        questionSets.put(setKey, (questions, answers));
      };
    };
  };

  // Get all questions for a specific set
  public query func getQuestions(setKey : Text) : async [(Text, Text, [Text])] {
    switch (questionSets.get(setKey)) {
      case null [];
      case (?set) {
        let (questions, _) = set;
        Buffer.toArray(questions);
      };
    };
  };

  // Add multiple answers at once for a specific set
  public func addAnswers(setKey : Text, newAnswers : [(Text, Text)]) {
    switch (questionSets.get(setKey)) {
      case null {};
      case (?set) {
        let (_, answers) = set;
        for ((question, answer) in newAnswers.vals()) {
          let answerMap = switch (answers.get(question)) {
            case null HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
            case (?existingMap) existingMap;
          };
          answerMap.put(answer, Option.get(answerMap.get(answer), 0) + 1);
          answers.put(question, answerMap);
        };
        questionSets.put(setKey, (set.0, answers));
      };
    };
  };

  // Get all questions and their answers for a specific set
  public query func getResults(setKey : Text) : async [(Text, [(Text, Nat)])] {
    switch (questionSets.get(setKey)) {
      case null [];
      case (?set) {
        let (_, answers) = set;
        let results = Buffer.Buffer<(Text, [(Text, Nat)])>(answers.size());
        for ((question, answerMap) in answers.entries()) {
          let answerResults = Buffer.Buffer<(Text, Nat)>(answerMap.size());
          for ((answer, count) in answerMap.entries()) {
            answerResults.add((answer, count));
          };
          results.add((question, Buffer.toArray(answerResults)));
        };
        Buffer.toArray(results);
      };
    };
  };

  // Clear data for a specific set
  public func clearData(setKey : Text) {
    questionSets.put(setKey, (Buffer.Buffer<(Text, Text, [Text])>(0), HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>(0, Text.equal, Text.hash)));
  };
}