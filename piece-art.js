/* One filled, font-independent silhouette per piece. Both colours share geometry. */
(function(root){
  const shapes={
    p:'<circle cx="22.5" cy="13" r="4.5"/><path d="M18 19H27V22H25.5C25.5 27 27 30 29 32H16C18 30 19.5 27 19.5 22H18Z"/><path d="M16 32H29L31 36V38H14V36Z"/>',
    r:'<path d="M11 7H17V12H20V7H25V12H28V7H34V17L30 20V31L33 35V39H12V35L15 31V20L11 17Z"/><path d="M15 19H30M15 32H30" fill="none"/>',
    n:'<path d="M12 39V35C12 28 17 27 20 23L15 24L9 20L13 14L20 10L21 5L26 10C34 13 35 24 32 32L35 36V39Z"/><path d="M13 15L18 17M22 13L23 13M17 34H31" fill="none" stroke-linecap="round"/>',
    b:'<path d="M22.5 5C20 9 14 13 14 18C14 22 18 24 20 25L18 31H27L25 25C27 24 31 22 31 18C31 13 25 9 22.5 5Z"/><path d="M24 11L20 18" fill="none"/><path d="M17 31H28L32 36V39H13V36Z"/>',
    q:'<path d="M10 13L17 19L22.5 10L28 19L35 13L30 29H15Z"/><circle cx="10" cy="10" r="2.5"/><circle cx="22.5" cy="7" r="2.5"/><circle cx="35" cy="10" r="2.5"/><path d="M15 29H30V32L33 36V39H12V36L15 32Z"/><path d="M16 23H29M15 32H30" fill="none"/>',
    k:'<path d="M20 3H25V7H29V11H25V16H20V11H16V7H20Z"/><path d="M22.5 18C14 10 8 18 12 24L17 30H28L33 24C37 18 31 10 22.5 18Z"/><path d="M17 30H28L32 36V39H13V36Z"/><path d="M17 33H28" fill="none"/>'
  };
  root.PieceArt={markup(piece){
    if(!piece||!shapes[piece.toLowerCase()])return '';
    const side=piece===piece.toUpperCase()?'white':'black';
    const fill=side==='white'?'#fff7e5':'#202a31',stroke=side==='white'?'#504336':'#c0c7bd';
    return '<svg class="chess-piece-svg '+side+' type-'+piece.toLowerCase()+'" viewBox="0 0 45 45" aria-hidden="true" focusable="false"><g fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.3" stroke-linejoin="round">'+shapes[piece.toLowerCase()]+'</g></svg>';
  }};
})(typeof window!=='undefined'?window:globalThis);
