/* Single source of truth for Academy tactics. Kept data-only so it can be checked in Node too. */
const CHESS_ULTIMATE_PUZZLES = [
  {
    id: 'mate-one', title: 'Мат в один ход', concept: 'Матовая сетка ферзём',
    meta: 'Найдите немедленное завершение партии',
    fen: '7k/6pp/8/7Q/8/8/6PP/6K1 w - - 0 1', solution: ['h5e8'], answer: 'h5e8', claim: 'mate',
    success: 'Ферзь перекрывает королю все пути. Это чистый мат.',
    hint: 'Посмотрите на диагональ ферзя к восьмой горизонтали.'
  },
  {
    id: 'fork-queen', title: 'Вилка конём', concept: 'Шах с нападением на ферзя',
    meta: 'Поставьте шах и одновременно атакуйте ферзя',
    fen: '8/2q1k3/8/8/8/2N5/8/4K3 w - - 0 1', solution: ['c3d5'], answer: 'c3d5', claim: 'fork',
    success: 'Конь даёт шах королю e7 и одновременно атакует ферзя c7 — после ответа короля ферзь будет потерян.',
    hint: 'Конь с c3 может прыгнуть с темпом: найдите клетку, откуда он бьёт и короля, и ферзя.'
  },
  {
    id: 'rook-mate', title: 'Ладейный мат', concept: 'Король отрезает поля отхода',
    meta: 'Поставьте мат ладьёй при поддержке короля',
    fen: 'k1K5/8/1R6/8/8/8/8/8 w - - 0 1', solution: ['b6a6'], answer: 'b6a6', claim: 'mate',
    success: 'Ладья ставит мат по линии «a», а король c8 закрывает все поля побега.',
    hint: 'Поставьте ладью на вертикаль короля: ваш король уже контролирует пути отхода.'
  }
];

if (typeof window !== 'undefined') window.CHESS_ULTIMATE_PUZZLES = CHESS_ULTIMATE_PUZZLES;
if (typeof module !== 'undefined') module.exports = CHESS_ULTIMATE_PUZZLES;
