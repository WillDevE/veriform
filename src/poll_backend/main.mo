// main.mo
import RBTree "mo:base/RBTree";
import Text "mo:base/Text";
import Array "mo:base/Array";

actor {
    // Data structure to store questions and answers
    var questions : RBTree.RBTree<Text, RBTree.RBTree<Text, Nat>> = RBTree.RBTree<Text, RBTree.RBTree<Text, Nat>>(Text.compare);

    // Add multiple answers at once
    public func addAnswers(answers : [(Text, Text)]) {
        for ((question, answer) in answers.vals()) {
            let answerTree = switch (questions.get(question)) {
                case null RBTree.RBTree<Text, Nat>(Text.compare);
                case (?existingTree) existingTree;
            };
            let currentCount = switch (answerTree.get(answer)) {
                case null 0;
                case (?count) count;
            };
            answerTree.put(answer, currentCount + 1);
            questions.put(question, answerTree);
        };
    };

    // Get all questions and their answers
    public query func getResults() : async [(Text, [(Text, Nat)])] {
        var results : [(Text, [(Text, Nat)])] = [];
        for ((question, answerTree) in questions.entries()) {
            var answers : [(Text, Nat)] = [];
            for ((answer, count) in answerTree.entries()) {
                answers := Array.append<(Text, Nat)>(answers, [(answer, count)]);
            };
            results := Array.append<(Text, [(Text, Nat)])>(results, [(question, answers)]);
        };
        results
    };

    // Clear all data
    public func clearData() {
        questions := RBTree.RBTree<Text, RBTree.RBTree<Text, Nat>>(Text.compare);
    };
};