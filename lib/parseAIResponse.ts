export interface QAPair {
    question: string;
    answer: string;
}

export const parseAIResponse = (response: string): QAPair[] => {
    const qaPairs: QAPair[] = [];
    const lines = response.split("\n").filter(line => line.trim());
    
    let currentQuestion = '';
    let currentAnswer = '';

    for (let line of lines) {
        if (line.startsWith("Cal Newport")) {
            if (currentQuestion && currentAnswer) {
                qaPairs.push({ question: currentQuestion, answer: currentAnswer.trim() });
            }
            currentQuestion = line.trim();
            currentAnswer = '';
        } else {
            currentAnswer += line + "\n";
        }
    }
    if (currentQuestion && currentAnswer) {
        qaPairs.push({ question: currentQuestion, answer: currentAnswer.trim() });
    }
    return qaPairs;
};
