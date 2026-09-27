/* Pure helpers shared by the browser review and Node checks. Scores are from the moving side's view. */
const ReviewLogic = {
  scoreToCp(score) {
    if (!score) return 0;
    if (score.type === 'mate') return Math.sign(score.value || 1) * (100000 - Math.min(999, Math.abs(score.value || 1)));
    return Number(score.value) || 0;
  },
  label(loss, best, played) {
    const bestCp = this.scoreToCp(best), playedCp = this.scoreToCp(played);
    if ((best?.type === 'mate' && best.value > 0 && !(played?.type === 'mate' && played.value > 0)) || (played?.type === 'mate' && played.value < 0)) return 'BLUNDER';
    /* Do not call a harmless conversion in an already decisive position a blunder. */
    const practicalLoss = Math.abs(bestCp) > 700 && Math.abs(playedCp) > 700 && Math.sign(bestCp) === Math.sign(playedCp) ? loss * .45 : loss;
    if (practicalLoss <= 15) return 'BEST';
    if (practicalLoss <= 35) return 'EXCELLENT';
    if (practicalLoss <= 70) return 'GOOD';
    if (practicalLoss <= 140) return 'INACCURACY';
    if (practicalLoss <= 280) return 'MISTAKE';
    return 'BLUNDER';
  },
  human(label, bestMove, loss) {
    const move = bestMove ? ` Лучше было: ${bestMove}.` : '';
    const map = { BEST: 'Точный ход: позиция осталась под контролем.', EXCELLENT: 'Очень сильное практическое решение.', GOOD: 'Хороший ход, хотя движок видел небольшое улучшение.', INACCURACY: `Неточность: преимущество уменьшилось примерно на ${(loss / 100).toFixed(1)} пешки.`, MISTAKE: `Ошибка: позиция стала заметно хуже примерно на ${(loss / 100).toFixed(1)} пешки.`, BLUNDER: 'Зевок: ход резко изменил оценку позиции.' };
    return (map[label] || map.GOOD) + move;
  }
};
if (typeof window !== 'undefined') window.ReviewLogic = ReviewLogic;
if (typeof module !== 'undefined') module.exports = ReviewLogic;
