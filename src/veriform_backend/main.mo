// main.mo
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Option "mo:base/Option";

actor {
  // Data structure to store questions
  var questions : Buffer.Buffer<(Text, Text, [Text])> = Buffer.Buffer<(Text, Text, [Text])>(0);

  // Data structure to store answers
  var answers : HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>> = HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>(0, Text.equal, Text.hash);

  // Add a new question
  public func addQuestion(questionType : Text, questionText : Text, options : [Text]) {
    questions.add((questionType, questionText, options));
  };

  // Get all questions
  public query func getQuestions() : async [(Text, Text, [Text])] {
    Buffer.toArray(questions);
  };

  // Add multiple answers at once
  public func addAnswers(newAnswers : [(Text, Text)]) {
    for ((question, answer) in newAnswers.vals()) {
      let answerMap = switch (answers.get(question)) {
        case null HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
        case (?existingMap) existingMap;
      };
      answerMap.put(answer, Option.get(answerMap.get(answer), 0) + 1);
      answers.put(question, answerMap);
    };
  };

  // Get all questions and their answers
  public query func getResults() : async [(Text, [(Text, Nat)])] {
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

  // Clear all data
  public func clearData() {
    questions.clear();
    answers := HashMap.HashMap<Text, HashMap.HashMap<Text, Nat>>(0, Text.equal, Text.hash);
  };
};