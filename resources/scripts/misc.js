// turns is-link elements into links. uses data-href

document.querySelectorAll('.is-link').forEach(element => {
  element.addEventListener('click', () => {
    const url = element.dataset.href;
    window.open(url, '_blank');
  });

  element.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const url = element.dataset.href;
      window.open(url, '_blank');
    }
  });
});