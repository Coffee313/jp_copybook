(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AnkiExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\r?\n/g, '<br>')
      .replace(/\t/g, ' ');
  }

  function buildDeck(items, deckName = 'Japanese Copybook::Kanji') {
    const header = [
      '#separator:Tab',
      '#html:true',
      '#deck column:1',
      '#tags column:4'
    ];
    const cards = items.map(item => {
      const meaning = `<div>${escapeHtml(item.translation)}</div>`;
      const reading = item.reading ? `<div>${escapeHtml(item.reading)}</div>` : '';
      const pitch = Number.isInteger(item.pitchAccent) ? `<div>Pitch accent: ${item.pitchAccent}</div>` : '';
      const note = item.note ? `<div><br>${escapeHtml(item.note)}</div>` : '';
      return [
        deckName.replace(/[\t\r\n]/g, ' '),
        escapeHtml(item.character),
        `${reading}${meaning}${pitch}${note}`,
        'Japanese_Copybook Kanji'
      ].join('\t');
    });
    return [...header, ...cards].join('\n');
  }

  return { buildDeck, escapeHtml };
});
