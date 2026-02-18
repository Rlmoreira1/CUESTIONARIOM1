export const getRandomQuestions = (questions, count = 30) => {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questions.length));
};

export const calculateScore = (userAnswers, questions) => {
  let score = 0;
  const results = questions.map((q) => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer?.toLowerCase().trim() === q.answer.toLowerCase().trim();
    if (isCorrect) score++;
    return {
      ...q,
      userAnswer,
      isCorrect
    };
  });
  
  return {
    score,
    total: questions.length,
    percentage: (score / questions.length) * 100,
    results
  };
};
