(function () {
  'use strict';

  var CARD_ID = 'chart-card';

  function saveCardAsPng() {
    var card = document.getElementById(CARD_ID);
    if (!card || typeof html2canvas !== 'function') return;

    html2canvas(card, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
      width: card.offsetWidth,
      height: card.offsetHeight,
      windowWidth: card.offsetWidth,
      windowHeight: card.offsetHeight
    }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'stat-kontakty.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  function init() {
    var btn = document.getElementById('save-png');
    if (btn) btn.addEventListener('click', saveCardAsPng);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
