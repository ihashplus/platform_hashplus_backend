export const calculateScore = (quizArray, data) => {
  let score = 0;

  for (const quiz of quizArray) {
    const answer = data.find((d) => d._id.toString() === quiz._id.toString());
    if (
      answer &&
      answer.answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()
    ) {
      score += 1;
    }
  }

  // update the quiz submission
  score = Math.round((score / quizArray.length) * 100);
  let status = score >= quizArray.length / 2 ? "pass" : "fail";

  return { score, status };
};
